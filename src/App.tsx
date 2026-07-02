import { useState } from 'react';
import { AppStateProvider, useAppState } from './context/AppState';
import { Landing } from './components/Landing';
import { DeviceDetection } from './components/DeviceDetection';
import { Dashboard } from './components/Dashboard';
import { Report } from './components/Report';
import { APP_NAME, APP_VERSION, BRAND } from './version';

type Screen = 'landing' | 'detect' | 'dashboard' | 'report';

function Shell() {
  const [screen, setScreen] = useState<Screen>('landing');
  const { resetSession } = useAppState();

  const reset = () => {
    resetSession();
    setScreen('landing');
  };

  return (
    <div className="app">
      <main className="app-main">
        {screen === 'landing' && <Landing onStart={() => setScreen('detect')} />}
        {screen === 'detect' && <DeviceDetection onContinue={() => setScreen('dashboard')} />}
        {screen === 'dashboard' && <Dashboard onReport={() => setScreen('report')} />}
        {screen === 'report' && (
          <Report onBack={() => setScreen('dashboard')} onReset={reset} />
        )}
      </main>
      <footer className="app-footer">
        {BRAND} · {APP_NAME} · v{APP_VERSION}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
