
import { Student, CallRecord, Teacher } from './types';

export const SAMPLE_STUDENTS: Student[] = [
  { id: 1, name: 'Yusuf Ahmed', phone: '+12025550101', parent: 'Fatima Ahmed', email: 'yusuf@example.com', addedBy: 'Administrator', addedAt: '2023-10-26T10:00:00Z' },
  { id: 2, name: 'Aisha Khan', phone: '+12025550102', parent: 'Mohammed Khan', email: 'aisha@example.com', addedBy: 'Administrator', addedAt: '2023-10-25T11:30:00Z' },
  { id: 3, name: 'Omar Al-Farsi', phone: '+12025550103', parent: 'Layla Al-Farsi', email: 'omar@example.com', addedBy: 'Administrator', addedAt: '2023-10-24T09:15:00Z' },
  { id: 4, name: 'Zainab Ali', phone: '+12025550104', parent: 'Hassan Ali', email: 'zainab@example.com', addedBy: 'Administrator', addedAt: '2023-10-23T14:00:00Z' },
  { id: 5, name: 'Bilal Ibrahim', phone: '+12025550105', parent: 'Samira Ibrahim', email: 'bilal@example.com', addedBy: 'Administrator', addedAt: '2023-10-22T16:45:00Z' },
  { id: 6, name: 'Maryam Siddiqui', phone: '+12025550106', parent: 'Tariq Siddiqui', email: 'maryam@example.com', addedBy: 'Administrator', addedAt: '2023-10-21T12:00:00Z' },
  { id: 7, name: 'Dawud Hussein', phone: '+12025550107', parent: 'Nadia Hussein', email: 'dawud@example.com', addedBy: 'Administrator', addedAt: '2023-10-20T18:20:00Z' },
];

export const SAMPLE_TEACHERS: Teacher[] = [
    { id: 1, name: 'Ali Hassan', addedAt: '2023-10-20T10:00:00Z' },
    { id: 2, name: 'Fatima Zahra', addedAt: '2023-10-21T11:00:00Z' }
];

export const SAMPLE_CALL_HISTORY: CallRecord[] = [
  { id: 101, studentName: 'Yusuf Ahmed', status: 'Completed', duration: 320, teacherName: 'Ali Hassan', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 102, studentName: 'Aisha Khan', status: 'Failed', duration: 0, teacherName: 'Fatima Zahra', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 103, studentName: 'Omar Al-Farsi', status: 'Completed', duration: 450, teacherName: 'Ali Hassan', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 104, studentName: 'Zainab Ali', status: 'Canceled', duration: 0, teacherName: 'Fatima Zahra', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 105, studentName: 'Bilal Ibrahim', status: 'Completed', duration: 280, teacherName: 'Ali Hassan', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 106, studentName: 'Yusuf Ahmed', status: 'Completed', duration: 310, teacherName: 'Fatima Zahra', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 107, studentName: 'Aisha Khan', status: 'Completed', duration: 510, teacherName: 'Ali Hassan', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 108, studentName: 'Omar Al-Farsi', status: 'Failed', duration: 0, teacherName: 'Fatima Zahra', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 109, studentName: 'Maryam Siddiqui', status: 'Completed', duration: 620, teacherName: 'Ali Hassan', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 110, studentName: 'Dawud Hussein', status: 'Completed', duration: 180, teacherName: 'Fatima Zahra', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 111, studentName: 'Zainab Ali', status: 'Completed', duration: 400, teacherName: 'Ali Hassan', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), recordingUrl: null },
  { id: 112, studentName: 'Yusuf Ahmed', status: 'Completed', duration: 350, teacherName: 'Ali Hassan', timestamp: new Date().toISOString(), recordingUrl: null },
];
