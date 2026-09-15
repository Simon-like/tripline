export const lightTheme = {
  bg: '#F4F2FB',
  surface: '#FFFFFF',
  surfaceAlt: '#ECE9FA',
  primary: '#5B4FE9',
  primarySoft: '#E7E3FF',
  accent: '#FF6B4A',
  accentSoft: '#FFE9E3',
  celebrate: '#FFC93C',
  success: '#22C55E',
  text: '#17132B',
  textSecondary: '#6E6A85',
  border: '#DDD8EE',
  shadow: '#4A3C80',
  onPrimary: '#FFFFFF',
  onAccent: '#FFFFFF',
  glassFill: 'rgba(255,255,255,0.72)',
  glassFallback: 'rgba(255,255,255,0.96)',
  glassStroke: 'rgba(255,255,255,0.88)',
  glassSelection: 'rgba(231,227,255,0.88)',
  photoBackdrop: '#000000',
} as const;

export const darkTheme: Record<keyof typeof lightTheme, string> = {
  bg: '#151221',
  surface: '#211D31',
  surfaceAlt: '#302A43',
  primary: '#A99EFF',
  primarySoft: '#382F6A',
  accent: '#FF947B',
  accentSoft: '#563329',
  celebrate: '#FFD565',
  success: '#51D987',
  text: '#F9F6FF',
  textSecondary: '#B5AEC9',
  border: '#403852',
  shadow: '#07050C',
  onPrimary: '#17132B',
  onAccent: '#17132B',
  glassFill: 'rgba(33,29,49,0.82)',
  glassFallback: 'rgba(33,29,49,0.96)',
  glassStroke: 'rgba(249,246,255,0.20)',
  glassSelection: 'rgba(90,78,153,0.70)',
  photoBackdrop: '#000000',
};

export type TriplineTheme = Record<keyof typeof lightTheme, string>;

export type JourneyPalette = {
  card: string;
  backdrop: string;
  onCard: string;
  detail: string;
};

export const lightJourneyPalettes: readonly JourneyPalette[] = [
  { card: '#5B4FE9', backdrop: '#F4F2FB', onCard: '#FFFFFF', detail: '#FFC93C' },
  { card: '#168A82', backdrop: '#ECF8F6', onCard: '#FFFFFF', detail: '#9DE4D6' },
  { card: '#E96349', backdrop: '#FFF1ED', onCard: '#FFFFFF', detail: '#FFD0C5' },
  { card: '#B87508', backdrop: '#FFF7E5', onCard: '#FFFFFF', detail: '#FFE09A' },
] as const;

export const darkJourneyPalettes: readonly JourneyPalette[] = [
  { card: '#A99EFF', backdrop: '#151221', onCard: '#17132B', detail: '#FFD565' },
  { card: '#70D8CA', backdrop: '#10211F', onCard: '#10211F', detail: '#D0FFF7' },
  { card: '#FF947B', backdrop: '#241614', onCard: '#17132B', detail: '#FFD9D0' },
  { card: '#FFD565', backdrop: '#211B0D', onCard: '#17132B', detail: '#FFF0B6' },
] as const;

export const motion = {
  instant: 120,
  standard: 280,
  expand: 350,
  celebrate: 800,
  stagger: 40,
  dampingRatio: 0.72,
} as const;
