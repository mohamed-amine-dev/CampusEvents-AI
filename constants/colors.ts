import { Theme } from '../types'

const lightColors = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  primaryBg: '#F0FDFA',
  primaryBorder: '#99F6E4',
  surface: '#FFFFFF',
  background: '#F0FDFA',
  textPrimary: '#134E4A',
  textSecondary: '#5C7A72',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  border: '#CCFBF1',
  borderLight: '#E6FFF9',
  success: '#10B981',
  successBg: '#D1FAE5',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  overlay: 'rgba(15, 78, 74, 0.6)',
  shimmer: '#E2E8F0',
}

const darkColors = {
  primary: '#14B8A6',
  primaryLight: '#2DD4BF',
  primaryDark: '#0D9488',
  primaryBg: '#042F2E',
  primaryBorder: '#115E59',
  surface: '#134E4A',
  background: '#042F2E',
  textPrimary: '#F0FDFA',
  textSecondary: '#CCFBF1',
  textMuted: '#5C7A72',
  textWhite: '#042F2E',
  border: '#115E59',
  borderLight: '#134E4A',
  success: '#34D399',
  successBg: '#064E3B',
  error: '#F87171',
  errorBg: '#7F1D1D',
  warning: '#FBBF24',
  warningBg: '#78350F',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shimmer: '#115E59',
}

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
}

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
}
