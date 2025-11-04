export interface Student {
  id: number;
  name: string;
  phoneNumber: string;
  country: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  twilioPhoneNumber: string;
}

export interface CallRecord {
  callSid: string;
  studentId: number;
  studentName: string;
  timestamp: string;
  duration?: number; // Duration in seconds
}
