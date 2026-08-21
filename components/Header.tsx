import React from 'react';
import { USER_ROLES, COLOR_THEMES } from '../constants';
import { UserRole } from '../types';
import { Tooltip } from './ui/Tooltip';
import { Select } from './ui/Select';

interface HeaderProps {
    currentRole: UserRole;
    onRoleChange: (role: UserRole) => void;
    themeMode: 'light' | 'dark';
    onThemeToggle: () => void;
    theme: string;
    onThemeChange: (theme: string) => void;
}

const ThemeToggle: React.FC<{ themeMode: 'light' | 'dark', onToggle: () => void }> = ({ themeMode, onToggle }) => (
    <Tooltip text={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}>
        <button
            onClick={onToggle}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-[--color-background-card]/50 hover:bg-[--color-background-card]/80 border border-[--color-border] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--color-background-body] focus:ring-[--color-primary-focus-ring]"
            aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
        >
            {themeMode === 'light' ? (
                // Moon Icon (dark_mode)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[--color-text-base]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4-4.4A5.389 5.389 0 0 1 13.36 3.1 9 9 0 0 0 12 3Z"/>
                </svg>
            ) : (
                // Sun Icon (light_mode)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[--color-secondary-accent]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7a5 5 0 1 0 5 5a5 5 0 0 0-5-5Zm0-3a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1Zm0 16a1 1 0 0 1-1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1-1 1Zm7.07-13.93a1 1 0 0 1 0-1.41l.71-.71a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0ZM4.93 19.07a1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41 0Zm13.45.62a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41ZM5.64 5.64a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41ZM20 12a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1ZM5 12a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1Z"/>
                </svg>
            )}
        </button>
    </Tooltip>
);

export const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange, themeMode, onThemeToggle, theme, onThemeChange }) => (
  <header className="bg-[--color-background-card]/80 backdrop-blur-sm sticky top-0 z-10 border-b border-[--color-border]">
    <div className="container mx-auto px-4 py-4 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[--color-primary] to-[--color-secondary-accent]">
                Instructional Design Genie
            </h1>
            <p className="mt-2 text-[--color-text-muted]">
                Transform raw content into powerful learning experiences.
            </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
             <Tooltip text="Select an application-wide color theme.">
                <div className="flex items-center gap-2">
                    <label htmlFor="theme-switcher" className="text-sm font-medium text-[--color-text-muted]">Theme:</label>
                    <Select
                        id="theme-switcher"
                        value={theme}
                        onChange={(e) => onThemeChange(e.target.value)}
                        options={COLOR_THEMES}
                        className="bg-[--color-background-card]/50 border-transparent rounded-md py-1 px-2 text-sm focus:ring-1 focus:ring-[--color-primary] focus:border-[--color-primary]"
                    />
                </div>
            </Tooltip>
            <Tooltip text="Switch user role to simulate different permissions (Admin, Editor, Viewer).">
                <div className="flex items-center gap-2">
                    <label htmlFor="role-switcher" className="text-sm font-medium text-[--color-text-muted]">Role:</label>
                    <Select
                        id="role-switcher"
                        value={currentRole}
                        onChange={(e) => onRoleChange(e.target.value as UserRole)}
                        options={USER_ROLES}
                        className="bg-[--color-background-card]/50 border-transparent rounded-md py-1 px-2 text-sm focus:ring-1 focus:ring-[--color-primary] focus:border-[--color-primary]"
                    />
                </div>
            </Tooltip>
            <ThemeToggle themeMode={themeMode} onToggle={onThemeToggle} />
        </div>
      </div>
    </div>
  </header>
);