export type ThemeMode = 'light' | 'dark';

export const lightColors = {
  mode: 'light' as const,
  ink: '#181818',
  inkMuted: '#666666',
  muted: '#8a8a8a',
  faint: '#b8b8b8',
  surface: '#ffffff',
  surfaceSoft: '#f7f6f2',
  surfaceWarm: '#fff8e6',
  appBg: 'rgba(245,245,245,0.92)',
  headerBg: '#ffffff',
  tabBg: '#ffffff',
  border: '#e9e4d7',
  borderSoft: '#eeeeee',
  gold: '#c9a961',
  goldDark: '#a88940',
  green: '#2e7d32',
  greenBg: '#eaf6ec',
  blue: '#1565c0',
  blueBg: '#eaf1fb',
  red: '#d32f2f',
  redBg: '#fff1f1',
  orange: '#f57c00',
  orangeBg: '#fff5e7',
  purple: '#6a1b9a',
  purpleBg: '#f4e8fb',
  black: '#1a1a1a',
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.48)',
  backgroundOverlay: 'rgba(255,255,255,0.82)',
};

export const darkColors = {
  mode: 'dark' as const,
  ink: '#f7f3ea',
  inkMuted: '#c6c0b5',
  muted: '#97928b',
  faint: '#6f6f72',
  surface: '#1d1e1f',
  surfaceSoft: '#28292b',
  surfaceWarm: '#2d2a20',
  appBg: 'rgba(9,10,12,0.96)',
  headerBg: '#101113',
  tabBg: '#151617',
  border: '#5d5235',
  borderSoft: '#333437',
  gold: '#d5b45c',
  goldDark: '#a88940',
  green: '#62c47f',
  greenBg: '#17341f',
  blue: '#7aa7ff',
  blueBg: '#17243c',
  red: '#ff6969',
  redBg: '#3a1f20',
  orange: '#ffb35a',
  orangeBg: '#3a2816',
  purple: '#c08cff',
  purpleBg: '#2c1e3c',
  black: '#050505',
  white: '#ffffff',
  overlay: 'rgba(0,0,0,0.72)',
  backgroundOverlay: 'rgba(0,0,0,0.86)',
};

export type ThemeColors = Omit<typeof lightColors, 'mode'> & { mode: ThemeMode };

export const colors: ThemeColors = lightColors;

export const radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  sheet: 24,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const shadow = {
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  lifted: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
};

export const makeTypography = (themeColors: ThemeColors = colors) => ({
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: themeColors.muted,
    letterSpacing: 1.2,
  },
});

export const typography = makeTypography(colors);

export const touch = {
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
};
