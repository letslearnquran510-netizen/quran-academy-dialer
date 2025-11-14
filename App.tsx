


import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Student, CallRecord, Section, Teacher } from './types';
import { ADMIN_PASSWORD, STAFF_PASSWORD } from './constants';
import { Icons } from './components/Icons';
import { SAMPLE_STUDENTS, SAMPLE_CALL_HISTORY, SAMPLE_TEACHERS } from './seedData';

// --- TYPES ---
interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmationState {
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
}

interface PromptState {
    title: string;
    message: string;
    label: string;
    onConfirm: (inputValue: string) => void;
}


// --- CUSTOM HOOK ---
// This hook has been enhanced to sync state across browser tabs. Now, if a user
// logs out in one tab, they will be automatically logged out in all other open tabs.
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            
            if (valueToStore === null || valueToStore === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
            setStoredValue(valueToStore);
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);
    
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key) {
                try {
                    setStoredValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
                } catch (error) {
                    console.error(`Error parsing storage change for key “${key}”:`, error);
                    setStoredValue(initialValue);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, initialValue]);


    return [storedValue, setValue];
};


// --- HELPER FUNCTIONS ---
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const formatDuration = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const generateColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
    ];
    const index = Math.abs(hash % colors.length);
    return colors[index];
};


// --- UI COMPONENTS ---

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);
    
    const style = useMemo(() => {
        switch (toast.type) {
            case 'success': return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', icon: <Icons.CheckCircle /> };
            case 'error': return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', icon: <Icons.XCircle /> };
            default: return { bg: 'bg-sky-100', border: 'border-sky-500', text: 'text-sky-800', icon: <Icons.Info /> };
        }
    }, [toast.type]);

    return (
        <div className={`p-4 rounded-lg shadow-lg flex items-start gap-3 animate-fade-in ${style.bg} ${style.border} ${style.text} border-l-4 w-full`}>
             <div className="w-6 h-6 flex-shrink-0 mt-0.5">{style.icon}</div>
            <p className="flex-1 text-sm font-semibold pr-4">{toast.message}</p>
            <button onClick={() => onDismiss(toast.id)} className="font-bold text-lg leading-none">&times;</button>
        </div>
    );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; dismissToast: (id: number) => void }> = ({ toasts, dismissToast }) => (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-full max-w-sm">
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />)}
    </div>
);

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    state: ConfirmationState | null;
}> = ({ isOpen, onClose, state }) => {
    if (!isOpen || !state) return null;

    const handleConfirm = () => {
        state.onConfirm();
        onClose();
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4"><Icons.ExclamationCircle /> {state.title}</h2>
                <p className="text-slate-600 mb-6">{state.message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">{state.confirmText || 'Confirm'}</button>
                </div>
            </div>
        </div>
    );
};

const PromptModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    state: PromptState | null;
}> = ({ isOpen, onClose, state }) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        if (isOpen) setValue('');
    }, [isOpen]);

    if (!isOpen || !state) return null;

    const handleConfirm = () => {
        state.onConfirm(value);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-slate-800 mb-4">{state.title}</h2>
                <p className="text-slate-600 mb-4">{state.message}</p>
                <InputField icon={<Icons.User className="w-4 h-4 text-slate-400"/>} label={state.label} value={value} onChange={e => setValue((e.target as HTMLInputElement).value)} placeholder="Enter value..."/>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors">Cancel</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
};


const EmptyState: React.FC<{ icon: React.ReactNode; message: string; description: string; action?: React.ReactNode }> = ({ icon, message, description, action }) => (
    <div className="text-center py-16 px-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-fade-in">
        <div className="text-5xl mb-4 text-slate-400">{icon}</div>
        <h3 className="text-lg font-bold text-slate-700">{message}</h3>
        <p className="text-slate-500 max-w-md mx-auto">{description}</p>
        {action && <div className="mt-6">{action}</div>}
    </div>
);

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className={`absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r ${color}`}></div>
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color.replace('from-', 'from-').replace('to-', 'to-')} text-white`}>
                {icon}
            </div>
        </div>
        <div className="text-3xl font-extrabold text-slate-800 mb-1">{value}</div>
        <div className="text-sm font-semibold text-slate-500">{label}</div>
    </div>
);

const StudentAvatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg' }> = ({ name, size = 'md' }) => {
    const color = generateColorFromName(name);
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-24 h-24 text-4xl'
    };
    return (
        <div className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center text-white font-bold`}>
            {getInitials(name)}
        </div>
    );
};

