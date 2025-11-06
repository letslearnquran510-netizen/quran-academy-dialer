import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  Icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
  Icon,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-2xl dark:bg-slate-800 dark:border dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {Icon && (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900">
                <Icon className="h-7 w-7 text-rose-600 dark:text-rose-400" />
              </div>
            )}
            <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">
              {title}
            </h2>
            <div className="mt-2 text-slate-600 dark:text-slate-400">
              {children}
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-slate-200 px-4 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`w-full rounded-lg px-4 py-2.5 font-semibold text-white transition-colors ${confirmButtonClass} focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
