import { useState, useEffect, createContext, useContext } from 'react';

// ─── Context ────────────────────────────────────────────────────
const ThemeCtx = createContext({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('wca-theme') === 'dark' ||
      (!localStorage.getItem('wca-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('wca-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}

// ─── Toggle button ───────────────────────────────────────────────
export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}>
      {dark ? '☀' : '🌙'}
      <span>{dark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
