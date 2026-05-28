import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Stepper from './components/Stepper';
import ProfileSidebar from './components/ProfileSidebar';
import DebugPanel from './components/DebugPanel';
import Intake from './screens/Intake';
import ProfileConfirm from './screens/ProfileConfirm';
import PreferencesScreen from './screens/PreferencesScreen';
import TopicsVenues from './screens/TopicsVenues';
import PitchDrafts from './screens/PitchDrafts';
import OutreachDashboard from './screens/OutreachDashboard';
import ApiKeyGate from './screens/ApiKeyGate';
import { hasApiKey, setApiKey } from './lib/claude';
import { hasGeminiApiKey, setGeminiApiKey } from './lib/gemini';

function Main() {
  const { screen } = useApp();

  const renderScreen = () => {
    switch (screen) {
      case 'intake': return <Intake />;
      case 'confirm': return <ProfileConfirm />;
      case 'preferences': return <PreferencesScreen />;
      case 'topics':
      case 'venues': return <TopicsVenues />;
      case 'pitches': return <PitchDrafts />;
      case 'dashboard': return <OutreachDashboard />;
      default: return <Intake />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <Stepper />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
        <main className="flex-1 overflow-hidden flex flex-col">
          {renderScreen()}
        </main>
        <ProfileSidebar />
      </div>
      <DebugPanel />
    </div>
  );
}

export default function App() {
  const [keyed, setKeyed] = useState(hasApiKey() && hasGeminiApiKey());

  const handleKeys = (keys: { anthropic?: string; gemini?: string }) => {
    if (keys.anthropic) setApiKey(keys.anthropic);
    if (keys.gemini) setGeminiApiKey(keys.gemini);
    setKeyed(true);
  };

  if (!keyed) {
    return (
      <ApiKeyGate
        missingAnthropic={!hasApiKey()}
        missingGemini={!hasGeminiApiKey()}
        onKeys={handleKeys}
      />
    );
  }

  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
