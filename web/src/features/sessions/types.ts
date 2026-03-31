export interface SessionOperator {
  id: string;
  username: string;
}

export interface SessionOrder {
  id: string;
  code: string;
  type: string;
}

export interface SessionData {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  totalTags: number;
  totalScans?: number;
  user?: SessionOperator | null;
  order?: SessionOrder | null;
  hasUnassignedTags?: boolean;
  hasAssignedTags?: boolean;
  hasTransferredTags?: boolean;
}
