
export interface Student {
  id: number;
  name: string;
  phone: string;
  parent?: string;
  email?: string;
  notes?: string;
  addedBy: string;
  addedAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CallRecord {
  id: number;
  studentName: string;
  status: string;
  duration: number; // in seconds
  teacherName: string;
  timestamp: string;
  recordingUrl?: string | null;
}

export interface User {
  type: 'admin' | 'staff';
  name: string;
  avatar: string;
}

export interface Teacher {
  id: number;
  name: string;
  addedAt: string;
}

export type Section = 'overview' | 'students' | 'calls' | 'history' | 'analytics' | 'users';