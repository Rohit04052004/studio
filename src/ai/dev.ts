import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-medical-reports.ts';
import '@/ai/flows/answer-report-questions-via-chat.ts';
import '@/ai/flows/highlight-abnormal-results.ts';
import '@/ai/flows/health-assistant-flow.ts';
