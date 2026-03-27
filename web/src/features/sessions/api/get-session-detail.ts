import { httpClient } from '@/lib/http/client';

// Keep the return type simple or use any temporarily if not fully defined
export async function getSessionDetail(id: string) {
  return httpClient<any>(`/sessions/${id}`);
}
