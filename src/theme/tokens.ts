export const colors = {
  bg: '#F6F8FB',
  bgMuted: '#F2F4F6',
  surface: '#FFFFFF',
  border: '#E5E8EB',
  textPrimary: '#191F28',
  textSecondary: '#6B7684',
  textTertiary: '#8B95A1',
  textDisabled: '#B0B8C1',
  primary: '#3182F6',
  primaryPressed: '#1B64DA',
  primaryMuted: '#EBF2FE',
  success: '#0AA35A',
  successMuted: '#E7F7EF',
  danger: '#F04452',
  dangerMuted: '#FDEDEE',
  warning: '#FF9F1C',
  warningMuted: '#FFF3E0',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 15,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 42, fontWeight: '800' as const },
  hero: { fontSize: 26, lineHeight: 35, fontWeight: '800' as const },
  title1: { fontSize: 27, lineHeight: 36, fontWeight: '800' as const },
  title2: { fontSize: 18, lineHeight: 26, fontWeight: '700' as const },
  body1: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  body1Bold: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  body2: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  body2Bold: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  captionBold: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
} as const;

export const shadow = {
  card: {
    shadowColor: '#191F28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const minTouchSize = 44;
export const screenPadding = 20;
export const primaryButtonHeight = 54;
