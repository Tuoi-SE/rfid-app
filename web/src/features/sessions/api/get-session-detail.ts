import { httpClient } from '@/lib/http/client';

// Keep the return type simple or use any temporarily if not fully defined
export const getSessionDetail = async (id: string) => {
return httpClient<any>(`/sessions/${id}`);
};
