import { Button } from '@/registry/components/ui/button';
import { DropdownMenuItem } from '@/registry/components/ui/dropdown-menu';
import { Kbd } from '@/registry/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/components/ui/tooltip';
import { IconMoon, IconSun } from '@tabler/icons-react';
import React, { useCallback, useEffect, useEffectEvent } from 'react';

const THEME_COOKIE_KEY = 'theme';
const IS_DARK_COOKIE_KEY = 'is-theme-dark';
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const setCookie = (name: string, value: string, maxAge: number) => {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge}`;
};

// -------------------- Types & Contexts -------------------- //

export type SetThemeProps =
  | 'light'
  | 'dark'
  | 'system'
  | ((prevTheme: string) => 'light' | 'dark' | 'system');

const ThemeContext = React.createContext<
  | {
      theme: string;
      setTheme: (theme: SetThemeProps) => void;
    }
  | undefined
>(undefined);

const SetThemeContext = React.createContext<
  ((theme: SetThemeProps) => void) | undefined
>(undefined);

// -------------------- ThemeProvider -------------------- //

export const ThemeProvider = ({
  currentTheme = 'system',
  children,
}: {
  currentTheme?: 'light' | 'dark' | 'system';
  children: React.ReactNode;
}) => {
  const [themeState, setThemeState] = React.useState(currentTheme);

  const resolveTheme = useCallback((input: 'light' | 'dark' | 'system') => {
    if (input === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return input;
  }, []);

  const applyTheme = useCallback(
    (next: SetThemeProps) => {
      setThemeState((prev) => {
        const newTheme = typeof next === 'function' ? next(prev) : next;
        const resolved = resolveTheme(newTheme as 'light' | 'dark' | 'system');

        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
        document.documentElement.style.colorScheme =
          resolved === 'dark' ? 'dark' : 'light';

        setCookie(THEME_COOKIE_KEY, newTheme as string, DEFAULT_MAX_AGE);
        setCookie(
          IS_DARK_COOKIE_KEY,
          resolved === 'dark' ? 'true' : 'false',
          DEFAULT_MAX_AGE,
        );

        return newTheme;
      });
    },
    [resolveTheme],
  );

  const themeEventHandler = useEffectEvent(() => {
    if (themeState === 'system') applyTheme('system');
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    themeEventHandler();
    mql.addEventListener('change', themeEventHandler);
    return () => mql.removeEventListener('change', themeEventHandler);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: themeState, setTheme: applyTheme }}>
      <SetThemeContext.Provider value={applyTheme}>
        {children}
      </SetThemeContext.Provider>
    </ThemeContext.Provider>
  );
};

// -------------------- Hooks -------------------- //

export const useTheme = () => {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

export const useSetTheme = () => {
  const ctx = React.useContext(SetThemeContext);
  if (!ctx) throw new Error('useSetTheme must be used within a ThemeProvider');
  return ctx;
};

// -------------------- Keyboard Shortcut -------------------- //

export const KeyboardThemeToggler = () => {
  const setTheme = useSetTheme();

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }
  });

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};

// -------------------- UI Components -------------------- //

export const ToggleThemeMenuItem = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuItem
      onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
    >
      {theme === 'light' ? <IconMoon /> : <IconSun />}
      <span className="grow">Theme</span>
      <Kbd>Ctrl / Cmd</Kbd> + <Kbd>D</Kbd>
    </DropdownMenuItem>
  );
};

export const ToggleThemeButton = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Current theme: ${theme}. Click to change theme`}
            onClick={() =>
              setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
            }
          >
            {theme === 'light' ? <IconMoon /> : <IconSun />}
          </Button>
        }
      />

      <TooltipContent className="**:font-sans **:text-xs **:font-medium">
        <kbd>Ctrl / Cmd</kbd> + <kbd>D</kbd>
      </TooltipContent>
    </Tooltip>
  );
};

// -------------------- Cookie Parsing -------------------- //

export type ThemeType = 'light' | 'dark' | 'system';

export const parseThemeCookies = (req: Request) => {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = cookieHeader.split('; ');

  const themeCookie = cookies.find((c) => c.startsWith(THEME_COOKIE_KEY));

  const isDarkCookie = cookies.find((c) =>
    c.startsWith(`${IS_DARK_COOKIE_KEY}=`),
  );

  let theme: ThemeType | undefined;
  let colorScheme: string | undefined;

  if (themeCookie) {
    const themeCookieValue = themeCookie.split('=')[1];

    const value = themeCookieValue
      ? decodeURIComponent(themeCookieValue)
      : undefined;

    if (value === 'light' || value === 'dark') {
      theme = value;
    } else {
      theme = 'system';
    }
  }

  if (isDarkCookie && theme !== 'system') {
    const darkCookieValue = isDarkCookie?.split('=')[1];

    colorScheme = darkCookieValue
      ? decodeURIComponent(darkCookieValue) === 'true'
        ? 'dark'
        : 'light'
      : undefined;
  }

  return { theme, colorScheme };
};
