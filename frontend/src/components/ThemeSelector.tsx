import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';
import { ThemeKey } from '../types';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeThemeObj = availableThemes.find((t) => t.key === currentTheme);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.85rem',
          fontSize: '0.825rem',
          borderRadius: 'var(--radius-sm)',
        }}
        title="Switch Dynamic UI Theme (8 Options Available)"
      >
        <Palette size={16} />
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: activeThemeObj?.previewAccent || 'var(--accent-primary)',
            display: 'inline-block',
          }}
        />
        <span style={{ fontWeight: 600 }}>{activeThemeObj?.name || 'Theme'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '280px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '0.5rem',
            zIndex: 1100,
          }}
        >
          <div
            style={{
              padding: '0.4rem 0.6rem 0.6rem',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '0.4rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>Select System Theme</span>
            <span>8 Themes</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '360px', overflowY: 'auto' }}>
            {availableThemes.map((theme) => {
              const isSelected = theme.key === currentTheme;
              return (
                <button
                  key={theme.key}
                  onClick={() => {
                    setTheme(theme.key as ThemeKey);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--accent-soft)' : 'transparent',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: theme.previewBg,
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: theme.previewAccent,
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {theme.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {theme.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="var(--accent-primary)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
