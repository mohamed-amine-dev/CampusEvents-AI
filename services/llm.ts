import { getAllEvents, getUpcomingEvents, getEventById } from '../database/events'
import { getFavoritesByUser } from '../database/favorites'
import { getRegistrationsByUser } from '../database/registrations'
import { saveLLMResult, getCachedLLMResult } from '../database/llmResults'
import { generateId } from '../utils/uuid'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MAX_CONTEXT_CHARS = 6000

/** Trim a JSON string so the total prompt stays under the context limit. */
function limitJson(data: any[], maxChars = MAX_CONTEXT_CHARS): string {
  let result = JSON.stringify(data)
  if (result.length <= maxChars) return result
  // Progressively drop events from the end until it fits
  let slice = [...data]
  while (result.length > maxChars && slice.length > 1) {
    slice = slice.slice(0, Math.ceil(slice.length * 0.8))
    result = JSON.stringify(slice)
  }
  return result
}

function extractJson(text: string): string {
  const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonBlock) return jsonBlock[1].trim()
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) return arrMatch[0]
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return text.trim()
}

// ─────────────────────────────────────────────
// PROMPT 1 — Natural Language Search
// Role: semantic event matching with justification
// Output: [{id, title, justification}]
// ─────────────────────────────────────────────
function buildSearchPrompt(query: string, userId: string) {
  const events = getUpcomingEvents().map(e => ({
    id: e.id,
    title: e.title,
    description: e.description.slice(0, 200),
    category: e.category,
    tags: e.tags ?? [],
    startDateTime: e.startDateTime,
  }))

  const system = `Tu es un moteur de recherche sémantique pour les événements d'un campus universitaire.
L'utilisateur formule une requête en langage naturel, parfois vague ou indirecte.
Tu dois identifier les événements pertinents MÊME si les mots-clés exacts ne correspondent pas.
Raisonne sur le sens, les thèmes, et les centres d'intérêt implicites.

RÈGLES STRICTES:
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour.
- Format exact: [{"id":"...","title":"...","justification":"1-2 phrases en français expliquant pourquoi cet événement correspond"}]
- Si aucun événement ne correspond, retourne: []
- Inclus au maximum 5 résultats, les plus pertinents en premier.
- Ne jamais inclure des événements non pertinents pour gonfler les résultats.`

  const user = `Requête utilisateur: "${query}"

Catalogue des événements disponibles (JSON):
${limitJson(events, 5000)}`

  return { system, user }
}

// ─────────────────────────────────────────────
// PROMPT 2 — Personalized Recommendation
// Role: suggest 3 upcoming events based on history
// Output: [{id, title, reason}]
// ─────────────────────────────────────────────
function buildRecommendationPrompt(query: string, userId: string) {
  const favorites = getFavoritesByUser(userId)
  const registrations = getRegistrationsByUser(userId)

  const knownEventIds = new Set([
    ...favorites.map(f => f.eventId),
    ...registrations.map(r => r.eventId),
  ])

  const favTitles = favorites.map(f => getEventById(f.eventId)?.title).filter(Boolean)
  const regTitles = registrations.map(r => getEventById(r.eventId)?.title).filter(Boolean)

  // Only suggest events the user hasn't seen yet
  const candidates = getUpcomingEvents()
    .filter(e => !knownEventIds.has(e.id))
    .map(e => ({
      id: e.id,
      title: e.title,
      description: e.description.slice(0, 150),
      category: e.category,
      tags: e.tags ?? [],
    }))

  const system = `Tu es un moteur de recommandation d'événements campus.
Tu reçois l'historique de l'utilisateur (favoris + inscriptions passées) et tu dois suggérer exactement 3 nouveaux événements à venir qu'il n'a PAS encore consulté.
Raisonne sur les patterns : catégories préférées, thèmes récurrents, tags en commun.

RÈGLES STRICTES:
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour.
- Format exact: [{"id":"...","title":"...","reason":"1-2 phrases en français expliquant pourquoi cette recommandation est personnalisée"}]
- Suggère EXACTEMENT 3 événements, ni plus ni moins (ou moins si moins de 3 candidats).
- Les événements suggérés ne doivent PAS être dans les favoris ou inscriptions de l'utilisateur.`

  const user = `Favoris de l'utilisateur: ${JSON.stringify(favTitles)}
Inscriptions de l'utilisateur: ${JSON.stringify(regTitles)}
Message optionnel de l'utilisateur: "${query}"

Événements disponibles (non encore vus par l'utilisateur):
${limitJson(candidates, 4000)}`

  return { system, user }
}

