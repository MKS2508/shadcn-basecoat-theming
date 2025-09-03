import { useTheme } from './ThemeProvider';

export function ModeToggle() {
  const { currentMode, currentTheme, setTheme, isInitialized } = useTheme();

  if (!isInitialized) {
    return (
      <button className="btn-icon" disabled>
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    );
  }

  const handleModeToggle = async () => {
    let newMode: 'light' | 'dark' | 'auto';
    
    switch (currentMode) {
      case 'light':
        newMode = 'dark';
        break;
      case 'dark':
        newMode = 'auto';
        break;
      case 'auto':
      default:
        newMode = 'light';
        break;
    }

    await setTheme(currentTheme, newMode);
    console.log(`🌙 Mode switched to: ${newMode}`);
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case 'light':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'dark':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z" />
          </svg>
        );
      case 'auto':
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
    }
  };

  const getModeLabel = () => {
    switch (currentMode) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'auto':
        return 'Auto mode (follows system)';
      default:
        return 'Unknown mode';
    }
  };

  return (
    <button
      className="btn-icon"
      onClick={handleModeToggle}
      aria-label={`Current mode: ${currentMode}. Click to cycle through modes.`}
      title={getModeLabel()}
    >
      {getModeIcon()}
    </button>
  );
}