export type Category = 'Talk' | 'Workshop' | 'Club' | 'Exam' | 'Other'

export interface Event {
  id: string
  title: string
  description: string
  category: Category
  startDateTime: string
  endDateTime?: string
  locationName: string
  locationAddress?: string
  organizerName: string
  capacity?: number
  registeredCount: number
  imageUrl?: string
  tags?: string[]
  createdAt: string
}

export interface Registration {
  id: string
  eventId: string
  userId: string
  createdAt: string
  status: 'confirmed' | 'cancelled'
}

export interface Favorite {
  eventId: string
  userId: string
  createdAt: string
}

export interface LLMResult {
  id: string
  eventId?: string
  userId: string
  type: 'search' | 'recommendation' | 'planning' | 'qa'
  inputText: string
  outputText: string
  createdAt: string
}

export interface User {
  email: string
  role: 'admin' | 'student'
  name: string
}

export interface EventFormData {
  title: string
  description: string
  category: Category
  startDateTime: Date
  endDateTime?: Date
  locationName: string
  locationAddress?: string
  organizerName: string
  capacity?: string
  tags?: string[]
}

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  primaryBg: string
  primaryBorder: string
  surface: string
  background: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  textWhite: string
  border: string
  borderLight: string
  success: string
  successBg: string
  error: string
  errorBg: string
  warning: string
  warningBg: string
  overlay: string
  shimmer: string
}

export interface Theme {
  colors: ThemeColors
  dark: boolean
}
