export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export type GuestRequestStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface GuestRequestSummary {
  id: number;
  status: GuestRequestStatus;
  name: string;
  contact: string;
  message?: string;
  repeaterCallsign?: string;
  created: string;
  updated: string;
}
