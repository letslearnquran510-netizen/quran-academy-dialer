
import React from 'react';
import { BookIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-3 text-emerald-600 dark:text-emerald-400">
        <BookIcon className="h-8 w-8" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">
          Academy Dialer
        </h1>
      </div>
      <p className="mt-2 text-md text-slate-600 dark:text-slate-400">
        Connecting with students, one call at a time.
      </p>
    </header>
  );
};

export default Header;