// ─────────────────────────────────────────────
// PROMPT 3 — Weekly Planning
// Role: build conflict-free schedule from constraints
// Output: [{day, time, eventId, title, location, note}]
// ─────────────────────────────────────────────
function buildPlanningPrompt(constraints: string, userId: string) {
  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const weekEvents = getAllEvents()
    .filter(e => {
      const d = new Date(e.startDateTime)
      return d >= now && d <= weekEnd
    })
    .map(e => ({
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime,
      locationName: e.locationName,
      capacity: e.capacity,
      registeredCount: e.registeredCount,
    }))

  const system = `Tu es un assistant de planification pour les étudiants d'un campus.
L'étudiant te donne ses contraintes horaires en langage naturel.
Tu dois produire un planning de participation suggéré sur la semaine, SANS conflit.

RÈGLES STRICTES:
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour.
- Format exact: [{"day":"Lundi","time":"14h00","eventId":"...","title":"...","location":"...","note":"courte note en français"}]
- Ne propose QUE des événements qui ne chevauchent pas les contraintes décrites.
- Si un événement est complet (registeredCount >= capacity), signale-le dans la note.
- Ordonne les événements chronologiquement.`

  const user = `Contraintes de l'étudiant: "${constraints}"

Événements de la semaine (JSON):
${limitJson(weekEvents, 4000)}`

  return { system, user }
}

// ─────────────────────────────────────────────
// PROMPT 4 — Global Catalogue Q&A
// Role: answer any question about all events
// Output: plain text answer in French
// ─────────────────────────────────────────────
function buildQAPrompt(question: string, userId: string) {
  const events = getAllEvents().map(e => ({
    id: e.id,
    title: e.title,
    description: e.description.slice(0, 150),
    category: e.category,
    startDateTime: e.startDateTime,
    locationName: e.locationName,
    organizerName: e.organizerName,
    capacity: e.capacity ?? null,
    registeredCount: e.registeredCount,
    tags: e.tags ?? [],
  }))

  const system = `Tu es un assistant spécialisé dans les événements d'un campus universitaire.
Tu réponds aux questions des étudiants sur l'ensemble du catalogue d'événements.
Tes réponses sont précises, utiles, et basées uniquement sur les données fournies.

RÈGLES:
- Réponds en français, de manière claire et structurée.
- Si la question porte sur des dates, compare avec la date actuelle.
- Si tu ne trouves pas l'information dans les données, dis-le honnêtement.
- Longueur de réponse: 3 à 8 phrases maximum.`

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const user = `Date d'aujourd'hui: ${today}

Question: "${question}"

Catalogue complet des événements (JSON):
${limitJson(events, 5000)}`

  return { system, user }
}

// ─────────────────────────────────────────────
// Main callLLM function
// ─────────────────────────────────────────────
export async function callLLM(
  userId: string,
  type: 'search' | 'recommendation' | 'planning' | 'qa',
  inputText: string,
  apiKey: string
): Promise<{ outputText: string; fromCache: boolean }> {
  // Check cache first
  const cached = getCachedLLMResult(userId, type, inputText)
  if (cached) {
    return { outputText: cached.outputText, fromCache: true }
  }

  // Build prompt based on type
  let prompt: { system: string; user: string }
  switch (type) {
    case 'search':        prompt = buildSearchPrompt(inputText, userId); break
    case 'recommendation': prompt = buildRecommendationPrompt(inputText, userId); break
    case 'planning':      prompt = buildPlanningPrompt(inputText, userId); break
    case 'qa':            prompt = buildQAPrompt(inputText, userId); break
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    if (response.status === 401) throw new Error('Clé API invalide ou expirée')
    if (response.status === 429) throw new Error('Quota API dépassé, réessayez dans quelques secondes')
    throw new Error(`Erreur API ${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  const raw = data.choices[0].message.content as string

  // For JSON-returning types, extract the JSON; for qa, keep full text
  const outputText = type === 'qa' ? raw.trim() : extractJson(raw)

  // Save to cache
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
