import { httpClient } from '@/lib/http/client';
import { SessionData } from '../types';

export const getSessions = async () => {
return httpClient<SessionData[]>('/sessions');
};
