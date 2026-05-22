import { v4 as uuidv4 } from 'uuid'
import { getAllEvents, getUpcomingEvents } from '../database/events'
import { getFavoritesByUser } from '../database/favorites'
import { getRegistrationsByUser } from '../database/registrations'
import { getEventById } from '../database/events'
import { saveLLMResult, getCachedResult } from '../database/llmResults'
import { getSearchNLPrompt } from '../prompts/searchNL'
import { getRecommendationPrompt } from '../prompts/recommendation'
import { getPlanningPrompt } from '../prompts/planning'
import { getQAPrompt } from '../prompts/qa'

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
  const cached = getCachedResult(userId, type, inputText)
  if (cached) {
    return { outputText: cached.outputText, fromCache: true }
  }

  let prompt: { system: string; user: string }
  const allEvents = getAllEvents()

  switch (type) {
    case 'search': {
      const upcomingEvents = getUpcomingEvents()
      prompt = getSearchNLPrompt(inputText, upcomingEvents)
      break
    }
    case 'recommendation': {
      const upcomingEvents = getUpcomingEvents()
      const favorites = getFavoritesByUser(userId)
      const registrations = getRegistrationsByUser(userId)
      const favEvents = favorites.map((f) => getEventById(f.eventId)).filter(Boolean)
      const regEvents = registrations.map((r) => getEventById(r.eventId)).filter(Boolean)
      prompt = getRecommendationPrompt(inputText, upcomingEvents, favEvents, regEvents)
      break
    }
    case 'planning': {
      const weekEvents = allEvents.filter((e) => {
        const d = new Date(e.startDateTime)
        const now = new Date()
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        return d >= now && d <= weekEnd
      })
      prompt = getPlanningPrompt(inputText, weekEvents)
      break
    }
    case 'qa': {
      prompt = getQAPrompt(inputText, allEvents)
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
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
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
    id: uuidv4(),
    userId,
    type,
    inputText,
    outputText,
    createdAt: new Date().toISOString(),
  })

  return { outputText, fromCache: false }
}
