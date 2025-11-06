// Fix: Removed the triple-slash directive for 'vite/client' to resolve a type definition error.
// This directive is not necessary as the project does not currently use `import.meta.env`.
export interface Student {
  id: number;
  name: string;
  phoneNumber: string;
  country: string;
}

export interface CallRecord {
  callSid: string;
  studentId: number;
  studentName: string;
  timestamp: string;
  duration?: number; // Duration in seconds
}

export type CallStatus = 'idle' | 'calling' | 'initiated' | 'completed' | 'error' | 'deployment-required';

export interface CallState {
    student: Student | null;
    status: CallStatus;
    message: string;
    callSid?: string;
}
