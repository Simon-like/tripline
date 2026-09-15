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
};

export type TriplineTheme = Record<keyof typeof lightTheme, string>;

export const motion = {
  instant: 120,
  standard: 280,
  expand: 350,
  celebrate: 800,
  stagger: 40,
  dampingRatio: 0.72,
} as const;
