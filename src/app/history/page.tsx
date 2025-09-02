
import { getHistoryAction } from '../actions';
import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { HistoryClient } from '@/components/history/history-client';
import type { Report, AssistantChat } from '@/types';

async function getCurrentUserId() {
  try {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    return null;
  }
}

export default async function HistoryPage() {
  const userId = await getCurrentUserId();
  
  let reports: Report[] = [];
  let assistantChat: AssistantChat | null = null;

  if (userId) {
    const result = await getHistoryAction(userId);
    if (result.success) {
      reports = result.reports || [];
      assistantChat = result.assistantChat || null;
    }
  }

  return <HistoryClient initialReports={reports} initialAssistantChat={assistantChat} />;
}
