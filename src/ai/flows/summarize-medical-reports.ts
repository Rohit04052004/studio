
'use server';
/**
 * @fileOverview Summarizes one or more medical reports into a concise, easy-to-understand summary using AI.
 *
 * - summarizeMedicalReport - A function that takes medical report text or image data and returns a summary.
 * - SummarizeMedicalReportInput - The input type for the summarizeMedicalReport function.
 * - SummarizeMedicalReportOutput - The return type for the summarizeMedicalReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import wav from 'wav';

const ReportInputSchema = z.object({
  reportDataUri: z
    .string()
    .describe(
      "A medical report, either text or an image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const SummarizeMedicalReportInputSchema = z.object({
  reports: z.array(ReportInputSchema),
});

export type SummarizeMedicalReportInput = z.infer<typeof SummarizeMedicalReportInputSchema>;

const SummarizeMedicalReportOutputSchema = z.object({
  summary: z.string().describe('A concise, easy-to-understand summary of the medical report(s).'),
});
export type SummarizeMedicalReportOutput = z.infer<typeof SummarizeMedicalReportOutputSchema>;

export async function summarizeMedicalReport(input: SummarizeMedicalReportInput): Promise<SummarizeMedicalReportOutput> {
  return summarizeMedicalReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeMedicalReportPrompt',
  input: {schema: SummarizeMedicalReportInputSchema},
  output: {schema: SummarizeMedicalReportOutputSchema},
  prompt: `You are a medical expert. 
  
  Your task is to summarize the provided medical report(s) in a concise and easy-to-understand way, explaining any medical terms present.

  {{#if reports.1}}
  Please provide a unified summary for the following {{reports.length}} medical reports. If possible, explain how they relate to each other and note any trends or changes over time.
  {{else}}
  Please summarize the following medical report.
  {{/if}}

  {{#each reports}}
  Medical Report {{@index}}:
  {{media url=this.reportDataUri}}
  ---
  {{/each}}
  `,
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

    
