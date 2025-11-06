
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student, TwilioConfig, CallRecord } from './types';
import { students as initialStudents } from './data/students';
import Dialer from './components/Dialer';
import Admin from './components/Admin';
import Login from './components/Login';
import { LogoutIcon } from './components/icons';

type AuthState = {
  status: 'unauthenticated' | 'staff' | 'admin';
  userName?: string;
};

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const storedAuth = window.localStorage.getItem('authState');
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        if (['unauthenticated', 'staff', 'admin'].includes(parsedAuth.status)) {
            return parsedAuth;
        }
      }
    } catch (error) {
        console.error("Failed to parse auth state from localStorage", error);
    }
    return { status: 'unauthenticated' };
  });
  
  const [staffPhoneNumber, setStaffPhoneNumber] = useState<string>(() => {
    return window.localStorage.getItem('staffPhoneNumber') || '';
  });

  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>(() => {
    const storedConfig = window.localStorage.getItem('twilioConfig');
    return storedConfig ? JSON.parse(storedConfig) : { accountSid: '', authToken: '', twilioPhoneNumber: '' };
  });

  const [isRecordingEnabled, setIsRecordingEnabled] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem('isRecordingEnabled');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const storedStudents = window.localStorage.getItem('students');
      if (storedStudents) {
        let parsed = JSON.parse(storedStudents);
        // Data migration from previous versions
        if (parsed.length > 0 && (parsed[0].contactId !== undefined || parsed[0].phoneNumber === undefined)) {
            parsed = parsed.map((s: any) => {
                const newStudent = {
                    id: s.id,
                    name: s.name,
                    country: s.country,
                    phoneNumber: s.contactId || s.phoneNumber || ''
                };
                return newStudent;
            });
        }
        return parsed;
      }
    } catch (error) {
      console.error("Failed to parse or migrate students from localStorage", error);
    }
    return initialStudents;
  });

  const [callHistory, setCallHistory] = useState<CallRecord[]>(() => {
    try {
      const storedHistory = window.localStorage.getItem('callHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Failed to parse call history from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem('authState', JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    try {
      window.localStorage.setItem('students', JSON.stringify(students));
    } catch (error) {
      console.error("Failed to save students to localStorage", error);
    }
  }, [students]);

  useEffect(() => {
    try {
        window.localStorage.setItem('staffPhoneNumber', staffPhoneNumber);
    } catch (error) {
        console.error("Failed to save staff phone number to localStorage", error);
    }
  }, [staffPhoneNumber]);

  useEffect(() => {
    try {
        window.localStorage.setItem('twilioConfig', JSON.stringify(twilioConfig));
    } catch (error) {
        console.error("Failed to save Twilio config to localStorage", error);
    }
  }, [twilioConfig]);

  useEffect(() => {
    try {
      window.localStorage.setItem('callHistory', JSON.stringify(callHistory));
    } catch (error) {
      console.error("Failed to save call history to localStorage", error);
    }
  }, [callHistory]);

  useEffect(() => {
    try {
      window.localStorage.setItem('isRecordingEnabled', JSON.stringify(isRecordingEnabled));
    } catch (error) {
      console.error("Failed to save recording setting to localStorage", error);
    }
  }, [isRecordingEnabled]);


  const addStudent = (student: Omit<Student, 'id'>) => {
    setStudents(prev => [...prev, { ...student, id: Date.now() }]);
  };

  const updateStudent = (id: number, updatedData: Partial<Omit<Student, 'id'>>) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === id ? { ...student, ...updatedData } : student
      )
    );
  };

  const deleteStudent = (id: number) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const addCallToHistory = (student: Student, callSid: string) => {
    const newRecord: CallRecord = {
      callSid,
      studentId: student.id,
      studentName: student.name,
      timestamp: new Date().toISOString(),
    };
    // Mark the call as in-progress by not setting a duration
    setCallHistory(prev => [newRecord, ...prev]);
  };

  const markCallAsComplete = (callSid: string) => {
    // This function now simply marks a call as 'not in-progress'
    // A more advanced implementation with webhooks could update duration here.
    setCallHistory(prev =>
      prev.map(call =>
        (call.callSid === callSid && call.duration === undefined) ? { ...call, duration: 0 } : call // Mark as complete with 0 duration
      )
    );
  };

  const clearCallHistory = () => {
    if (window.confirm('Are you sure you want to delete all call history? This action cannot be undone.')) {
        setCallHistory([]);
    }
  };

  const handleLogin = (type: 'staff' | 'admin', name: string) => {
    setAuthState({ status: type, userName: name });
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setAuthState({ status: 'unauthenticated' });
      // The useEffect for authState will handle removing the item from localStorage
    }
  };

  if (authState.status === 'unauthenticated') {
    return <Login onLogin={handleLogin} />;
  }

  const loggedInUser = authState.userName || (authState.status === 'admin' ? 'Admin' : 'Staff');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="container mx-auto max-w-2xl p-4 sm:p-6 pb-24 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
            Welcome, <strong>{loggedInUser}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full bg-slate-200 dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors duration-200 hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            title="Logout"
            aria-label="Logout"
          >
            <LogoutIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={authState.status}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="pt-16 sm:pt-0"
          >
            {authState.status === 'staff' ? (
              <Dialer 
                students={students} 
                staffPhoneNumber={staffPhoneNumber} 
                twilioConfig={twilioConfig} 
                addCallToHistory={addCallToHistory}
                markCallAsComplete={markCallAsComplete}
                isRecordingEnabled={isRecordingEnabled}
              />
            ) : (
              <Admin 
                students={students} 
                addStudent={addStudent}
                updateStudent={updateStudent}
                deleteStudent={deleteStudent} 
                staffPhoneNumber={staffPhoneNumber}
                setStaffPhoneNumber={setStaffPhoneNumber}
                twilioConfig={twilioConfig}
                setTwilioConfig={setTwilioConfig}
                callHistory={callHistory}
                clearCallHistory={clearCallHistory}
                isRecordingEnabled={isRecordingEnabled}
                setIsRecordingEnabled={setIsRecordingEnabled}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
