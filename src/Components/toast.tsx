'use client';

import {
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@radix-ui/react-toast';
import { ReactNode, createContext, useContext, useState } from 'react';

type ToastContextType = {
  toast: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ message: string; title?: string }>({
    message: '',
    title: undefined,
  });

  const toast = (message: string, title?: string) => {
    setToastInfo({ message, title });
    setOpen(true);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider >
        {children}
        <Toast
          open={open}
          onOpenChange={setOpen}
          duration={3000}
          className="bg-white rounded-md shadow-lg p-4"
        >
          {toastInfo.title && (
            <ToastTitle className="font-bold text-gray-900">
              {toastInfo.title}
            </ToastTitle>
          )}
          <ToastDescription className="text-gray-700">
            {toastInfo.message}
          </ToastDescription>
          <ToastClose className="absolute top-2 right-2 text-gray-500 hover:text-gray-900">
            ×
          </ToastClose>
        </Toast>
        <ToastViewport className="fixed bottom-0 right-0 p-4" />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};