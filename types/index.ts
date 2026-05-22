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

export interface Theme {
  colors: {
    primary: string
    primaryLight: string
    primaryDark: string
    secondary: string
    success: string
    error: string
    warning: string
    background: string
    surface: string
    surfaceElevated: string
    text: string
    textSecondary: string
    textInverse: string
    border: string
    borderLight: string
    cardShadow: string
    overlay: string
    tabBarBackground: string
    tabBarBorder: string
    statusBar: 'light' | 'dark'
    chipBackground: string
    chipText: string
    inputBackground: string
    skeleton: string
  }
  dark: boolean
}
