import React, { createContext, useContext, useState, useRef } from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({
    title: 'Xác nhận',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    type: 'warning',
  });
  
  const resolverRef = useRef(null);

  const confirm = (optionsOrMessage) => {
    const isEn = language === 'en';
    let finalOptions = {
      title: isEn ? 'Confirm' : 'Xác nhận',
      message: '',
      confirmText: isEn ? 'Confirm' : 'Đồng ý',
      cancelText: isEn ? 'Cancel' : 'Hủy',
      type: 'warning',
    };

    if (typeof optionsOrMessage === 'string') {
      finalOptions.message = optionsOrMessage;
      // Automatically detect typical actions like "delete", "remove", "xóa", "hủy bỏ"
      const lower = optionsOrMessage.toLowerCase();
      if (lower.includes('xóa') || lower.includes('delete') || lower.includes('loại bỏ') || lower.includes('remove')) {
        finalOptions.title = isEn ? 'Confirm Delete' : 'Xác nhận xóa';
        finalOptions.confirmText = isEn ? 'Delete' : 'Xóa';
        finalOptions.type = 'danger';
      }
    } else if (optionsOrMessage && typeof optionsOrMessage === 'object') {
      finalOptions = { ...finalOptions, ...optionsOrMessage };
    }

    setOptions(finalOptions);
    setIsOpen(true);

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) resolverRef.current(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) resolverRef.current(false);
  };

  const getIcon = () => {
    switch (options.type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (options.type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-md shadow-red-500/20 cursor-pointer';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-md shadow-blue-500/20 cursor-pointer';
      case 'warning':
      default:
        return 'bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer';
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Layout Content */}
            <div className="flex gap-4 items-start mt-2">
              <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl shrink-0">
                {getIcon()}
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="text-base font-black text-text-primary">
                  {options.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {options.message}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
              <button
                onClick={handleCancel}
                className="bg-background hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-secondary hover:text-text-primary font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                {options.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={getConfirmButtonClass()}
              >
                {options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
