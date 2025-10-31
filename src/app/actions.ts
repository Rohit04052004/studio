
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
import type { Report, Message, UserProfile, AssistantChat, SourceDocument } from '@/types';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db, auth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';

export async function processReportsAction(userId: string, reports: {name: string, dataUri: string}[]) {
  try {
    if (reports.length === 0) {
      return { success: false, error: 'No reports provided.' };
    }

    let newReport: Partial<Report>;
    
    // If only one report is uploaded, use the existing single-report logic
    if (reports.length === 1) {
      const { name, dataUri } = reports[0];
      const isImageFile = dataUri.startsWith('data:image');
      
      const summaryResult = await summarizeMedicalReport({ reports: [{ reportDataUri: dataUri }] });
      const highlightedResult = await highlightAbnormalResults({ reportSummary: summaryResult.summary });
      
      const fileContent = isImageFile ? dataUri : Buffer.from(dataUri.split(',')[1], 'base64').toString('utf-8');

      newReport = {
        userId,
        name: name,
        type: isImageFile ? 'image' : 'text',
        summary: summaryResult.summary,
        highlightedSummary: highlightedResult.highlightedSummary,
        chatHistory: [],
        createdAt: FieldValue.serverTimestamp(),
      };
      
       if (isImageFile) {
        newReport.content = fileContent;
      } else {
        newReport.originalText = fileContent;
      }

    } else { // Multiple reports for a unified summary
        const summaryResult = await summarizeMedicalReport({ reports: reports.map(r => ({ reportDataUri: r.dataUri })) });
        const highlightedResult = await highlightAbnormalResults({ reportSummary: summaryResult.summary });

        const sourceDocuments: SourceDocument[] = reports.map(r => ({
            name: r.name,
            content: r.dataUri,
            type: r.dataUri.startsWith('data:image') ? 'image' : 'text',
        }));

        newReport = {
            userId,
            name: `Unified Summary of ${reports.length} Reports`,
            type: 'summary',
            summary: summaryResult.summary,
            highlightedSummary: highlightedResult.highlightedSummary,
            sourceDocuments,
            chatHistory: [],
            createdAt: FieldValue.serverTimestamp(),
        };
    }

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
                    name: `Archived AI Assistant Chat`,
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

export async function deleteReportAction(reportId: string) {
    if (!reportId) {
        return { success: false, error: 'Report ID is required.' };
    }
    try {
        const reportRef = db.collection('reports').doc(reportId);
        await reportRef.delete();
        
        revalidatePath('/reports');
        revalidatePath('/history');

        return { success: true };
    } catch (error) {
        console.error('Error deleting report:', error);
        return { success: false, error: 'Failed to delete report.' };
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

// Helper to safely convert a Firestore timestamp or string to an ISO string
const safeToISOString = (dateValue: any): string => {
    if (!dateValue) return new Date().toISOString(); // Fallback
    if (dateValue.toDate) { // It's a Firestore Timestamp
        return dateValue.toDate().toISOString();
    }
    if (typeof dateValue === 'string') {
        // If it's already a string, assume it's valid or try to parse it
        return new Date(dateValue).toISOString();
    }
    if (dateValue instanceof Date) {
        return dateValue.toISOString();
    }
    // Fallback for other unexpected types
    return new Date().toISOString();
};


export async function getHistoryAction(userId: string): Promise<{ success: boolean; reports?: Report[]; assistantChat?: AssistantChat | null; error?: string; }> {
    if (!userId) {
        console.log("getHistoryAction: No user ID provided.");
        return { success: true, reports: [], assistantChat: null };
    }
    try {
        // Fetch all reports
        const reportsRef = db.collection('reports');
        const reportsQuery = reportsRef.where('userId', '==', userId);
        const reportsSnapshot = await reportsQuery.get();
        
        let reports: Report[] = [];
        reportsSnapshot.docs.forEach(doc => {
            try {
                const data = doc.data();
                const reportItem = {
                    id: doc.id,
                    ...data,
                    createdAt: safeToISOString(data.createdAt),
                    chatHistory: (data.chatHistory || []).map((msg: any) => ({
                        ...msg,
                        createdAt: safeToISOString(msg.createdAt)
                    }))
                } as unknown as Report;
                reports.push(reportItem);
            } catch (mapError) {
                console.error(`Error processing report doc ${doc.id}:`, mapError);
                // Skip this document if it causes an error
            }
        });

        // Sort in code instead of in the query
        reports.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        
        // Fetch the current active assistant chat
        const assistantChatRef = db.collection('assistantChats').doc(userId);
        const assistantChatDoc = await assistantChatRef.get();
        let assistantChat: AssistantChat | null = null;

        if (assistantChatDoc.exists) {
            try {
                const chatData = assistantChatDoc.data();
                if (chatData) {
                    assistantChat = {
                        userId,
                        history: (chatData.history || []).map((msg: any) => ({
                             ...msg, 
                             createdAt: safeToISOString(msg.createdAt) 
                        })),
                        createdAt: safeToISOString(chatData.createdAt),
                        updatedAt: safeToISOString(chatData.updatedAt),
                    } as unknown as AssistantChat;
                }
            } catch (chatError) {
                console.error(`Error processing assistant chat for user ${userId}:`, chatError);
                // assistantChat remains null
            }
        }

        return { success: true, reports, assistantChat };
    } catch (error) {
        console.error('Error fetching history:', error);
        return { success: false, error: 'Failed to fetch history.', reports: [], assistantChat: null };
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

export async function updateUserProfileAction(userId: string, data: { firstName: string; lastName: string; }): Promise<{ success: boolean; error?: string; }> {
    if (!userId) {
        return { success: false, error: 'User not found' };
    }
    try {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
            firstName: data.firstName,
            lastName: data.lastName,
        });

        revalidatePath('/profile');
        
        return { success: true };
    } catch (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: 'Failed to update user profile.' };
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

    