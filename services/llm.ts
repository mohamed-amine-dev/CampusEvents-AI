import { getAllEvents, getUpcomingEvents, getEventById } from '../database/events'
import { getFavoritesByUser } from '../database/favorites'
import { getRegistrationsByUser } from '../database/registrations'
import { saveLLMResult, getCachedLLMResult } from '../database/llmResults'
import { generateId } from '../utils/uuid'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

function cleanJson(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) return jsonMatch[1].trim()
  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) return braceMatch[0]
  return text.trim()
}

export async function callLLM(
  userId: string,
  type: 'search' | 'recommendation' | 'planning' | 'qa',
  inputText: string,
  apiKey: string
): Promise<{ outputText: string; fromCache: boolean }> {
  const cached = getCachedLLMResult(userId, type, inputText)
  if (cached) {
    return { outputText: cached.outputText, fromCache: true }
  }

  let system = ''
  let user = ''
  const allEvents = getAllEvents()

  switch (type) {
    case 'search': {
      const upcomingEvents = getUpcomingEvents()
      system = `Tu es un assistant de recherche d'événements. Tu reçois une requête en langage naturel et tu dois renvoyer un tableau JSON d'IDs d'événements correspondants. Réponds UNIQUEMENT avec un tableau JSON valide. Exemple: ["evt-001", "evt-003"]`
      user = `Requête: "${inputText}"\nÉvénements disponibles: ${JSON.stringify(upcomingEvents.map(e => ({ id: e.id, title: e.title, description: e.description, category: e.category, tags: e.tags })))}`
      break
    }
    case 'recommendation': {
      const upcomingEvents = getUpcomingEvents()
      const favorites = getFavoritesByUser(userId)
      const registrations = getRegistrationsByUser(userId)
      const favEvents = favorites.map(f => getEventById(f.eventId)).filter(Boolean)
      const regEvents = registrations.map(r => getEventById(r.eventId)).filter(Boolean)
      system = `Tu es un assistant de recommandation d'événements. Suggère des événements pertinents en fonction des préférences de l'utilisateur. Réponds en français.`
      user = `Utilisateur dit: "${inputText}"\nSes favoris: ${JSON.stringify(favEvents.map(e => e?.title))}\nSes inscriptions: ${JSON.stringify(regEvents.map(e => e?.title))}\nÉvénements disponibles: ${JSON.stringify(upcomingEvents.map(e => ({ id: e.id, title: e.title, description: e.description, category: e.category })))}`
      break
    }
    case 'planning': {
      const weekEvents = allEvents.filter(e => {
        const d = new Date(e.startDateTime)
        const now = new Date()
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        return d >= now && d <= weekEnd
      })
      system = `Tu es un assistant de planning. Aide l'utilisateur à organiser sa semaine avec les événements disponibles. Réponds en français.`
      user = `Demande: "${inputText}"\nÉvénements de la semaine: ${JSON.stringify(weekEvents.map(e => ({ id: e.id, title: e.title, startDateTime: e.startDateTime, locationName: e.locationName })))}`
      break
    }
    case 'qa': {
      system = `Tu es un assistant spécialisé dans les événements du campus. Réponds aux questions en français de manière précise et utile. Utilise les données des événements fournies.`
      user = `Question: "${inputText}"\nTous les événements: ${JSON.stringify(allEvents.map(e => ({ id: e.id, title: e.title, description: e.description, category: e.category, startDateTime: e.startDateTime, locationName: e.locationName, organizerName: e.organizerName })))}`
      break
    }
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Erreur API: ${response.status} - ${errText}`)
  }

  const data = await response.json()
  const outputText = cleanJson(data.choices[0].message.content)

  saveLLMResult({
    id: generateId(),
    userId,
    type,
    inputText,
    outputText,
    createdAt: new Date().toISOString(),
  })

  return { outputText, fromCache: false }
}
