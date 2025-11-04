
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Student, TwilioConfig, CallRecord } from './types';
import { students as initialStudents } from './data/students';
import Dialer from './components/Dialer';
import Admin from './components/Admin';
import { PhoneIcon, UserCogIcon } from './components/icons';


const App: React.FC = () => {
  const [view, setView] = useState<'dialer' | 'admin'>('dialer');
  
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

  const toggleView = () => {
    setView(prev => prev === 'dialer' ? 'admin' : 'dialer');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="container mx-auto max-w-2xl p-4 sm:p-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {view === 'dialer' ? (
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
      <button
        onClick={toggleView}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
        aria-label={view === 'dialer' ? 'Switch to Admin View' : 'Switch to Dialer View'}
        title={view === 'dialer' ? 'Admin Panel' : 'Dialer View'}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'dialer' ? <UserCogIcon className="h-7 w-7" /> : <PhoneIcon className="h-7 w-7" />}
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
};

export default App;
