import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookIcon, UserIcon, KeyIcon, SpinnerIcon } from './icons';

interface LoginProps {
  onLogin: (type: 'staff' | 'admin', name: string) => void;
}

// Check for development mode using process.env.NODE_ENV.
// This is a standard variable injected by bundlers like Vite and is more reliable across environments.
const IS_DEV_MODE = process.env.NODE_ENV === 'development';


const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'admin'>('staff');
  const [staffName, setStaffName] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (type: 'staff' | 'admin') => {
    setIsLoading(true);
    setError('');

    // --- DEVELOPER MODE: Bypass backend authentication entirely. ---
    if (IS_DEV_MODE) {
        console.warn('DEVELOPER MODE: Bypassing API authentication. No password needed.');
        // Simulate a slight delay for a better user experience
        setTimeout(() => {
            onLogin(type, type === 'staff' ? (staffName || 'Local Staff') : 'Admin');
            // No need to set isLoading to false, as the component will unmount on success.
        }, 500);
        return; // Stop here for local development
    }

    // --- PRODUCTION MODE: Call the real backend API. ---
    const body = type === 'staff' 
        ? { type: 'staff', name: staffName, password: staffPassword }
        : { type: 'admin', password: adminPassword };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // Handle non-successful responses (e.g., 401, 404, 500)
        if (!response.ok) {
            let errorMessage;
            // Try to parse a JSON error response from our API, but anticipate other response types.
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || `Server responded with status ${response.status}.`;
            } catch (e) {
                // This catches cases where the response isn't JSON, like a Vercel 404 HTML page.
                if (response.status === 404) {
                    errorMessage = 'Login API endpoint not found (404). This suggests the backend function failed to deploy correctly. Please check your Vercel deployment logs for errors in the "api/login" function.';
                } else {
                    errorMessage = `Server returned an invalid, non-JSON response (status ${response.status}). This can happen if the API endpoint is misconfigured or down.`;
                }
            }
            setError(errorMessage);
            setIsLoading(false);
            return;
        }

        // If the response was successful (2xx), we expect JSON.
        const data = await response.json();

        if (data.success) {
            onLogin(type, type === 'staff' ? staffName : 'Admin');
        } else {
            // Handles cases where the API returns a 200 OK status but indicates failure in the body.
            setError(data.message || 'Login failed due to an unknown server reason.');
            setIsLoading(false);
        }
    } catch (networkError) {
        console.error("Login API call failed (network level):", networkError);
        setError('A network error occurred while trying to contact the login service. Please check your internet connection and ensure the application is deployed correctly.');
        setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent, type: 'staff' | 'admin') => {
    e.preventDefault();
    handleLogin(type);
  };

  const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-1/2 rounded-md py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
        isActive
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400">
                <BookIcon className="h-8 w-8" />
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">
                Academy Dialer
                </h1>
            </div>
        </header>
        <div className="rounded-xl bg-white dark:bg-slate-800 p-8 shadow-2xl dark:border dark:border-slate-700">
          <div className="mb-6 flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
            <TabButton label="Staff Login" isActive={activeTab === 'staff'} onClick={() => { setActiveTab('staff'); setError(''); }} />
            <TabButton label="Admin Login" isActive={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); setError(''); }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'staff' ? (
                    <form onSubmit={(e) => handleFormSubmit(e, 'staff')} className="space-y-4">
                        <div>
                            <label htmlFor="staff-name" className="sr-only">Your Name</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <UserIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input id="staff-name" type="text" placeholder="Your Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} required className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-3 pl-10 pr-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                        </div>
                         {!IS_DEV_MODE && (
                            <div>
                                <label htmlFor="staff-password" className="sr-only">Password</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <KeyIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input id="staff-password" type="password" placeholder="Password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-3 pl-10 pr-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                         )}
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-sky-400 dark:disabled:bg-sky-800">
                            {isLoading ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : `Login as Staff ${IS_DEV_MODE ? '(Dev Mode)' : ''}`}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={(e) => handleFormSubmit(e, 'admin')} className="space-y-4">
                        {!IS_DEV_MODE && (
                            <div>
                                <label htmlFor="admin-password" className="sr-only">Admin Password</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <KeyIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input id="admin-password" type="password" placeholder="Admin Secret Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-3 pl-10 pr-4 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                        )}
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-sky-400 dark:disabled:bg-sky-800">
                            {isLoading ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : `Login as Admin ${IS_DEV_MODE ? '(Dev Mode)' : ''}`}
                        </button>
                    </form>
                )}
            </motion.div>
          </AnimatePresence>
        </div>
        {error && (
            <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center text-sm font-medium text-rose-600 dark:text-rose-400 w-full max-w-sm"
            >
                {error}
            </motion.p>
        )}
        {IS_DEV_MODE && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-center text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3"
            >
                <p><strong className="font-semibold">Developer Mode is Active.</strong> Login is automatic for local testing. Passwords are not required.</p>
            </motion.div>
        )}
         <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400 w-full max-w-sm">
            <p><strong>Note for Admin:</strong> For the secure login to work when deployed, you must set the <code>ADMIN_PASSWORD</code> and <code>STAFF_PASSWORD</code> environment variables in your hosting provider's settings (e.g., Vercel).</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;