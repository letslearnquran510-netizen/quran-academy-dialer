
import React from 'react';
import { motion } from 'framer-motion';
import type { CallState } from '../types';
import { SpinnerIcon, ExclamationTriangleIcon, RecordingIcon, PhoneIcon, PhoneSlashIcon, CloudUploadIcon } from './icons';

interface CallModalProps {
  callState: CallState;
  onClose: () => void;
  onEndCall: () => void;
  isRecordingEnabled: boolean;
}

const CallModal: React.FC<CallModalProps> = ({ callState, onClose, onEndCall, isRecordingEnabled }) => {
  // This guard ensures that TypeScript knows `student` is not null inside this component.
  // The parent component (`Dialer`) already ensures this before rendering the modal.
  if (!callState.student) {
    return null;
  }
  
  const { status, student, message } = callState;

  const RecordingNotice = () => (
    isRecordingEnabled ? (
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-rose-600 dark:text-rose-400">
        <RecordingIcon className="h-3 w-3" />
        <span>This call is being recorded</span>
      </div>
    ) : null
  );

  const renderContent = () => {
    switch (status) {
      case 'calling':
        return (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900">
                <SpinnerIcon className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
                Connecting...
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: 
              `Initiating a secure call to <strong>${student.name}</strong>.`
            }} />
            <RecordingNotice />
          </>
        );
      case 'initiated':
        return (
            <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                    <PhoneIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
                    Call Initiated!
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    Success! Twilio is now calling your staff number.<br/><strong>Answer your phone to connect to {student.name}.</strong>
                </p>
                <RecordingNotice />
            </>
        );
      case 'deployment-required':
        return (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                  <ExclamationTriangleIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
                  Service Not Responding
              </h2>
              <div className="mt-4 w-full rounded-lg bg-slate-100 dark:bg-slate-700/50 p-3 text-left text-sm text-slate-700 dark:text-slate-300">
                  <p className="font-bold">Details:</p>
                  <p className="mt-1">{message}</p>
              </div>
            </>
        );
      case 'completed':
        return (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <PhoneSlashIcon className="h-7 w-7 text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
                  Call Logged
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                  The call with <strong>${student.name}</strong> has been marked as complete.
              </p>
            </>
          );
      case 'error':
        return (
            <>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
                  <ExclamationTriangleIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
                  Call Failed
              </h2>
              <div className="mt-4 w-full rounded-lg bg-rose-50 dark:bg-rose-500/10 p-3 text-left text-sm text-rose-800 dark:text-rose-200">
                <p className="font-bold">Error Details:</p>
                <p className="mt-1 font-mono text-xs break-words">{message}</p>
              </div>
               <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  This may be a problem with your Twilio credentials on the server or the phone numbers provided.
              </p>
            </>
          );
      default:
        return null;
    }
  }
  
  const isTerminalState = status === 'completed' || status === 'error' || status === 'deployment-required';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" 
      aria-modal="true" 
      role="dialog" 
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-2xl dark:bg-slate-800 dark:border dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
        <button
          onClick={isTerminalState ? onClose : onEndCall}
          className={`mt-6 w-full rounded-lg px-4 py-2.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
            isTerminalState 
            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400'
            : 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500'
          }`}
        >
            {isTerminalState ? 'Close' : 'End Call & Log'}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default CallModal;
