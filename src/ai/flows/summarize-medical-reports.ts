'use server';
/**
 * @fileOverview Summarizes medical reports (text or image) into concise, easy-to-understand summaries using AI.
 *
 * - summarizeMedicalReport - A function that takes medical report text or image data and returns a summary.
 * - SummarizeMedicalReportInput - The input type for the summarizeMedicalReport function.
 * - SummarizeMedicalReportOutput - The return type for the summarizeMedicalReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const SummarizeMedicalReportInputSchema = z.object({
  reportDataUri: z
    .string()
    .describe(
      "A medical report, either text or an image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeMedicalReportInput = z.infer<typeof SummarizeMedicalReportInputSchema>;

const SummarizeMedicalReportOutputSchema = z.object({
  summary: z.string().describe('A concise, easy-to-understand summary of the medical report.'),
});
export type SummarizeMedicalReportOutput = z.infer<typeof SummarizeMedicalReportOutputSchema>;

export async function summarizeMedicalReport(input: SummarizeMedicalReportInput): Promise<SummarizeMedicalReportOutput> {
  return summarizeMedicalReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMedicalReportPrompt',
  input: {schema: SummarizeMedicalReportInputSchema},
  output: {schema: SummarizeMedicalReportOutputSchema},
  prompt: `You are a medical expert. Summarize the medical report below in a concise and easy to understand way, explaining any medical terms present.

Medical Report: {{media url=reportDataUri}}`,
});

const summarizeMedicalReportFlow = ai.defineFlow(
  {
    name: 'summarizeMedicalReportFlow',
    inputSchema: SummarizeMedicalReportInputSchema,
    outputSchema: SummarizeMedicalReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
