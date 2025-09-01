'use server';
/**
 * @fileOverview A conversational AI agent for answering health-related questions.
 *
 * - healthAssistant - A function that handles the question answering process.
 * - HealthAssistantInput - The input type for the healthAssistant function.
 * - HealthAssistantOutput - The return type for the healthAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const HealthAssistantInputSchema = z.object({
  question: z.string().describe("The user's current health-related question."),
  history: z.array(MessageSchema).optional().describe("The previous conversation history."),
});
export type HealthAssistantInput = z.infer<typeof HealthAssistantInputSchema>;

const HealthAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI-powered answer to the user's question."),
});
export type HealthAssistantOutput = z.infer<typeof HealthAssistantOutputSchema>;

export async function healthAssistant(input: HealthAssistantInput): Promise<HealthAssistantOutput> {
  return healthAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthAssistantPrompt',
  input: { schema: HealthAssistantInputSchema },
  output: { schema: HealthAssistantOutputSchema },
  prompt: `You are an AI Health Assistant. Your role is to provide clear, evidence-based, and empathetic answers to health-related questions. You must also be supportive and kind when responding to questions about moral and mental health.

  You will be given the conversation history and a new question from the user. Use the history to provide a conversational and context-aware answer.

  IMPORTANT: You are not a replacement for a real medical professional. Always end your response with a clear disclaimer: "This is for educational purposes only. Always consult a healthcare professional for medical advice."

  Conversation History:
  {{#each history}}
    {{role}}: {{content}}
  {{/each}}

  User's New Question:
  {{question}}`,
});

const healthAssistantFlow = ai.defineFlow(
  {
    name: 'healthAssistantFlow',
    inputSchema: HealthAssistantInputSchema,
    outputSchema: HealthAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
