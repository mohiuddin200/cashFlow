import React, { useEffect, useRef, useState } from 'react';

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface SelectDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  options: SelectOption[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

const SelectDialog: React.FC<SelectDialogProps> = ({
  isOpen,
  title,
  message,
  options,
  submitLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
}) => {
  const [selected, setSelected] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(options.length > 0 ? options[0].value : '');
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCancel();
      };
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, options, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-dialog-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="select-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{message}</p>
        <div className="max-h-48 overflow-y-auto mb-4 space-y-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                selected === option.value
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => selected && onSubmit(selected)}
            disabled={!selected}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white active:bg-emerald-600 transition-colors active:scale-95 disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectDialog;
