
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
import type { Report, Message, UserProfile, AssistantChat } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, auth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function processReportAction(userId: string, reportDataUri: string, fileType: string, fileContent: string, fileName:string) {
  try {
    const summaryResult = await summarizeMedicalReport({ reportDataUri });
    const highlightedResult = await highlightAbnormalResults({ summary: summaryResult.summary });
    
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

    const docRef = await db.collection('reports').add(newReport);
    
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
    try {
        const result = await answerReportQuestionsViaChat({ reportText: context, question });
        const userMessage: Message = { role: 'user', content: question, createdAt: new Date() };
        const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date() };

        const reportRef = db.collection('reports').doc(reportId);
        await reportRef.update({
            chatHistory: FieldValue.arrayUnion(userMessage, assistantMessage)
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
    try {
        const result = await healthAssistant({ question, history: existingHistory });

        const userMessage: Message = { role: 'user', content: question, createdAt: new Date() };
        const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date() };
        
        const chatRef = db.collection('assistantChats').doc(userId);
        const chatDoc = await chatRef.get();

        if (chatDoc.exists) {
             await chatRef.update({
                history: FieldValue.arrayUnion(userMessage, assistantMessage),
                updatedAt: new Date(),
            });
        } else {
             await chatRef.set({
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

export async function deleteAssistantChatAction(userId: string) {
    if (!userId) {
        return { success: false, error: 'User not found.' };
    }
    try {
        const chatRef = db.collection('assistantChats').doc(userId);
        await chatRef.delete();
        
        revalidatePath('/assistant');
        revalidatePath('/history');

        return { success: true };
    } catch (error) {
        console.error('Error deleting assistant chat:', error);
        return { success: false, error: 'Failed to delete chat history.' };
    }
}

export async function getAssistantChatAction(userId: string): Promise<{ success: boolean; chat?: AssistantChat | null; error?: string; }> {
    if (!userId) {
        return { success: true, chat: null };
    }
    try {
        const assistantChatRef = db.collection('assistantChats').doc(userId);
        const assistantChatDoc = await assistantChatRef.get();

        if (assistantChatDoc.exists) {
            const chatData = assistantChatDoc.data();
            if (!chatData) return { success: true, chat: null };

            const chat: AssistantChat = {
                userId,
                history: chatData.history.map((msg: any) => ({
                    ...msg,
                    createdAt: (msg.createdAt as Timestamp).toDate()
                })),
                createdAt: (chatData.createdAt as Timestamp).toDate(),
                updatedAt: (chatData.updatedAt as Timestamp).toDate(),
            };
            return { success: true, chat };
        } else {
            return { success: true, chat: null };
        }
    } catch (error) {
        console.error('Error fetching assistant chat:', error);
        return { success: false, error: 'Failed to fetch assistant chat.' };
    }
}


export async function getReportsAction(userId: string): Promise<{ success: boolean; reports?: Report[]; error?: string; }> {
    if (!userId) {
        return { success: true, reports: [] };
    }
    try {
        const reportsRef = db.collection('reports');
        const q = reportsRef.where('userId', '==', userId).orderBy('createdAt', 'desc');
        const querySnapshot = await q.get();
        const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        return { success: true, reports };
    } catch (error) {
        console.error('Error fetching reports:', error);
        return { success: false, error: 'Failed to fetch reports.' };
    }
}

export async function getHistoryAction(userId: string): Promise<{ success: boolean; reports?: Report[]; assistantChat?: AssistantChat | null; error?: string; }> {
    if (!userId) {
        return { success: true, reports: [], assistantChat: null };
    }
    try {
        const reportsRef = db.collection('reports');
        const reportsQuery = reportsRef.where('userId', '==', userId).orderBy('createdAt', 'desc');
        const reportsSnapshot = await reportsQuery.get();
        const reports = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
        
        const assistantChatRef = db.collection('assistantChats').doc(userId);
        const assistantChatDoc = await assistantChatRef.get();
        const assistantChat = assistantChatDoc.exists ? { ...assistantChatDoc.data(), userId } as AssistantChat : null;

        return { success: true, reports, assistantChat };
    } catch (error) {
        console.error('Error fetching history:', error);
        return { success: false, error: 'Failed to fetch history.' };
    }
}


export async function getUserProfileAction(userId: string): Promise<{ success: boolean; profile?: UserProfile; error?: string; }> {
    if (!userId) {
        return { success: false, error: 'User not found' };
    }
    try {
        const userRecord = await auth.getUser(userId);
        const firestoreUserDoc = await db.collection('users').doc(userId).get();
        
        if (!firestoreUserDoc.exists) {
            return { success: false, error: 'User profile not found in database.' };
        }

        const profileData = firestoreUserDoc.data();
        
        if (!profileData) {
            return { success: false, error: 'User profile data is empty.' };
        }

        const createdAt = (profileData.createdAt as Timestamp).toDate().toISOString();

        const profile: UserProfile = {
            uid: profileData.uid,
            email: userRecord.email!,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            createdAt: createdAt,
        };
        
        return { success: true, profile: profile };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return { success: false, error: 'Failed to fetch user profile.' };
    }
}

export async function healthCheck(): Promise<boolean> {
    try {
        const docRef = db.collection('health_check').doc('status');
        await docRef.set({ status: 'ok', timestamp: FieldValue.serverTimestamp() });
        await docRef.get();
        return true;
    } catch (error) {
        console.error("Firebase health check failed:", error);
        return false;
    }
}
