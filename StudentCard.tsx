import React from 'react';
import { motion } from 'framer-motion';
import type { Student } from '../types';
import { PhoneIcon } from './icons';

interface StudentCardProps {
  student: Student;
  index: number;
  initiateCall: (student: Student) => void;
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const StudentCard: React.FC<StudentCardProps> = ({ student, index, initiateCall }) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  const colors = [
    'bg-emerald-100 text-emerald-800', 'bg-sky-100 text-sky-800', 
    'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800',
    'bg-indigo-100 text-indigo-800', 'bg-fuchsia-100 text-fuchsia-800'
  ];
  const colorClass = colors[index % colors.length];

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-800 p-4 shadow-sm transition-shadow hover:shadow-md dark:border dark:border-slate-700"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${colorClass}`}>
          {getInitials(student.name)}
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{student.country}</p>
        </div>
      </div>
      <button
        onClick={() => initiateCall(student)}
        className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 active:scale-95"
        aria-label={`Call ${student.name}`}
      >
        <PhoneIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Call</span>
      </button>
    </motion.div>
  );
};

export default StudentCard;