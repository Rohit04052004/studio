
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
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion, getDocs, query, where, orderBy, setDoc } from 'firebase/firestore';
import type { Report, Message, UserProfile } from '@/types';
import { auth } from '@/lib/firebase-admin';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const SignUpSchema = z.object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long." })
});

export async function signUpAction(values: z.infer<typeof SignUpSchema>) {
    const validation = SignUpSchema.safeParse(values);
    if (!validation.success) {
        return { success: false, error: validation.error.flatten() };
    }
    
    const { email, password, firstName, lastName } = values;

    try {
        if (typeof auth.createUser !== 'function') {
          throw new Error('Firebase Admin SDK is not initialized. Missing credentials.');
        }

        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });

        const userProfile: UserProfile = {
            uid: userRecord.uid,
            email,
            firstName,
            lastName,
            createdAt: new Date(),
        };

        await setDoc(doc(db, 'users', userRecord.uid), userProfile);

        return { success: true, userId: userRecord.uid };
    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'This email address is already in use by another account.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        return { success: false, error: { formErrors: [errorMessage], fieldErrors: {} } };
    }
}

export async function processReportAction(userId: string, reportDataUri: string, fileType: string, fileContent: string, fileName: string) {
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
    try {
        const result = await answerReportQuestionsViaChat({ reportText: context, question });
        const userMessage: Message = { role: 'user', content: question, createdAt: new Date() };
        const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date() };

        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, {
            chatHistory: arrayUnion(userMessage, assistantMessage)
        });
        revalidatePath('/reports');
        return { success: true, answer: result.answer };
    } catch (error) {
        console.error('Error asking question:', error);
        return { success: false, error: 'Failed to get an answer. Please try again.' };
    }
}

export async function askHealthAssistantAction(userId: string, question: string, existingHistory: Message[]) {
    try {
        const result = await healthAssistant({ question });

        const userMessage: Message = { role: 'user', content: question, createdAt: new Date() };
        const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date() };

        // For simplicity, we're not saving assistant chats to DB yet.
        // This would be the place to add it.
        
        return { success: true, answer: result.answer, newMessages: [userMessage, assistantMessage] };
    } catch (error) {
        console.error('Error asking health assistant:', error);
        return { success: false, error: 'Failed to get an answer. Please try again.' };
    }
}

export async function getReportsAction(userId: string): Promise<{ success: boolean; reports?: Report[]; error?: string; }> {
    if (!userId) {
        return { success: true, reports: [] };
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

export async function getUserProfileAction(userId: string): Promise<{ success: boolean; profile?: UserProfile; error?: string; }> {
    if (!userId) {
        return { success: false, error: 'User not found' };
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
