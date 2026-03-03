import { Button } from '@/registry/components/ui/button';
import { DropdownMenuItem } from '@/registry/components/ui/dropdown-menu';
import { Kbd } from '@/registry/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/components/ui/tooltip';
import { IconBrightness, IconMoon, IconSun } from '@tabler/icons-react';
import React, { useCallback, useEffect, useEffectEvent, useRef } from 'react';

const DEFAULT_KEY = 'theme';
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const setCookie = (name: string, targetTheme: string, maxAge: number) => {
  document.cookie = `${name}=${encodeURIComponent(targetTheme)};path=/;max-age=${maxAge}`;
};

type Props = {
  /** List of available themes.
   * @default ["light", "dark"]
   */
  themes?: string[];
  /** Cookie key to store the theme preference.
   * @default "theme"
   */
  cookieKey?: string;
  /** Maximum age of the theme cookie in seconds.
   * @default 60 * 60 * 24 * 365 (1 year)
   */
  cookieMaxAge?: number;
  /** Default system theme identifier.
   * @default "system"
   */
  defaultSystemTheme?: string;
  /** Default light theme identifier.
   * @default "light"
   */
  defaultLightTheme?: string;
  /** Default dark theme identifier.
   * @default "dark"
   */
  defaultDarkTheme?: string;
  /** List of themes considered as dark themes.
   * @default ["dark"]
   */
  darkThemes?: string[];
};

type SetThemeProps = string | ((prevTheme: string) => string);

export const createThemeManager = ({
  themes = ['light', 'dark'],
  cookieKey = DEFAULT_KEY,
  cookieMaxAge = DEFAULT_MAX_AGE,
  defaultSystemTheme = 'system',
  defaultLightTheme = 'light',
  defaultDarkTheme = 'dark',
  darkThemes = ['dark'],
}: Props = {}) => {
  const ThemeContext = React.createContext<
    | undefined
    | {
        theme: string;
        setTheme: (theme: SetThemeProps) => void;
      }
  >(undefined);

  const SetThemeContext = React.createContext<
    undefined | ((theme: SetThemeProps) => void)
  >(undefined);

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  const ThemeProvider = ({
    theme: themeProp = 'system',
    children,
  }: {
    children: React.ReactNode;
    theme?: string;
  }) => {
    const setThemeRef = useRef<((theme: SetThemeProps) => void) | null>(null);

    const [themeState, setThemeState] = React.useState(themeProp);

    const applyTheme = React.useCallback(
      (theme: SetThemeProps) => {
        const newTheme =
          typeof theme === 'function' ? theme(themeState) : theme;

        if (!themes.includes(newTheme) && newTheme !== 'system') {
          console.warn(
            `Theme "${newTheme}" is not defined in provider themes.`,
          );
          return;
        }

        let targetTheme: string = newTheme;

        if (newTheme === defaultSystemTheme) {
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            targetTheme = defaultDarkTheme;
          } else {
            targetTheme = defaultLightTheme;
          }
        }

        document.documentElement.classList.remove(...themes);
        document.documentElement.classList.add(targetTheme);

        if (darkThemes.includes(targetTheme)) {
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.style.colorScheme = 'light';
        }

        setCookie(cookieKey, newTheme, cookieMaxAge);
        setThemeState(newTheme);
      },
      [themeState],
    );

    useEffect(() => {
      setThemeRef.current = applyTheme;
    });

    const themeEventHandler = useEffectEvent(() => {
      if (themeState === defaultSystemTheme) {
        applyTheme(defaultSystemTheme);
      }
    });

    useEffect(() => {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');

      themeEventHandler();

      mql.addEventListener('change', themeEventHandler);

      return () => {
        mql.removeEventListener('change', themeEventHandler);
      };
    }, []);

    const setTheme = useCallback((theme: SetThemeProps) => {
      if (setThemeRef.current) {
        setThemeRef.current(theme);
      }
    }, []);

    return (
      <ThemeContext value={{ theme: themeState, setTheme }}>
        <SetThemeContext value={setTheme}>{children}</SetThemeContext>
      </ThemeContext>
    );
  };

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  const useTheme = () => {
    const ctx = React.use(ThemeContext);

    if (!ctx) {
      throw new Error('useTheme must be used within a ThemeProvider');
    }

    return ctx;
  };

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  const useSetTheme = () => {
    const ctx = React.use(SetThemeContext);

    if (!ctx) {
      throw new Error('useSetTheme must be used within a ThemeProvider');
    }

    return ctx;
  };

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  /**
   * Gets the theme from cookies in a server-side request.
   */
  const getThemeFromCookies = (req: Request) => {
    const cookieHeader = req.headers.get('cookie') || '';

    const cookie = cookieHeader
      .split('; ')
      .find((c) => c.startsWith(DEFAULT_KEY));

    if (cookie) {
      const cookieValue = cookie.split('=')[1];

      const theme = cookieValue ? decodeURIComponent(cookieValue) : undefined;

      return theme;
    }
  };

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  const getResolvedTheme = (props?: { theme?: string }) => {
    const { theme } = props || {};

    return {
      theme,
      colorScheme: darkThemes.includes(theme || '') ? 'dark' : 'light',
    };
  };

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  const KeyboardThemeToggler = () => {
    const setTheme = useSetTheme();

    const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
      if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
      }
    });

    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    return null;
  };

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  function ToggleThemeMenuItem() {
    const { setTheme, theme } = useTheme();

    return (
      <>
        <DropdownMenuItem
          onClick={() =>
            setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
          }
        >
          {(() => {
            if (theme === 'light') {
              return <IconMoon />;
            } else if (theme === 'dark') {
              return <IconSun />;
            } else {
              return <IconBrightness />;
            }
          })()}
          <span className="grow">Theme</span>
          <Kbd>Ctrl / Cmd</Kbd> + <Kbd>D</Kbd>
        </DropdownMenuItem>
      </>
    );
  }

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-* //

  function ToggleThemeButton() {
    const { setTheme, theme } = useTheme();

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Current theme: ${theme}. Click to change theme`}
              onClick={() => {
                setTheme(theme === 'light' ? 'dark' : 'light');
              }}
            >
              {(() => {
                if (theme === 'light') {
                  return <IconMoon />;
                } else if (theme === 'dark') {
                  return <IconSun />;
                } else {
                  return <IconBrightness />;
                }
              })()}
            </Button>
          }
        />

        <TooltipContent>
          <Kbd>Ctrl / Cmd</Kbd> + <Kbd>D</Kbd>
        </TooltipContent>
      </Tooltip>
    );
  }

  return {
    ThemeProvider,
    useTheme,
    getThemeFromCookies,
    getResolvedTheme,
    useSetTheme,
    KeyboardThemeToggler,
    ToggleThemeMenuItem,
    ToggleThemeButton,
  };
};
