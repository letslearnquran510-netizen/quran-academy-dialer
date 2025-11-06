
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import SearchBar from './SearchBar';
import StudentList from './StudentList';
import CallModal from './CallModal';
import type { Student, TwilioConfig, CallState } from '../types';
import { RecordingIcon } from './icons';

interface DialerProps {
  students: Student[];
  staffPhoneNumber: string;
  twilioConfig: TwilioConfig;
  addCallToHistory: (student: Student, callSid: string) => void;
  markCallAsComplete: (callSid: string) => void;
  isRecordingEnabled: boolean;
}

class BackendError extends Error {
    constructor(message: string, public isDeploymentError: boolean = false) {
        super(message);
        this.name = 'BackendError';
    }
}

class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'ApiError';
    }
}

// This function calls your backend, which then securely contacts Twilio.
const apiCallToBackend = async (
    staffNumber: string,
    studentNumber: string,
    record: boolean
): Promise<{ success: boolean; message: string; callSid: string }> => {
    console.log('Initiating API call to backend with:', { staffNumber, studentNumber, record });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.log('Backend call timed out after 10 seconds.');
        controller.abort();
    }, 10000); // Increased timeout for serverless cold starts

    let response;
    try {
        response = await fetch('/api/make-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffNumber, studentNumber, recordCall: record }),
            signal: controller.signal,
        });
    } catch (networkError: any) {
        clearTimeout(timeoutId);
        if (networkError.name === 'AbortError') {
            console.error('Backend request timed out.', networkError);
            throw new BackendError('The call service took too long to respond. This can happen on the first attempt if the service is waking up. Please try again in a moment.', true);
        }
        console.error('Network error calling backend:', networkError);
        throw new BackendError('Network error: Could not reach the call service. Please check your internet connection or ensure the server is deployed.', true);
    }

    clearTimeout(timeoutId);

    if (response.status === 404) {
        throw new BackendError('API endpoint not found (404). This is expected during local testing. Deploy the project to a platform like Vercel to activate the backend.', true);
    }

    let data;
    try {
        data = await response.json();
    } catch (jsonError) {
        console.error('Error parsing JSON response from backend:', jsonError);
        throw new BackendError(`Invalid response from server (status ${response.status}). This usually means the backend isn't running. Expected JSON but received HTML or other text.`, true);
    }

    if (!response.ok) {
        const errorMessage = data.message || `An error occurred with the call service (status ${response.status}).`;
        throw new ApiError(errorMessage, response.status);
    }

    return data;
};


const Dialer: React.FC<DialerProps> = ({ students, staffPhoneNumber, twilioConfig, addCallToHistory, markCallAsComplete, isRecordingEnabled }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [callState, setCallState] = useState<CallState>({
    student: null,
    status: 'idle',
    message: '',
  });

  const filteredStudents = useMemo(() => {
    if (!searchTerm) {
      return students;
    }
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const initiateCall = async (studentToCall: Student) => {
    if (!staffPhoneNumber) {
        alert("Please ensure your Staff Phone Number is configured in the Admin Panel.");
        return;
    }
    
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.twilioPhoneNumber) {
        alert("Please ensure your Twilio details are configured in the Admin Panel. These are used for reference and are required for the backend to function.");
        return;
    }

    setCallState({ student: studentToCall, status: 'calling', message: 'Connecting...' });

    try {
        const data = await apiCallToBackend(staffPhoneNumber, studentToCall.phoneNumber, isRecordingEnabled);
        
        setCallState(prev => ({ ...prev, status: 'initiated', callSid: data.callSid, message: '' }));
        addCallToHistory(studentToCall, data.callSid);

    } catch (error) {
        if (error instanceof BackendError && error.isDeploymentError) {
            console.warn('Backend not found. Deployment is required.', error.message);
            setCallState({ student: studentToCall, status: 'deployment-required', message: error.message });
        } else if (error instanceof ApiError) {
            console.error(`API Error (Status ${error.status}):`, error.message);
            let userFriendlyMessage = '';
            
            if (error.status === 500 && error.message.includes('Server configuration error')) {
                userFriendlyMessage = "The backend is missing its Twilio credentials. The administrator needs to configure the environment variables on the hosting platform.";
            } else if (error.status === 400) {
                userFriendlyMessage = `There was a problem with the data sent to the server. Please verify the staff and student phone numbers are correct. Server says: "${error.message}"`;
            } else if (error.message.toLowerCase().includes('twilio')) {
                // Catch errors coming directly from Twilio
                userFriendlyMessage = `Twilio reported an error: "${error.message}" This could be due to an invalid phone number, insufficient funds, or other account issues.`;
            } else {
                userFriendlyMessage = `An unexpected server error occurred. Please try again later. (Status: ${error.status})`;
            }
            
            setCallState({ student: studentToCall, status: 'error', message: userFriendlyMessage });

        } else {
            // Generic client-side error
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            console.error('Generic Error:', errorMessage);
            setCallState({ student: studentToCall, status: 'error', message: `A client-side error occurred: ${errorMessage}` });
        }
    }
  };

  const handleEndCall = () => {
    setCallState(prev => {
        if (prev.callSid) {
            markCallAsComplete(prev.callSid);
        }
        return { ...prev, status: 'completed' };
    });
  };

  const closeModal = () => {
    if (callState.status === 'initiated' && callState.callSid) {
        markCallAsComplete(callState.callSid);
    }
    setCallState({ student: null, status: 'idle', message: '' });
  };

  return (
    <>
      <Header />
      <main className="mt-8">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        <AnimatePresence>
          {isRecordingEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-rose-100 dark:bg-rose-900/50 px-4 py-2 text-sm text-rose-700 dark:text-rose-300"
            >
              <RecordingIcon className="h-3 w-3" />
              <span>Call Recording is Active</span>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredStudents.length > 0 ? (
          <StudentList students={filteredStudents} initiateCall={initiateCall} />
        ) : (
          <div className="mt-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-lg">No students found.</p>
            {students.length > 0 && <p>Try adjusting your search term.</p>}
          </div>
        )}
      </main>

      <AnimatePresence>
        {callState.status !== 'idle' && callState.student && (
          <CallModal 
              callState={callState}
              onClose={closeModal}
              onEndCall={handleEndCall}
              isRecordingEnabled={isRecordingEnabled}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Dialer;
