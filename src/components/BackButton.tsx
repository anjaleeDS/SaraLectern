import { useState } from 'react';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BackButtonProps {
  warningTitle?: string;
  warningBody?: string;
  onBack?: () => void;
}

export default function BackButton({ warningTitle, warningBody, onBack }: BackButtonProps) {
  const { goBack, canGoBack } = useApp();
  const [showWarning, setShowWarning] = useState(false);

  if (!canGoBack) return null;

  const handleClick = () => {
    if (warningTitle || warningBody) {
      setShowWarning(true);
    } else {
      onBack ? onBack() : goBack();
    }
  };

  const handleConfirm = () => {
    setShowWarning(false);
    onBack ? onBack() : goBack();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1 text-stone-500 hover:text-stone-900 text-sm transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-stone-900 text-base mb-1">
                  {warningTitle ?? 'Are you sure you want to go back?'}
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {warningBody ?? 'Going back will discard your current progress and you will need to redo this step.'}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
              <p className="text-xs text-amber-800 font-medium">
                This action cannot be undone. Any AI-generated content on this screen will be lost.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              >
                Stay on this page
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Yes, go back anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
