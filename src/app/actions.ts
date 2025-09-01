
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
import { collection, addDoc, doc, updateDoc, arrayUnion, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Report, Message } from '@/types';

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
