
'use server';

import {
  summarizeMedicalReport,
} from '@/ai/flows/summarize-medical-reports';
import {
  highlightAbnormalResults,
} from '@/ai/flows/highlight-abnormal-results';
import {
  answerReportQuestionsViaChat,
} from '@/ai/flows/answer-report-questions-via-chat';
import { healthAssistant } from '@/ai/flows/health-assistant-flow';
import { getDb, getAuth } from '@/lib/firebase-admin';
import { collection, addDoc, doc, updateDoc, arrayUnion, getDocs, query, where, orderBy, setDoc, getDoc } from 'firebase/firestore';
import type { Report, Message, UserProfile, AssistantChat } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const SignUpSchema = z.object({
    uid: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
});

export async function signUpAction(values: z.infer<typeof SignUpSchema>) {
    const db = getDb();
    if (!db) {
      return { success: false, error: "Database service is not initialized. Cannot save user profile." };
    }
    
    try {
        const userProfile: UserProfile = {
          uid: values.uid,
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          createdAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', values.uid), userProfile);
      return { success: true };

    } catch (error) {
        console.error("Error in signUpAction:", error);
        return { success: false, error: "Failed to save user profile to the database." };
    }
}

export async function processReportAction(userId: string, reportDataUri: string, fileType: string, fileContent: string, fileName:string) {
  const db = getDb();
  if (!db) {
    return { success: false, error: 'Database service is unavailable.' };
  }
  try {
    const summaryResult = await summarizeMedicalReport({ reportDataUri });
    const highlightedResult = await highlightAbnormalResults({ reportSummary: summaryResult.summary });
    
    let originalText;
    if (fileType.startsWith('text/')) {
      originalText = fileContent;
    }

    const newReport: Omit<Report, 'id'> = {
      userId,
      name: fileName,
      type: fileType.startsWith('image/') ? 'image' : 'text',
      content: fileType.startsWith('image/') ? reportDataUri : fileContent,
      summary: summaryResult.summary,
      highlightedSummary: highlightedResult.highlightedSummary,
      originalText,
      chatHistory: [],
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'reports'), newReport);
    
    revalidatePath('/reports');
    revalidatePath('/history');

    return {
      success: true,
      report: { ...newReport, id: docRef.id } as Report,
    };
  } catch (error) {
    console.error('Error processing report:', error);
    return { success: false, error: 'Failed to process the report. Please try again.' };
  }
}

export async function askQuestionAction(reportId: string, context: string, question: string) {
    const db = getDb();
    if (!db) {
      return { success: false, error: 'Database service is unavailable.' };
    }
    try {
        const result = await answerReportQuestionsViaChat({ reportText: context, question });
        const userMessage: Message = { role: 'user', content: question, createdAt: new Date() };
        const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date() };

        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, {
            chatHistory: arrayUnion(userMessage, assistantMessage)
        });
        revalidatePath('/reports');
        revalidatePath('/history');
        return { success: true, answer: result.answer };
    } catch (error) {
        console.error('Error asking question:', error);
        return { success: false, error: 'Failed to get an answer. Please try again.' };
    }
}

export async function askHealthAssistantAction(userId: string, question: string, existingHistory: Message[]) {
    const db = getDb();
    if (!db) {
      return { success: false, error: 'Database service is unavailable.' };
    }
    try {
        const result = await healthAssistant({ question, history: existingHistory });

        const userMessage: Message = { role: 'user', content: question, createdAt: new Date() };
        const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date() };
        
        const chatRef = doc(db, 'assistantChats', userId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
             await updateDoc(chatRef, {
                history: arrayUnion(userMessage, assistantMessage),
                updatedAt: new Date(),
            });
        } else {
             await setDoc(chatRef, {
                userId,
                history: [userMessage, assistantMessage],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        revalidatePath('/assistant');
        revalidatePath('/history');
        
        return { success: true, answer: result.answer, newMessages: [userMessage, assistantMessage] };
    } catch (error) {
        console.error('Error asking health assistant:', error);
        return { success: false, error: 'Failed to get an answer. Please try again.' };
    }
}

export async function getReportsAction(userId: string): Promise<{ success: boolean; reports?: Report[]; error?: string; }> {
    const db = getDb();
    if (!userId) {
        return { success: true, reports: [] };
    }
    if (!db) {
      return { success: false, error: 'Database service is unavailable.' };
    }
    try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        return { success: true, reports };
    } catch (error) {
        console.error('Error fetching reports:', error);
        return { success: false, error: 'Failed to fetch reports.' };
    }
}

export async function getHistoryAction(userId: string): Promise<{ success: boolean; reports?: Report[]; assistantChat?: AssistantChat | null; error?: string; }> {
    const db = getDb();
    if (!userId) {
        return { success: true, reports: [], assistantChat: null };
    }
    if (!db) {
      return { success: false, error: 'Database service is unavailable.' };
    }
    try {
        const reportsRef = collection(db, 'reports');
        const reportsQuery = query(reportsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const reportsSnapshot = await getDocs(reportsQuery);
        const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        
        const assistantChatRef = doc(db, 'assistantChats', userId);
        const assistantChatDoc = await getDoc(assistantChatRef);
        const assistantChat = assistantChatDoc.exists() ? { ...assistantChatDoc.data(), userId } as AssistantChat : null;

        return { success: true, reports, assistantChat };
    } catch (error) {
        console.error('Error fetching history:', error);
        return { success: false, error: 'Failed to fetch history.' };
    }
}


export async function getUserProfileAction(userId: string): Promise<{ success: boolean; profile?: UserProfile; error?: string; }> {
    const auth = getAuth();
    const db = getDb();
    if (!userId) {
        return { success: false, error: 'User not found' };
    }
     if (!auth || !db) {
        return { success: false, error: 'Authentication or database service is unavailable.' };
    }
    try {
        const userDoc = await auth.getUser(userId);
        const firestoreUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
        
        if (firestoreUserDoc.empty) {
            return { success: false, error: 'User profile not found in database.' };
        }

        const profile = firestoreUserDoc.docs[0].data() as UserProfile;
        
        return { success: true, profile };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return { success: false, error: 'Failed to fetch user profile.' };
    }
}
