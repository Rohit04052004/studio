'use server';
/**
 * @fileOverview An AI agent that answers questions about medical reports via a chat interface.
 *
 * - answerReportQuestionsViaChat - A function that handles the question answering process.
 * - AnswerReportQuestionsViaChatInput - The input type for the answerReportQuestionsViaChat function.
 * - AnswerReportQuestionsViaChatOutput - The return type for the answerReportQuestionsViaChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerReportQuestionsViaChatInputSchema = z.object({
  reportText: z
    .string()
    .describe('The full text of the medical report.'),
  question: z.string().describe('The user question about the medical report.'),
});
export type AnswerReportQuestionsViaChatInput = z.infer<typeof AnswerReportQuestionsViaChatInputSchema>;

const AnswerReportQuestionsViaChatOutputSchema = z.object({
  answer: z.string().describe('The AI-powered answer to the user question.'),
});
export type AnswerReportQuestionsViaChatOutput = z.infer<typeof AnswerReportQuestionsViaChatOutputSchema>;

export async function answerReportQuestionsViaChat(input: AnswerReportQuestionsViaChatInput): Promise<AnswerReportQuestionsViaChatOutput> {
  return answerReportQuestionsViaChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerReportQuestionsViaChatPrompt',
  input: {schema: AnswerReportQuestionsViaChatInputSchema},
  output: {schema: AnswerReportQuestionsViaChatOutputSchema},
  prompt: `You are a medical assistant who answers questions about medical reports.

  You will be given a medical report and a question from the user.
  Answer the question based on the information in the medical report.

  Medical Report:
  {{reportText}}

  Question:
  {{question}}`,
});

const answerReportQuestionsViaChatFlow = ai.defineFlow(
  {
    name: 'answerReportQuestionsViaChatFlow',
    inputSchema: AnswerReportQuestionsViaChatInputSchema,
    outputSchema: AnswerReportQuestionsViaChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
