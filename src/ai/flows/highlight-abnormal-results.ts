'use server';
/**
 * @fileOverview A flow to highlight abnormal results in a medical report summary.
 *
 * - highlightAbnormalResults - A function that takes a medical report summary and highlights abnormal results.
 * - HighlightAbnormalResultsInput - The input type for the highlightAbnormalResults function.
 * - HighlightAbnormalResultsOutput - The return type for the highlightAbnormalResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HighlightAbnormalResultsInputSchema = z.object({
  reportSummary: z
    .string()
    .describe('The summary of the medical report to highlight abnormal results in.'),
});
export type HighlightAbnormalResultsInput = z.infer<typeof HighlightAbnormalResultsInputSchema>;

const HighlightAbnormalResultsOutputSchema = z.object({
  highlightedSummary: z
    .string()
    .describe('The summary of the medical report with abnormal results highlighted.'),
});
export type HighlightAbnormalResultsOutput = z.infer<typeof HighlightAbnormalResultsOutputSchema>;

export async function highlightAbnormalResults(
  input: HighlightAbnormalResultsInput
): Promise<HighlightAbnormalResultsOutput> {
  return highlightAbnormalResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'highlightAbnormalResultsPrompt',
  input: {schema: HighlightAbnormalResultsInputSchema},
  output: {schema: HighlightAbnormalResultsOutputSchema},
  prompt: `You are a medical assistant that highlights any abnormal findings in a medical report summary.

  Given the medical report summary below, identify and highlight any abnormal or significant findings.
  Use markdown to emphasize these findings, such as using bold text or colored text.

  Medical Report Summary:
  {{reportSummary}}`,
});

const highlightAbnormalResultsFlow = ai.defineFlow(
  {
    name: 'highlightAbnormalResultsFlow',
    inputSchema: HighlightAbnormalResultsInputSchema,
    outputSchema: HighlightAbnormalResultsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
