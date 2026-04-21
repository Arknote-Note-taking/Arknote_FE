import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-surface border border-border w-full max-w-sm rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-6 transform transition-all">
        <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-text-primary bg-background border border-border hover:bg-black/5 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="px-4 py-2 text-sm font-medium text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-lg transition-colors shadow-sm"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
