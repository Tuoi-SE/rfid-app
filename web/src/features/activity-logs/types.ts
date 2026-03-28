export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  userId: string;
  user?: { username: string; role?: string };
  ipAddress?: string;
  createdAt: string;
}
