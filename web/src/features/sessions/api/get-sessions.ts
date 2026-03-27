import { httpClient } from '@/lib/http/client';
import { SessionData } from '../types';

export async function getSessions() {
  return httpClient<SessionData[]>('/sessions');
}
