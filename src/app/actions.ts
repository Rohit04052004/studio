
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
import { format } from 'date-fns';

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
      content: fileType.startsWith('image/') ? reportDataUri : undefined, // Don't store text content in top-level `content` field
      summary: summaryResult.summary,
      highlightedSummary: highlightedResult.highlightedSummary,
      originalText,
      chatHistory: [],
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('reports').add(newReport);
    
    revalidatePath('/reports');
    revalidatePath('/history');
    
    const docSnap = await docRef.get();
    const createdReport = docSnap.data() as Report;

    return {
      success: true,
      report: { 
        ...createdReport, 
        id: docRef.id,
        // Convert Timestamp to string for serialization
        createdAt: (createdReport.createdAt as unknown as Timestamp).toDate().toISOString(),
      } as Report,
    };
  } catch (error: any) {
    console.error('Error processing report:', error);
    return { success: false, error: error.message || 'Failed to process the report. Please try again.' };
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

export async function archiveAssistantChatAction(userId: string) {
    if (!userId) {
        return { success: false, error: 'User not found.' };
    }
    try {
        const chatRef = db.collection('assistantChats').doc(userId);
        const chatDoc = await chatRef.get();

        if (chatDoc.exists) {
            const chatData = chatDoc.data() as AssistantChat;
            if (chatData.history && chatData.history.length > 0) {
                 // Create a new report document to archive the chat
                const archiveReport: Omit<Report, 'id'> = {
                    userId,
                    name: `AI Assistant Chat - ${format(new Date(), 'PP p')}`,
                    type: 'assistant',
                    chatHistory: chatData.history,
                    createdAt: chatData.updatedAt, // Use the last updated time as creation time
                };
                await db.collection('reports').add(archiveReport);
            }
            // Delete the active chat session
            await chatRef.delete();
        }
        
        revalidatePath('/assistant');
        revalidatePath('/history');

        return { success: true };
    } catch (error) {
        console.error('Error archiving assistant chat:', error);
        return { success: false, error: 'Failed to archive chat history.' };
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

            // Data is serialized for the client, so we send ISO strings
            const chat: AssistantChat = {
                userId,
                history: chatData.history.map((msg: any) => ({
                    ...msg,
                    createdAt: (msg.createdAt as Timestamp).toDate().toISOString()
                })),
                createdAt: (chatData.createdAt as Timestamp).toDate().toISOString(),
                updatedAt: (chatData.updatedAt as Timestamp).toDate().toISOString(),
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
        const q = reportsRef.where('userId', '==', userId);
        const querySnapshot = await q.get();
        const reports = querySnapshot.docs.map(doc => {
             const data = doc.data();
             return { 
                id: doc.id, 
                ...data,
                // Ensure chatHistory has serialized dates
                chatHistory: (data.chatHistory || []).map((msg: any) => ({
                    ...msg,
                    createdAt: (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)).toISOString()
                })),
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
             } as unknown as Report
        });

        // Sort reports in code to avoid needing a composite index
        reports.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

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
        // Fetch all reports, including the newly archived assistant chats
        const reportsRef = db.collection('reports');
        // REMOVED ORDER BY TO AVOID NEEDING A COMPOSITE INDEX
        const reportsQuery = reportsRef.where('userId', '==', userId);
        const reportsSnapshot = await reportsQuery.get();
        let reports = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data,
                // Ensure createdAt is a string for client-side hydration
                createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
                chatHistory: data.chatHistory?.map((msg: any) => ({
                    ...msg,
                    createdAt: (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)).toISOString()
                })) || []
            } as unknown as Report;
        });

        // Sort in code instead of in the query
        reports = reports.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        
        // Fetch the current active assistant chat, if it exists
        const assistantChatRef = db.collection('assistantChats').doc(userId);
        const assistantChatDoc = await assistantChatRef.get();
        let assistantChat: AssistantChat | null = null;
        if (assistantChatDoc.exists) {
            const chatData = assistantChatDoc.data();
            if (chatData) {
                assistantChat = {
                    userId,
                    history: chatData.history.map((msg: any) => ({ ...msg, createdAt: (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)).toISOString() })),
                    createdAt: (chatData.createdAt.toDate ? chatData.createdAt.toDate() : new Date(chatData.createdAt)).toISOString(),
                    updatedAt: (chatData.updatedAt.toDate ? chatData.updatedAt.toDate() : new Date(chatData.updatedAt)).toISOString(),
                } as unknown as AssistantChat
            }
        }

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

    