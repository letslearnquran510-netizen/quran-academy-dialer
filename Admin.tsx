import React, { useState, useMemo } from 'react';
import type { Student, TwilioConfig, CallRecord } from '../types';
import { UserCogIcon, TrashIcon, PlusIcon, SaveIcon, ExclamationTriangleIcon, ClockIcon, StopwatchIcon, ArrowUpIcon, ArrowDownIcon, FilterIcon, XCircleIcon, ChevronUpDownIcon, PencilIcon, CheckIcon, XMarkIcon } from './icons';
import ConfirmationDialog from './ConfirmationDialog';

interface AdminProps {
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: number, updatedData: Partial<Omit<Student, 'id'>>) => void;
  deleteStudent: (id: number) => void;
  staffPhoneNumber: string;
  setStaffPhoneNumber: (number: string) => void;
  twilioConfig: TwilioConfig;
  setTwilioConfig: (config: TwilioConfig) => void;
  callHistory: CallRecord[];
  clearCallHistory: () => void;
  isRecordingEnabled: boolean;
  setIsRecordingEnabled: (enabled: boolean) => void;
}

type StudentSortKey = 'name' | 'phoneNumber' | 'country';

const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
        return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
};

const Admin: React.FC<AdminProps> = ({ 
    students, addStudent, deleteStudent, updateStudent,
    staffPhoneNumber, setStaffPhoneNumber,
    twilioConfig, setTwilioConfig,
    callHistory, clearCallHistory,
    isRecordingEnabled, setIsRecordingEnabled
}) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [currentStaffNumber, setCurrentStaffNumber] = useState(staffPhoneNumber);
  const [currentTwilioConfig, setCurrentTwilioConfig] = useState<TwilioConfig>(twilioConfig);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // State for call history sorting and filtering
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStudentName, setFilterStudentName] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress'>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // State for student list sorting
  const [studentSortKey, setStudentSortKey] = useState<StudentSortKey>('name');
  const [studentSortDirection, setStudentSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // New states for inline editing
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<Partial<Omit<Student, 'id'>>>({});


  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phoneNumber && country) {
      addStudent({ name, phoneNumber, country });
      setName('');
      setPhoneNumber('');
      setCountry('');
    }
  };

  const handleStaffNumberSave = () => {
    setStaffPhoneNumber(currentStaffNumber);
    alert('Staff phone number saved!');
  };

  const handleTwilioConfigSave = () => {
    setTwilioConfig(currentTwilioConfig);
    alert('Twilio configuration saved!');
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  const toggleHistorySortOrder = () => {
    setHistorySortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };
  
  const handleStudentSort = (key: StudentSortKey) => {
    if (studentSortKey === key) {
        setStudentSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setStudentSortKey(key);
        setStudentSortDirection('asc');
    }
  };

  const isFilterActive = useMemo(() => 
    filterStudentName !== '' || filterStatus !== 'all' || filterStartDate !== '' || filterEndDate !== '',
    [filterStudentName, filterStatus, filterStartDate, filterEndDate]
  );
  
  const handleResetFilters = () => {
      setFilterStudentName('');
      setFilterStatus('all');
      setFilterStartDate('');
      setFilterEndDate('');
  };

  // Handlers for inline editing
  const handleEditClick = (student: Student) => {
    setEditingStudentId(student.id);
    setEditedData({
        name: student.name,
        phoneNumber: student.phoneNumber,
        country: student.country,
    });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditedData({});
  };

  const handleSaveEdit = () => {
    if (editingStudentId) {
        if (editedData.name && editedData.phoneNumber && editedData.country) {
            updateStudent(editingStudentId, editedData);
            handleCancelEdit();
        } else {
            alert("All fields must be filled out.");
        }
    }
  };

  const handleEditDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({...prev, [name]: value}));
  };

  const filteredAndSortedHistory = useMemo(() => {
    const filtered = callHistory.filter(call => {
        if (filterStudentName && !call.studentName.toLowerCase().includes(filterStudentName.toLowerCase())) return false;
        if (filterStatus === 'completed' && call.duration === undefined) return false;
        if (filterStatus === 'in-progress' && call.duration !== undefined) return false;
        
        const callDate = new Date(call.timestamp);
        if (filterStartDate && callDate < new Date(filterStartDate)) return false;
        if (filterEndDate) {
            const endDate = new Date(filterEndDate);
            endDate.setHours(23, 59, 59, 999);
            if (callDate > endDate) return false;
        }
        return true;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      if (historySortOrder === 'asc') {
        return dateA.getTime() - dateB.getTime();
      }
      return dateB.getTime() - dateA.getTime();
    });
  }, [callHistory, historySortOrder, filterStudentName, filterStatus, filterStartDate, filterEndDate]);
  
  const sortedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => {
        const valA = a[studentSortKey];
        const valB = b[studentSortKey];
        
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });

    if (studentSortDirection === 'desc') {
        return sorted.reverse();
    }
    
    return sorted;
  }, [students, studentSortKey, studentSortDirection]);
  
  const renderStudentSortIcon = (key: StudentSortKey) => {
    if (studentSortKey !== key) {
        return <ChevronUpDownIcon className="h-4 w-4 text-slate-400" />;
    }
    if (studentSortDirection === 'asc') {
        return <ArrowUpIcon className="h-4 w-4 text-emerald-500" />;
    }
    return <ArrowDownIcon className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <div>
      <header className="text-center">
        <div className="flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400">
          <UserCogIcon className="h-8 w-8" />
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">
            Admin Panel
          </h1>
        </div>
        <p className="mt-2 text-md text-slate-600 dark:text-slate-400">
          Manage your student roster and settings.
        </p>
      </header>
      <main className="mt-8 space-y-8">
        <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md dark:border dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">System Settings</h2>
          <div>
            <label htmlFor="staff-number" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Your Staff Phone Number (for receiving calls)
            </label>
            <div className="mt-1 flex gap-2">
                <input
                id="staff-number"
                type="tel"
                placeholder="e.g., +15551234567"
                value={currentStaffNumber}
                onChange={(e) => setCurrentStaffNumber(e.target.value)}
                className="flex-grow rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 transition"
                />
                <button
                    onClick={handleStaffNumberSave}
                    className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                >
                    <SaveIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Save</span>
                </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">This number is used by the system to connect you to students.</p>
          </div>

          <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex items-center justify-between">
                <div>
                <label htmlFor="call-recording" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enable Call Recording
                </label>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Record calls for quality and training purposes.
                </p>
                </div>
                <button
                id="call-recording"
                type="button"
                onClick={() => setIsRecordingEnabled(!isRecordingEnabled)}
                className={`${
                    isRecordingEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
                role="switch"
                aria-checked={isRecordingEnabled}
                >
                <span
                    aria-hidden="true"
                    className={`${
                    isRecordingEnabled ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
                </button>
            </div>
            {isRecordingEnabled && (
                <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-300">
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-xs">
                        <strong>Compliance Notice:</strong> You are responsible for complying with all applicable laws regarding call recording, including obtaining consent.
                    </p>
                </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md dark:border dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Twilio Configuration</h2>
            <div className="space-y-4">
                <input type="text" placeholder="Twilio Account SID" value={currentTwilioConfig.accountSid} onChange={(e) => setCurrentTwilioConfig(c => ({...c, accountSid: e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="password" placeholder="Twilio Auth Token" value={currentTwilioConfig.authToken} onChange={(e) => setCurrentTwilioConfig(c => ({...c, authToken: e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="tel" placeholder="Your Twilio Phone Number" value={currentTwilioConfig.twilioPhoneNumber} onChange={(e) => setCurrentTwilioConfig(c => ({...c, twilioPhoneNumber: e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
             <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-300">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                    <p className="font-bold">Action Required for Live Calls:</p>
                    <p>
                        For this app to work when deployed, you MUST set your credentials as <strong>Environment Variables</strong> in your hosting provider's settings (e.g., Vercel). The backend function will use these secure variables, not the values saved here.
                    </p>
                    <ul className="list-disc pl-4 mt-1">
                        <li><code className="text-xs">TWILIO_ACCOUNT_SID</code></li>
                        <li><code className="text-xs">TWILIO_AUTH_TOKEN</code></li>
                        <li><code className="text-xs">TWILIO_PHONE_NUMBER</code></li>
                    </ul>
                </div>
            </div>
            <button
                onClick={handleTwilioConfigSave}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
                <SaveIcon className="h-5 w-5" />
                Save Config for Reference
            </button>
        </div>

        <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md dark:border dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ClockIcon className="h-6 w-6" />
                    Recent Call History
                </h2>
                {callHistory.length > 0 && (
                    <>
                        <button onClick={() => setShowFilters(f => !f)} className={`p-1.5 rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${showFilters ? 'bg-slate-200 dark:bg-slate-700' : ''}`} title="Filter history" aria-label="Toggle filters">
                           <FilterIcon className="h-5 w-5" />
                        </button>
                        {callHistory.length > 1 && (
                            <button onClick={toggleHistorySortOrder} className="p-1.5 rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" title={historySortOrder === 'desc' ? 'Sort oldest first' : 'Sort newest first'} aria-label="Toggle sort order">
                                {historySortOrder === 'desc' ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
                            </button>
                        )}
                    </>
                )}
            </div>
            {callHistory.length > 0 && (
                <button onClick={clearCallHistory} className="flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800">
                    <TrashIcon className="h-4 w-4" />
                    Clear History
                </button>
            )}
          </div>

          {showFilters && callHistory.length > 0 && (
            <div className="mb-4 space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                    <div>
                        <label htmlFor="filter-student-name" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Student Name</label>
                        <input id="filter-student-name" type="text" value={filterStudentName} onChange={(e) => setFilterStudentName(e.target.value)} placeholder="Search name..." className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-emerald-500 focus:border-emerald-500"/>
                    </div>
                    <div>
                        <label htmlFor="filter-status" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Call Status</label>
                        <select id="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-emerald-500 focus:border-emerald-500">
                            <option value="all">All</option>
                            <option value="completed">Completed</option>
                            <option value="in-progress">In Progress</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="filter-start-date" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                        <input id="filter-start-date" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-emerald-500 focus:border-emerald-500"/>
                    </div>
                    <div>
                        <label htmlFor="filter-end-date" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                        <input id="filter-end-date" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-emerald-500 focus:border-emerald-500"/>
                    </div>
                </div>
                {isFilterActive && (
                    <button onClick={handleResetFilters} className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                        <XCircleIcon className="h-4 w-4" />
                        Reset Filters
                    </button>
                )}
            </div>
          )}

          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {callHistory.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                    <p>No calls have been made yet.</p>
                </div>
            ) : filteredAndSortedHistory.length > 0 ? filteredAndSortedHistory.map((call) => (
              <div key={call.callSid} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{call.studentName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(call.timestamp).toLocaleString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true
                    })}
                  </p>
                </div>
                <div className="flex items-center">
                    {call.duration !== undefined ? (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                            <StopwatchIcon className="h-4 w-4" />
                            {formatDuration(call.duration)}
                        </span>
                    ) : (
                        <span className="inline-block rounded-full bg-sky-100 dark:bg-sky-900/70 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 animate-pulse">
                            In Progress
                        </span>
                    )}
                </div>
              </div>
            )) : (
                 <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                    <p>No calls match the current filters.</p>
                 </div>
            )}
          </div>
        </div>

        <form onSubmit={handleAddStudent} className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-md dark:border dark:border-slate-700">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Add New Student</h2>
          <div className="space-y-4">
             <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input type="tel" placeholder="Student's Phone Number (e.g., +44...)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800">
            <PlusIcon className="h-5 w-5" />
            Add Student
          </button>
        </form>

        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Current Students ({students.length})</h2>
           {students.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            {(['name', 'phoneNumber', 'country'] as StudentSortKey[]).map(key => (
                                <th 
                                    key={key}
                                    scope="col" 
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                                    onClick={() => handleStudentSort(key)}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {key === 'phoneNumber' ? 'Phone Number' : key.charAt(0).toUpperCase() + key.slice(1)}
                                        {renderStudentSortIcon(key)}
                                    </div>
                                </th>
                            ))}
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900/50">
                        {sortedStudents.map(student => {
                            const isEditing = student.id === editingStudentId;
                            return isEditing ? (
                                <tr key={student.id} className="bg-slate-100 dark:bg-slate-800">
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <input type="text" name="name" value={editedData.name || ''} onChange={handleEditDataChange} className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-emerald-500 focus:border-emerald-500"/>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <input type="tel" name="phoneNumber" value={editedData.phoneNumber || ''} onChange={handleEditDataChange} className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-emerald-500 focus:border-emerald-500 font-mono"/>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap">
                                        <input type="text" name="country" value={editedData.country || ''} onChange={handleEditDataChange} className="w-full text-sm rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-emerald-500 focus:border-emerald-500"/>
                                    </td>
                                    <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={handleSaveEdit} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400" aria-label="Save changes">
                                                <CheckIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={handleCancelEdit} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400" aria-label="Cancel editing">
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{student.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-mono">{student.phoneNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{student.country}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleEditClick(student)} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-500/20 dark:hover:text-sky-400" aria-label={`Edit ${student.name}`}>
                                          <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => setStudentToDelete(student)} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400" aria-label={`Delete ${student.name}`}>
                                          <TrashIcon className="h-5 w-5" />
                                        </button>
                                      </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
           ) : (
             <div className="text-center text-slate-500 dark:text-slate-400 py-8 rounded-lg bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p>No students have been added yet.</p>
                <p className="text-xs mt-1">Use the form above to add your first student.</p>
             </div>
           )}
        </div>
      </main>
      <ConfirmationDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        confirmText="Delete"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
        Icon={ExclamationTriangleIcon}
      >
        <p>
            Are you sure you want to delete <strong>{studentToDelete?.name}</strong>? This action cannot be undone.
        </p>
      </ConfirmationDialog>
    </div>
  );
};

export default Admin;
