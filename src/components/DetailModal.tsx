import { X } from 'lucide-react';
import React, { useEffect } from 'react';

interface DetailModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  ChartComponent: React.ComponentType<any>;
  // We pass common chart props here
  commonProps: any;
}

export function DetailModal<T>({
  isOpen,
  onClose,
  title,
  data,
  ChartComponent,
  commonProps
}: DetailModalProps<T>) {

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 w-full flex flex-col">
          {/* Explicit height wrapper for ParentSize */}
          <div className="w-full h-[500px]">
            <ChartComponent
              {...commonProps}
              data={data}

              // High Fidelity Overrides
              showXAxis={true}
              showYAxis={true}
              showGridRows={true}
              showGridColumns={false}
              showTooltip={true}
              margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
            />
          </div>
        </div>

        {/* Footer / Meta */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 text-sm text-muted-foreground">
          <span className="font-medium">{data.length}</span> data points
        </div>
      </div>
    </div>
  );
}