const InputField: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, placeholder: string, type?: string, required?: boolean, icon: React.ReactNode, helpText?: string }> = React.memo(({label, value, onChange, placeholder, type = "text", required = false, icon, helpText}) => (
    <div>
        <label className="text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
            {icon} {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {type === 'textarea' ? (
                 <textarea value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 border border-slate-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"></textarea>
            ) : (
                <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            )}
        </div>
        {helpText && <small className="text-slate-500 text-xs mt-1">{helpText}</small>}
    </div>
));

interface StudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentData: Pick<Student, 'name' | 'phone' | 'parent' | 'email' | 'notes'>) => void;
    studentToEdit: Student | null;
    addToast: (message: string, type: ToastMessage['type']) => void;
}
const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, onSave, studentToEdit, addToast }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [parent, setParent] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (studentToEdit) {
            setName(studentToEdit.name);
            setPhone(studentToEdit.phone.replace('+1', ''));
            setParent(studentToEdit.parent || '');
            setEmail(studentToEdit.email || '');
            setNotes(studentToEdit.notes || '');
        } else {
            setName('');
            setPhone('');
            setParent('');
            setEmail('');
            setNotes('');
        }
    }, [studentToEdit, isOpen]);

    if (!isOpen) return null;
    
    const handleSave = () => {
        if (!name || !phone) {
            addToast('Name and phone are required!', 'error');
            return;
        }
        let cleanPhone = phone.replace(/[\s()-]/g, '').replace(/^\+?1?/, '');
        if (!/^\d{10}$/.test(cleanPhone)) {
            addToast('Invalid phone number! Must be 10 digits.', 'error');
            return;
        }

        onSave({
            name,
            phone: '+1' + cleanPhone,
            parent,
            email,
            notes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">{studentToEdit ? <Icons.Edit/> : <Icons.Plus/>} {studentToEdit ? 'Edit Student' : 'Add New Student'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
                </div>
                <div className="space-y-4">
                   <InputField icon={<Icons.User className="w-4 h-4 text-slate-400"/>} label="Student Name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" required/>
                   <InputField icon={<Icons.Phone className="w-4 h-4 text-slate-400"/>} label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} placeholder="7276131250" type="tel" required helpText="10 digits - +1 added automatically"/>
                   <InputField icon={<Icons.UserGroup className="w-4 h-4 text-slate-400"/>} label="Parent Name" value={parent} onChange={e => setParent(e.target.value)} placeholder="Parent's name (optional)"/>
                   <InputField icon={<Icons.Envelope className="w-4 h-4 text-slate-400"/>} label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com (optional)" type="email"/>
                   <InputField icon={<Icons.PencilSquare className="w-4 h-4 text-slate-400"/>} label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes (optional)" type="textarea"/>
                </div>
                <button onClick={handleSave} className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">Save Student</button>
            </div>
        </div>
    );
};

const AudioPlayerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    url: string | null;
    studentName: string | null;
}> = ({ isOpen, onClose, url, studentName }) => {
    if (!isOpen || !url) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Icons.VolumeUp /> Recording</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl leading-none">&times;</button>
                </div>
                <p className="text-sm text-slate-600 mb-4">Playing call recording for: <span className="font-semibold">{studentName}</span></p>
                <audio controls autoPlay src={url} className="w-full">
                    Your browser does not support the audio element.
                </audio>
            </div>
        </div>
    );
};

const DemoBanner: React.FC = () => (
    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 rounded-r-lg mb-6 flex items-start gap-3 shadow-sm animate-fade-in">
        <Icons.Info className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div>
            <h4 className="font-bold">Demonstration Mode</h4>
            <p className="text-sm">This is a demo application. All data is stored locally in your browser and will be reset if you clear your cache. No real calls are made.</p>
        </div>
    </div>
);


// --- SECTIONS ---

