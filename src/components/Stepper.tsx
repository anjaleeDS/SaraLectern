import { Screen } from '../types';
import { useApp } from '../context/AppContext';

const STEPS: { id: Screen; label: string }[] = [
  { id: 'intake', label: 'Intake' },
  { id: 'confirm', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'topics', label: 'Topics' },
  { id: 'venues', label: 'Venues' },
  { id: 'pitches', label: 'Pitches' },
  { id: 'dashboard', label: 'Track' },
];

const ORDER: Screen[] = STEPS.map(s => s.id);

export default function Stepper() {
  const { screen } = useApp();
  const currentIdx = ORDER.indexOf(screen);

  return (
    <div className="flex items-center gap-0 px-4 md:px-8 py-4 border-b border-stone-200 bg-white">
      <div className="flex items-center gap-1 mr-4 md:mr-6 shrink-0">
        <span className="text-lg font-semibold tracking-tight text-stone-900">Lectern</span>
      </div>
      <div className="flex items-center gap-0 flex-1 overflow-x-auto">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.id} className="flex items-center shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors shrink-0 ${
                  done
                    ? 'bg-stone-800 text-white'
                    : active
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-500'
                }`}>
                  {done ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs font-medium transition-colors hidden sm:block ${
                  active ? 'text-stone-900' : done ? 'text-stone-600' : 'text-stone-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px mx-0.5 ${i < currentIdx ? 'bg-stone-400' : 'bg-stone-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
