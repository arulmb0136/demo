import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeKey, ThemeOption } from '../types';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'dark',
    name: 'Dark Modern',
    previewBg: '#0b0f19',
    previewAccent: '#0284c7',
    description: 'Sleek charcoal with electric cyan accents'
  },
  {
    key: 'light',
    name: 'Clean Light',
    previewBg: '#ffffff',
    previewAccent: '#2563eb',
    description: 'Crisp arctic white with royal blue'
  },
  // {
  //   key: 'deep-blue',
  //   name: 'Deep Blue',
  //   previewBg: '#060d1a',
  //   previewAccent: '#0ea5e9',
  //   description: 'Midnight navy with sapphire ambiance'
  // },
  // {
  //   key: 'pastel-pink',
  //   name: 'Pastel Pink',
  //   previewBg: '#fff1f2',
  //   previewAccent: '#f43f5e',
  //   description: 'Soft blush petal with warm coral tones'
  // },
  // {
  //   key: 'charcoal-grey',
  //   name: 'Charcoal Grey',
  //   previewBg: '#121212',
  //   previewAccent: '#737373',
  //   description: 'Minimalist matte carbon & graphite'
  // },
  // {
  //   key: 'bright-yellow',
  //   name: 'Bright Yellow',
  //   previewBg: '#171510',
  //   previewAccent: '#f59e0b',
  //   description: 'High-contrast bold amber & cyber gold'
  // },
  {
    key: 'linkedin',
    name: 'Modern',
    previewBg: '#f3f2ef',
    previewAccent: '#0a66c2',
    description: 'Executive corporate navy & clean canvas'
  }
  // {
  //   key: 'windows',
  //   name: 'Windows Theme',
  //   previewBg: '#f3f3f3',
  //   previewAccent: '#0078d4',
  //   description: 'Fluent mica slate with Windows Aero blue'
  // }
];

interface ThemeContextType {
  currentTheme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  availableThemes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem('ironclad_theme') as ThemeKey;
    return saved || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('ironclad_theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (theme: ThemeKey) => {
    setCurrentThemeState(theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: THEME_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