const OverviewSection: React.FC<{ students: Student[], callHistory: CallRecord[], user: User }> = ({ students, callHistory, user }) => {
    const todayCalls = useMemo(() => callHistory.filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString()), [callHistory]);
    const totalMinutes = useMemo(() => Math.floor(callHistory.reduce((sum, call) => sum + (call.duration || 0), 0) / 60), [callHistory]);
    const recentStudents = useMemo(() => students.slice(-5).reverse(), [students]);
    const recentCalls = useMemo(() => callHistory.slice(0, 5), [callHistory]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<Icons.Students />} label="Total Students" value={students.length} color="from-sky-500 to-cyan-400" />
                <StatCard icon={<Icons.CallCenter />} label="Today's Calls" value={todayCalls.length} color="from-green-500 to-emerald-400" />
                <StatCard icon={<Icons.Clock />} label="Total Minutes Called" value={totalMinutes} color="from-amber-500 to-orange-400" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Recently Added Students</h2>
                     {recentStudents.length > 0 ? (
                        <div className="space-y-3">
                            {recentStudents.map(s => (
                                <div key={s.id} className="bg-slate-50 p-3 rounded-lg flex items-center gap-3">
                                    <StudentAvatar name={s.name} size="md" />
                                    <div>
                                        <p className="font-semibold text-slate-700">{s.name}</p>
                                        {user.type === 'admin' && <p className="text-sm text-slate-500">{s.phone}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500 text-center py-8">No students yet.</p>}
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
                    {recentCalls.length > 0 ? (
                        <div className="space-y-3">
                             {recentCalls.map(c => (
                                <div key={c.id} className={`p-4 rounded-lg ${c.status.includes('Completed') ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-slate-700">{c.studentName}</p>
                                        <p className="text-sm font-medium text-slate-600">{formatDuration(c.duration)}</p>
                                    </div>
                                    <p className="text-xs text-slate-500">by {c.teacherName} on {new Date(c.timestamp).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500 text-center py-8">No activity yet.</p>}
                </div>
            </div>
        </div>
    );
};

const HistorySection: React.FC<{ user: User, callHistory: CallRecord[] }> = ({ user, callHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [nowPlaying, setNowPlaying] = useState<{ url: string; studentName: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const filteredHistory = useMemo(() => callHistory.filter(c =>
        (user.type === 'admin' || c.teacherName === user.name) &&
        (c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.type === 'admin' && c.teacherName.toLowerCase().includes(searchTerm.toLowerCase())))
    ), [callHistory, searchTerm, user]);

    // Reset page to 1 on new search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    
    // Adjust current page if it's out of bounds
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    
    const paginatedHistory = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };


    const getStatusInfo = (status: string): { color: string; icon: React.ReactNode } => {
        if (status.includes('Completed')) return { color: 'bg-green-100 text-green-800', icon: <Icons.CheckCircle className="w-4 h-4"/> };
        if (status.includes('Canceled')) return { color: 'bg-amber-100 text-amber-800', icon: <Icons.ExclamationCircle className="w-4 h-4" /> };
        return { color: 'bg-red-100 text-red-800', icon: <Icons.XCircle className="w-4 h-4" /> };
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Call Log ({filteredHistory.length} records)</h2>
            <div className="relative mb-4">
                <input type="text" placeholder="Search by student or teacher name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            {paginatedHistory.length > 0 ? (
                <>
                    <div className="space-y-4 custom-scrollbar overflow-y-auto max-h-[60vh] pr-2">
                        {paginatedHistory.map((call, index) => {
                            const { color, icon } = getStatusInfo(call.status);
                            return (
                                <div key={call.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                                    {/* Student Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                                        <StudentAvatar name={call.studentName} size="md" />
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">{call.studentName}</p>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <Icons.User className="w-4 h-4"/>
                                                <span>{call.teacherName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Call Metadata */}
                                    <div className="flex items-center gap-6 text-sm text-slate-600 flex-wrap">
                                        <div className="flex items-center gap-2" title="Duration">
                                            <Icons.Clock className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">{formatDuration(call.duration)}</span>
                                        </div>
                                        <div className="flex items-center gap-2" title="Date">
                                            <Icons.Calendar className="w-4 h-4 text-slate-400"/>
                                            <span className="font-medium">{new Date(call.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${color}`}>
                                            {icon} {call.status}
                                        </span>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex-shrink-0">
                                        {call.recordingUrl && user.type === 'admin' && (
                                            <button 
                                                onClick={() => setNowPlaying({ url: call.recordingUrl!, studentName: call.studentName })}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg text-sm hover:bg-indigo-600 transition-colors"
                                            >
                                                <Icons.Play className="w-4 h-4" />
                                                <span>Play Recording</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
                            <div>
                                <span className="text-sm text-slate-600 font-medium">
                                    Showing <span className="font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)}</span> of <span className="font-bold">{filteredHistory.length}</span> records
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg text-sm border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg text-sm border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <EmptyState icon={<Icons.DocumentText />} message="No Call History Found" description={searchTerm ? "Your search returned no results." : "No calls have been logged yet."} />
            )}
             <AudioPlayerModal 
                isOpen={!!nowPlaying}
                onClose={() => setNowPlaying(null)}
                url={nowPlaying?.url || null}
                studentName={nowPlaying?.studentName || null}
            />
        </div>
    );
};


const BarChart: React.FC<{ data: { [key: string]: number }; title: string; color: string }> = ({ data, title, color }) => {
    const maxValue = Math.max(...(Object.values(data) as number[]), 1);
    const sortedData = (Object.entries(data) as [string, number][]).sort((a, b) => b[1] - a[1]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
            <div className="flex justify-around items-end h-48 gap-4 px-2">
                {sortedData.map(([label, value], index) => (
                    <div key={label} className="flex flex-col items-center flex-1 w-full" title={`${label}: ${value} calls`}>
                        <div className={`w-full ${color} rounded-t-md hover:opacity-80 transition-opacity animate-bar-grow`} style={{ height: `${(value / maxValue) * 100}%`, animationDelay: `${index * 50}ms` }} />
                        <span className="text-xs text-slate-500 mt-2 truncate w-full text-center">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DonutChart: React.FC<{ data: { [key: string]: number }; title: string; }> = ({ data, title }) => {
    const total = Object.values(data).reduce<number>((sum, val) => sum + (val as number), 0);
    const colors = { Completed: '#34d399', Failed: '#f87171', Canceled: '#fbbf24' };
    
    let cumulative = 0;
    const gradientStops = Object.entries(data).map((entry: [string, number]) => {
        const [label, value] = entry;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        const start = cumulative;
        const end = cumulative + percentage;
        cumulative = end;
        return `${colors[label as keyof typeof colors] || '#60a5fa'} ${start}% ${end}%`;
    }).join(', ');

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
            <div className="flex-1 flex items-center justify-center gap-8 flex-wrap">
                <div className="relative w-40 h-40">
                    <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gradientStops})` }} />
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-3xl font-extrabold text-slate-800">{total}</span>
                            <span className="text-sm text-slate-500 block">Total</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    {Object.entries(data).map((entry: [string, number]) => {
                        const [label, value] = entry;
                        return (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[label as keyof typeof colors] || '#60a5fa' }}></div>
                            <span className="text-sm font-medium text-slate-600">{label}: {value} ({total > 0 ? (value/total * 100).toFixed(0) : 0}%)</span>
                        </div>
                    );
                    })}
                </div>
            </div>
        </div>
    );
};


const AnalyticsSection: React.FC<{ callHistory: CallRecord[] }> = ({ callHistory }) => {
    const analyticsData = useMemo(() => {
        const totalCalls = callHistory.length;
        const totalMinutes = Math.floor(callHistory.reduce((sum: number, call: CallRecord) => sum + call.duration, 0) / 60);
        const averageDuration = totalCalls > 0 ? formatDuration(callHistory.reduce((sum: number, call: CallRecord) => sum + call.duration, 0) / totalCalls) : '00:00';
        
        const statusCounts = callHistory.reduce((acc: { [key: string]: number }, call: CallRecord) => {
            const simpleStatus = call.status.split(' ')[0]; // Completed, Failed, Canceled
            acc[simpleStatus] = (acc[simpleStatus] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const callsByTeacher = callHistory.reduce((acc: { [key: string]: number }, call: CallRecord) => {
            acc[call.teacherName] = (acc[call.teacherName] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        
        return { totalCalls, totalMinutes, averageDuration, statusCounts, callsByTeacher };
    }, [callHistory]);

    if (callHistory.length === 0) {
        return <EmptyState icon={<Icons.Analytics />} message="No Data for Analytics" description="Make some calls to generate performance data and reports." />;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<Icons.CallCenter />} label="Total Calls Made" value={analyticsData.totalCalls} color="from-sky-500 to-cyan-400" />
                <StatCard icon={<Icons.Clock />} label="Total Minutes" value={analyticsData.totalMinutes} color="from-amber-500 to-orange-400" />
                <StatCard icon={<Icons.Clock />} label="Average Call Time" value={analyticsData.averageDuration} color="from-violet-500 to-purple-400" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BarChart data={analyticsData.callsByTeacher} title="Calls by Teacher" color="bg-indigo-400" />
                <DonutChart data={analyticsData.statusCounts} title="Call Status Distribution" />
            </div>
        </div>
    );
};


// --- MAIN APP & LAYOUT ---

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('quranAcademyUser', null);
    const [students, setStudents] = useLocalStorage<Student[]>('quranAcademyStudents', []);
    const [callHistory, setCallHistory] = useLocalStorage<CallRecord[]>('quranAcademyCallHistory', []);
    const [teachers, setTeachers] = useLocalStorage<Teacher[]>('quranAcademyTeachers', []);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
    const [prompt, setPrompt] = useState<PromptState | null>(null);

    // Seed data on first load to make the demo feel alive and usable, without a page refresh.
    useEffect(() => {
        const hasBeenSeeded = window.localStorage.getItem('quranAcademySeeded');
        if (!hasBeenSeeded) {
            console.log("Seeding initial data for demo...");
            setStudents(SAMPLE_STUDENTS);
            setCallHistory(SAMPLE_CALL_HISTORY);
            setTeachers(SAMPLE_TEACHERS);
            window.localStorage.setItem('quranAcademySeeded', 'true');
        }
    }, [setStudents, setCallHistory, setTeachers]);

    const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    const dismissToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleLogin = (user: User) => {
        setCurrentUser(user);
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        addToast("You have been logged out.", 'info');
    };

    if (!currentUser) {
        return (
            <>
                <LoginScreen onLogin={handleLogin} addToast={addToast} />
                <ToastContainer toasts={toasts} dismissToast={dismissToast} />
            </>
        );
    }

    return (
        <>
            <Dashboard 
                user={currentUser} 
                onLogout={handleLogout} 
                students={students}
                setStudents={setStudents}
                callHistory={callHistory}
                setCallHistory={setCallHistory}
                teachers={teachers}
                setTeachers={setTeachers}
                addToast={addToast}
                setConfirmation={setConfirmation}
                setPrompt={setPrompt}
            />
            <ToastContainer toasts={toasts} dismissToast={dismissToast} />
            <ConfirmationModal 
                isOpen={!!confirmation}
                onClose={() => setConfirmation(null)}
                state={confirmation}
            />
            <PromptModal
                isOpen={!!prompt}
                onClose={() => setPrompt(null)}
                state={prompt}
            />
        </>
    );
};


// --- Login Screen Component ---
const LoginScreen: React.FC<{ onLogin: (user: User) => void, addToast: (message: string, type: ToastMessage['type']) => void }> = ({ onLogin, addToast }) => {
    const [activeTab, setActiveTab] = useState<'admin' | 'staff'>('admin');
    const [adminPassword, setAdminPassword] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [teacherPassword, setTeacherPassword] = useState('');

    const handleAdminLogin = () => {
        if (adminPassword === ADMIN_PASSWORD) {
            onLogin({ type: 'admin', name: 'Administrator', avatar: 'A' });
        } else {
            addToast('Incorrect admin password!', 'error');
        }
    };
    
    const handleStaffLogin = () => {
        if (!teacherName.trim()) {
            addToast('Please enter your name!', 'error');
            return;
        }
        if (teacherPassword === STAFF_PASSWORD) {
            onLogin({ type: 'staff', name: teacherName.trim(), avatar: teacherName.trim().charAt(0).toUpperCase() });
        } else {
            addToast('Incorrect staff password!', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
                <div className="text-center mb-8">
                    <div className="inline-block bg-gradient-to-r from-indigo-500 to-violet-500 p-4 rounded-2xl mb-4">
                        <Icons.BuildingLibrary className="w-8 h-8 text-white"/>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Quran Academy</h1>
                    <p className="text-slate-500">Professional Calling System</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl mb-6">
                    <button onClick={() => setActiveTab('admin')} className={`px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'}`}>Administrator</button>
                    <button onClick={() => setActiveTab('staff')} className={`px-4 py-3 text-sm font-bold rounded-lg transition-colors ${activeTab === 'staff' ? 'bg-white shadow text-indigo-600' : 'text-slate-600'}`}>Teacher</button>
                </div>

                {activeTab === 'admin' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block flex items-center gap-2"><Icons.LockClosed className="w-4 h-4"/> Admin Password</label>
                            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdminLogin()} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Enter admin password"/>
                        </div>
                        <button onClick={handleAdminLogin} className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">Login as Administrator</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                             <label className="text-sm font-medium text-slate-600 mb-1 block flex items-center gap-2"><Icons.User className="w-4 h-4"/> Teacher Name</label>
                             <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Enter your full name"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600 mb-1 block flex items-center gap-2"><Icons.LockClosed className="w-4 h-4"/> Password</label>
                             <input type="password" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleStaffLogin()} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Enter password"/>
                        </div>
                        <button onClick={handleStaffLogin} className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">Login as Teacher</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Dashboard Component (The main logged-in view) ---

interface DashboardProps {
    user: User;
    onLogout: () => void;
    students: Student[];
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    callHistory: CallRecord[];
    setCallHistory: React.Dispatch<React.SetStateAction<CallRecord[]>>;
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    addToast: (message: string, type: ToastMessage['type']) => void;
    setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState | null>>;
    setPrompt: React.Dispatch<React.SetStateAction<PromptState | null>>;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { user, onLogout, students, setStudents, callHistory, setCallHistory, teachers, setTeachers, addToast, setConfirmation, setPrompt } = props;
    const [activeSection, setActiveSection] = useState<Section>(user.type === 'admin' ? 'overview' : 'students');
    const [studentToCall, setStudentToCall] = useState<Student | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const addCallToHistory = useCallback((call: Omit<CallRecord, 'id'>) => {
        setCallHistory(prev => [{ ...call, id: Date.now() }, ...prev]);
    }, [setCallHistory]);
    
    const initiateCall = useCallback((student: Student) => {
        setStudentToCall(student);
        setActiveSection('calls');
    }, []);

    const clearStudentToCall = useCallback(() => {
        setStudentToCall(null);
    }, []);

    const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
        overview: { title: 'Dashboard Overview', subtitle: "Welcome back! Here's your overview" },
        students: { title: 'Students List', subtitle: 'Select a student to begin calling' },
        calls: { title: 'Call Center', subtitle: 'Make calls to your students' },
        history: { title: 'Call History', subtitle: 'View all past calls' },
        analytics: { title: 'Analytics & Reports', subtitle: 'Performance metrics' },
        users: { title: 'User Management', subtitle: 'Manage teacher accounts' },
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'students':
                return <StudentsSection
                    user={user}
                    students={students}
                    setStudents={setStudents}
                    onInitiateCall={initiateCall}
                    addToast={addToast}
                    setConfirmation={setConfirmation}
                />;
            case 'calls':
                return <CallCenterSection
                    user={user}
                    students={students}
                    addCallToHistory={addCallToHistory}
                    studentToCall={studentToCall}
                    onCallFinished={clearStudentToCall}
                    addToast={addToast}
                />;
            case 'history':
                return <HistorySection user={user} callHistory={callHistory} />;
            case 'analytics':
                 return user.type === 'admin' ? <AnalyticsSection callHistory={callHistory} /> : null;
            case 'users':
                return user.type === 'admin' ? <UsersSection teachers={teachers} setTeachers={setTeachers} addToast={addToast} setConfirmation={setConfirmation} setPrompt={setPrompt} /> : null;
            case 'overview':
            default:
                 return user.type === 'admin' ? <OverviewSection students={students} callHistory={callHistory} user={user}/> : null;
        }
    };
    
    return (
        <div className="flex min-h-screen bg-slate-100">
            <Sidebar user={user} activeSection={activeSection} setActiveSection={setActiveSection} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
            <main className="flex-1 lg:pl-64 transition-all duration-300">
                <div className="p-4 sm:p-6 lg:p-8">
                    <TopBar 
                        title={sectionTitles[activeSection].title} 
                        subtitle={sectionTitles[activeSection].subtitle} 
                        user={user} 
                        onLogout={onLogout} 
                        onMenuClick={() => setSidebarOpen(o => !o)} 
                    />
                    <div className="mt-6">
                        <DemoBanner />
                        {renderSection()}
                    </div>
                </div>
            </main>
        </div>
    );
};


// --- Sub-components for Dashboard ---

const TopBar: React.FC<{ title: string; subtitle: string; user: User; onLogout: () => void; onMenuClick: () => void; }> = 
({ title, subtitle, user, onLogout, onMenuClick }) => {
    return (
        <header className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex justify-between items-center">
            <div className="flex items-center gap-4">
                 <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="font-semibold text-slate-700">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.type} Account</p>
                </div>
                <StudentAvatar name={user.name} />
                <button onClick={onLogout} title="Logout" className="text-slate-500 hover:text-red-500 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </header>
    );
};


const Sidebar: React.FC<{ user: User, activeSection: Section, setActiveSection: (s: Section) => void, isOpen: boolean, setOpen: (o: boolean) => void }> = 
({ user, activeSection, setActiveSection, isOpen, setOpen }) => {
    
    const NavItem: React.FC<{ section: Section, icon: React.ReactNode, label: string, disabled?: boolean }> = ({ section, icon, label, disabled = false }) => {
        const isActive = activeSection === section;
        return (
            <button
                disabled={disabled}
                onClick={() => { setActiveSection(section); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {icon}
                <span className="font-semibold">{label}</span>
            </button>
        );
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
            <aside className={`fixed top-0 left-0 w-64 h-full bg-white border-r border-slate-200 p-4 z-40 transform transition-transform lg:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                 <div className="flex items-center gap-3 p-2 mb-6">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-3 rounded-xl">
                        <Icons.BuildingLibrary className="w-6 h-6 text-white"/>
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold text-slate-800">Quran Academy</h1>
                        <p className="text-xs text-slate-500">Calling System</p>
                    </div>
                </div>
                <nav className="space-y-2">
                    {user.type === 'admin' && <NavItem section="overview" icon={<Icons.Dashboard className="w-5 h-5"/>} label="Overview" />}
                    <NavItem section="students" icon={<Icons.Students className="w-5 h-5"/>} label="Students" />
                    <NavItem section="calls" icon={<Icons.CallCenter className="w-5 h-5"/>} label="Call Center" />
                    <NavItem section="history" icon={<Icons.History className="w-5 h-5"/>} label="History" />
                    {user.type === 'admin' && <NavItem section="analytics" icon={<Icons.Analytics className="w-5 h-5"/>} label="Analytics" />}
                    {user.type === 'admin' && <NavItem section="users" icon={<Icons.Users className="w-5 h-5"/>} label="Users" />}
                </nav>
            </aside>
        </>
    );
};


const StudentsSection: React.FC<{ 
    user: User, 
    students: Student[], 
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>, 
    onInitiateCall: (student: Student) => void,
    addToast: (message: string, type: ToastMessage['type']) => void;
    setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState | null>>;
}> = ({ user, students, setStudents, onInitiateCall, addToast, setConfirmation }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

    const filteredStudents = useMemo(() => students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    ), [students, searchTerm]);

    const handleSaveStudent = (studentData: Pick<Student, 'name' | 'phone' | 'parent' | 'email' | 'notes'>) => {
        if (studentToEdit) {
            setStudents(prev => prev.map(s => s.id === studentToEdit.id ? { ...s, ...studentData, updatedAt: new Date().toISOString(), updatedBy: user.name } : s));
            addToast(`Student "${studentData.name}" updated successfully.`, 'success');
        } else {
            const newStudent: Student = {
                ...studentData,
                id: Date.now(),
                addedBy: user.name,
                addedAt: new Date().toISOString()
            };
            setStudents(prev => [...prev, newStudent]);
            addToast(`Student "${studentData.name}" added successfully.`, 'success');
        }
        setModalOpen(false);
        setStudentToEdit(null);
    };

    const handleDelete = (student: Student) => {
        setConfirmation({
            title: 'Delete Student',
            message: `Are you sure you want to delete ${student.name}? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () => {
                setStudents(prev => prev.filter(s => s.id !== student.id));
                addToast(`Student "${student.name}" has been deleted.`, 'success');
            }
        });
    };
    
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                 <div className="relative flex-1 min-w-[250px]">
                    <input type="text" placeholder="Search by name or phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {user.type === 'admin' && (
                    <button onClick={() => { setStudentToEdit(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                        <Icons.Plus className="w-5 h-5"/>
                        Add Student
                    </button>
                )}
            </div>

            {filteredStudents.length > 0 ? (
                <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[65vh] pr-2">
                    {filteredStudents.map((student, index) => (
                        <div key={student.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <div className="flex items-center gap-4">
                                    <StudentAvatar name={student.name} />
                                    <div>
                                        <p className="font-bold text-slate-800">{student.name}</p>
                                        <p className="text-sm text-slate-500">{student.parent}</p>
                                    </div>
                                </div>
                                <div className="text-slate-600">{student.phone}</div>
                                <div className="text-slate-600 hidden md:block">{student.email}</div>
                                <div className="flex items-center justify-end gap-2">
                                     <button onClick={() => onInitiateCall(student)} className="p-2 text-green-600 bg-green-100 rounded-full hover:bg-green-200 transition-colors" title="Call Student">
                                        <Icons.CallCenter className="w-5 h-5" />
                                    </button>
                                    {user.type === 'admin' && (
                                        <>
                                            <button onClick={() => { setStudentToEdit(student); setModalOpen(true); }} className="p-2 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors" title="Edit Student">
                                                <Icons.Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(student)} className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors" title="Delete Student">
                                                <Icons.Trash className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <EmptyState icon={<Icons.Students />} message="No Students Found" description={searchTerm ? "Your search returned no results." : "No students have been added yet."} action={
                     user.type === 'admin' ? <button onClick={() => { setStudentToEdit(null); setModalOpen(true); }} className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg">Add First Student</button> : undefined
                 }/>
            )}
            
            <StudentModal 
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveStudent}
                studentToEdit={studentToEdit}
                addToast={addToast}
            />
        </div>
    );
};

interface CallEndOptions {
    canceled?: boolean;
    dropped?: boolean;
    studentEnded?: boolean;
}

const CallCenterSection: React.FC<{ 
    user: User, 
    students: Student[], 
    addCallToHistory: (call: Omit<CallRecord, 'id'>) => void, 
    studentToCall: Student | null, 
    onCallFinished: () => void,
    addToast: (message: string, type: ToastMessage['type']) => void
}> = ({ user, students, addCallToHistory, studentToCall, onCallFinished, addToast }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(studentToCall?.id || null);
    const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'active' | 'finished'>('idle');
    const [duration, setDuration] = useState(0);
    const [finishReason, setFinishReason] = useState('');
    const timerRef = useRef<number | null>(null);
    const callEndTimerRef = useRef<number | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioStreamRef = useRef<MediaStream | null>(null);

    const student = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

    useEffect(() => {
        setSelectedStudentId(studentToCall?.id || null);
        setCallStatus('idle');
        setDuration(0);
    }, [studentToCall]);
    
     useEffect(() => {
        return () => {
            stopTimer();
            if (callEndTimerRef.current) clearTimeout(callEndTimerRef.current);
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startTimer = () => {
        timerRef.current = window.setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleCallStart = async () => {
        if (!student) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            setCallStatus('dialing');
            setDuration(0);
            
            setTimeout(() => {
                const dialOutcome = Math.random();
                if (dialOutcome < 0.8) { // 80% success
                    recorder.start();
                    setCallStatus('active');
                    startTimer();

                    // Simulate realistic call ending scenarios
                    const endScenario = Math.random();
                    if (endScenario < 0.15) { // 15% chance of a dropped call
                        const dropTime = Math.floor(Math.random() * 25000) + 5000; // 5-30s
                        callEndTimerRef.current = window.setTimeout(() => handleCallEnd({ dropped: true }), dropTime);
                    } else if (endScenario < 0.75) { // 60% chance student hangs up first
                        const hangupTime = Math.floor(Math.random() * 150000) + 30000; // 30s - 3min
                        callEndTimerRef.current = window.setTimeout(() => handleCallEnd({ studentEnded: true }), hangupTime);
                    }
                    // The remaining 25% of calls continue until the teacher hangs up manually.

                } else if (dialOutcome < 0.9) { // 10% busy
                    setCallStatus('finished');
                    setFinishReason(`Call to ${student.name} failed: Line was busy.`);
                    stream.getTracks().forEach(track => track.stop());
                    addCallToHistory({
                        studentName: student.name, status: 'Failed (Busy)', duration: 0, teacherName: user.name,
                        timestamp: new Date().toISOString(), recordingUrl: null,
                    });
                    addToast(`Call to ${student.name} failed (Line busy).`, 'error');
                    onCallFinished();
                } else { // 10% no answer
                    setCallStatus('finished');
                    setFinishReason(`Call to ${student.name} failed: No answer.`);
                    stream.getTracks().forEach(track => track.stop());
                    addCallToHistory({
                        studentName: student.name, status: 'Failed (No Answer)', duration: 0, teacherName: user.name,
                        timestamp: new Date().toISOString(), recordingUrl: null,
                    });
                    addToast(`Call to ${student.name} failed (no answer).`, 'error');
                    onCallFinished();
                }
            }, 3000); // 3-second dial time
        } catch (err) {
            console.error("Microphone access error:", err);
            addToast("Microphone access is required. Please allow permission.", 'error');
            setCallStatus('idle');
        }
    };
    
    const handleCallEnd = ({ canceled = false, dropped = false, studentEnded = false }: CallEndOptions = {}) => {
        stopTimer();
        if (callEndTimerRef.current) {
            clearTimeout(callEndTimerRef.current);
            callEndTimerRef.current = null;
        }

        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
        }

        const processRecording = async (status: string) => {
            if (!student) return;
            
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
            const recordingUrl = await blobToBase64(audioBlob);

            addCallToHistory({
                studentName: student.name,
                status,
                duration,
                teacherName: user.name,
                timestamp: new Date().toISOString(),
                recordingUrl,
            });
            
            if (dropped) {
                setFinishReason(`Call with ${student.name} was dropped.`);
                addToast(`Call with ${student.name} dropped. Partial recording saved.`, 'error');
            } else if (studentEnded) {
                setFinishReason(`The student has ended the call.`);
                addToast(`Call with ${student.name} ended. Duration: ${formatDuration(duration)}.`, 'success');
            } else {
                setFinishReason(`The call with ${student.name} has ended.`);
                addToast(`Call with ${student.name} completed. Duration: ${formatDuration(duration)}.`, 'success');
            }
            
            setCallStatus('finished');
            onCallFinished();
        };

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            const status = dropped ? 'Failed (Dropped)' : 'Completed';
            mediaRecorderRef.current.onstop = () => processRecording(status);
            mediaRecorderRef.current.stop();
        } else {
            if (student && canceled) {
                addCallToHistory({
                    studentName: student.name, status: 'Canceled', duration: 0, teacherName: user.name,
                    timestamp: new Date().toISOString(), recordingUrl: null,
                });
                setFinishReason(`Call to ${student.name} was canceled.`);
                addToast(`Call to ${student.name} was canceled.`, 'info');
            }
            setCallStatus('finished');
            onCallFinished();
        }
    };
    
    const reset = () => {
        stopTimer();
        setCallStatus('idle');
        setDuration(0);
        setSelectedStudentId(null);
        setFinishReason('');
        onCallFinished();
    };

    if (callStatus === 'finished') {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Call Summary</h2>
                <p className="text-slate-500 mb-6">{finishReason}</p>
                <div className="text-4xl font-mono font-bold text-indigo-600 mb-6">{formatDuration(duration)}</div>
                <button onClick={reset} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                    Make Another Call
                </button>
            </div>
        )
    }

    if (!student && callStatus === 'idle') {
        return (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Select a Student to Call</h2>
                {students.length > 0 ? (
                    <select 
                        onChange={e => setSelectedStudentId(Number(e.target.value))} 
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                        <option value="">-- Choose a student --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>)}
                    </select>
                ) : (
                    <p className="text-slate-500">No students available to call. Please add students first.</p>
                )}
            </div>
        )
    }

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 text-center max-w-md mx-auto">
            <StudentAvatar name={student?.name || '...'} size="lg" />
            <h2 className="text-3xl font-bold text-slate-800 mt-4">{student?.name}</h2>
            <p className="text-slate-500 text-lg">{student?.phone}</p>
            
            <div className="my-8 h-16 flex items-center justify-center">
                {callStatus === 'dialing' && <p className="text-xl font-semibold text-sky-600 animate-pulse">Dialing...</p>}
                {callStatus === 'active' && <p className="text-5xl font-mono font-bold text-green-600">{formatDuration(duration)}</p>}
                 {callStatus === 'idle' && <p className="text-xl font-semibold text-slate-600">Ready to call</p>}
            </div>

            <div className="flex justify-center gap-6">
                {callStatus === 'idle' && (
                    <button onClick={handleCallStart} className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors">
                        <Icons.CallCenter className="w-8 h-8"/>
                    </button>
                )}
                {(callStatus === 'dialing' || callStatus === 'active') && (
                     <button onClick={() => handleCallEnd({ canceled: callStatus === 'dialing' })} className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2 2m-2-2v4.5A4.5 4.5 0 0113.5 15h-3a4.5 4.5 0 01-4.5-4.5V4.5m0 0L8 8m-2-2l2-2" transform="rotate(135 12 12)"/></svg>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- NEW ADMIN-ONLY SECTION ---

const UsersSection: React.FC<{ 
    teachers: Teacher[], 
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>,
    addToast: (message: string, type: ToastMessage['type']) => void;
    setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState | null>>;
    setPrompt: React.Dispatch<React.SetStateAction<PromptState | null>>;
}> = ({ teachers, setTeachers, addToast, setConfirmation, setPrompt }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTeachers = useMemo(() => teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [teachers, searchTerm]);

    const handleAddTeacher = () => {
        setPrompt({
            title: 'Add New Teacher',
            message: "Enter the new teacher's full name.",
            label: "Teacher Name",
            onConfirm: (name) => {
                if (name && name.trim()) {
                    const newTeacher: Teacher = {
                        id: Date.now(),
                        name: name.trim(),
                        addedAt: new Date().toISOString()
                    };
                    setTeachers(prev => [...prev, newTeacher]);
                    addToast(`Teacher "${name.trim()}" added successfully.`, 'success');
                } else {
                    addToast('Teacher name cannot be empty.', 'error');
                }
            }
        });
    };

    const handleDelete = (teacher: Teacher) => {
        setConfirmation({
            title: 'Delete Teacher',
            message: `Are you sure you want to delete ${teacher.name}? This will not affect their past call records.`,
            confirmText: 'Delete',
            onConfirm: () => {
                setTeachers(prev => prev.filter(t => t.id !== teacher.id));
                addToast(`Teacher "${teacher.name}" has been deleted.`, 'success');
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="relative flex-1 min-w-[250px]">
                    <input type="text" placeholder="Search by teacher name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <button onClick={handleAddTeacher} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                    <Icons.Plus className="w-5 h-5"/>
                    Add Teacher
                </button>
            </div>

            {filteredTeachers.length > 0 ? (
                <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[65vh] pr-2">
                    {filteredTeachers.map((teacher, index) => (
                        <div key={teacher.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div className="flex items-center gap-4">
                                    <StudentAvatar name={teacher.name} />
                                    <p className="font-bold text-slate-800">{teacher.name}</p>
                                </div>
                                <div className="text-slate-600">
                                    <p>Added on: {new Date(teacher.addedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleDelete(teacher)} className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors" title="Delete Teacher">
                                        <Icons.Trash className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <EmptyState icon={<Icons.Users />} message="No Teachers Found" description={searchTerm ? "Your search returned no results." : "No teachers have been added yet."} action={
                     <button onClick={handleAddTeacher} className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg">Add First Teacher</button>
                 }/>
            )}
        </div>
    );
};


export default App;