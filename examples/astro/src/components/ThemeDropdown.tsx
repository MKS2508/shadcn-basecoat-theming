import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeDropdown() {
  const { currentTheme, availableThemes, setTheme, isInitialized } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isInitialized) {
    return (
      <button className="btn-icon" disabled>
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    );
  }

  const currentThemeConfig = availableThemes.find(theme => theme.name === currentTheme);

  const handleThemeSelect = async (themeName: string) => {
    await setTheme(themeName);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Select theme"
      >
        <span className="text-sm">{currentThemeConfig?.label || currentTheme}</span>
        <svg 
          className="ml-2 h-4 w-4 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-40 rounded-md border bg-popover p-1 shadow-lg animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          {availableThemes.map((theme) => (
            <button
              key={theme.name}
              className={`
                block w-full text-left px-3 py-2 text-sm rounded-sm transition-colors cursor-pointer
                ${theme.name === currentTheme 
                  ? 'bg-accent text-accent-foreground font-medium' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
              onClick={() => handleThemeSelect(theme.name)}
              role="menuitem"
            >
              {theme.label}
              {theme.name === currentTheme && (
                <svg className="inline-block w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
          
          {/* Divider */}
          <div className="h-px bg-border my-1"></div>
          
          {/* Additional Options */}
          <button
            className="block w-full text-left px-3 py-2 text-sm rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            onClick={() => {
              setIsOpen(false);
              console.log('🔧 Browse more themes...');
            }}
          >
            Browse More Themes...
          </button>
          
          <button
            className="block w-full text-left px-3 py-2 text-sm rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            onClick={() => {
              setIsOpen(false);
              console.log('⚙️ Manage themes...');
            }}
          >
            Manage Themes
          </button>
        </div>
      )}
    </div>
  );
}