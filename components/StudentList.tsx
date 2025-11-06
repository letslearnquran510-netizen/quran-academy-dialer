import React from 'react';
import { motion } from 'framer-motion';
import StudentCard from './StudentCard';
import type { Student } from '../types';

interface StudentListProps {
  students: Student[];
  initiateCall: (student: Student) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const StudentList: React.FC<StudentListProps> = ({ students, initiateCall }) => {
  return (
    <motion.div
      className="mt-6 space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {students.map((student, index) => (
        <StudentCard key={student.id} student={student} index={index} initiateCall={initiateCall} />
      ))}
    </motion.div>
  );
};

export default StudentList;