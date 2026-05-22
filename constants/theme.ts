import { Dimensions } from 'react-native'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export const Colors = {
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

  categoryWorkshop: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  categoryTalk: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  categoryClub: { bg: '#ECFEFF', text: '#0E7490', border: '#A5F3FC' },
  categoryExam: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  categoryOther: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },

  success: '#10B981',
  successBg: '#D1FAE5',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  favorite: '#F43F5E',

  overlay: 'rgba(15, 78, 74, 0.6)',
  shimmer: '#E2E8F0',
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xl4: 40,
}

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
}

export const FontSize = {
  caption: 12,
  body: 15,
  label: 13,
  subhead: 17,
  title: 20,
  heading: 28,
  display: 34,
}

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const Shadow = {
  level1: {
    shadowColor: '#134E4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  level2: {
    shadowColor: '#134E4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  level3: {
    shadowColor: '#134E4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
}

export function getCategoryStyle(category: string) {
  switch (category) {
    case 'Workshop': return Colors.categoryWorkshop
    case 'Talk': return Colors.categoryTalk
    case 'Club': return Colors.categoryClub
    case 'Exam': return Colors.categoryExam
    default: return Colors.categoryOther
  }
}

export function formatDate(dateStr: string): { day: string; month: string; time: string } {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return { day: '--', month: '---', time: '--:--' }
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const month = months[d.getMonth()]
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return { day, month, time: `${hours}:${minutes}` }
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Date non disponible'
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_HEIGHT < 700,
}
