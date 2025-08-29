
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

export async function processReportAction(reportDataUri: string, fileType: string, fileContent: string) {
  try {
    const summaryResult = await summarizeMedicalReport({ reportDataUri });
    const highlightedResult = await highlightAbnormalResults({ reportSummary: summaryResult.summary });
    
    let originalText;
    if (fileType.startsWith('text/')) {
      originalText = fileContent;
    }

    return {
      success: true,
      summary: summaryResult.summary,
      highlightedSummary: highlightedResult.highlightedSummary,
      originalText,
    };
  } catch (error) {
    console.error('Error processing report:', error);
    return { success: false, error: 'Failed to process the report. Please try again.' };
  }
}

export async function askQuestionAction(context: string, question: string) {
    try {
        const result = await answerReportQuestionsViaChat({ reportText: context, question });
        return { success: true, answer: result.answer };
    } catch (error) {
        console.error('Error asking question:', error);
        return { success: false, error: 'Failed to get an answer. Please try again.' };
    }
}
