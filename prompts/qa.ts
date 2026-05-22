import { Event } from '../types'

export function getQAPrompt(question: string, allEvents: Event[]) {
  const eventsJson = JSON.stringify(
    allEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description.slice(0, 200),
      category: e.category,
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime,
      locationName: e.locationName,
      organizerName: e.organizerName,
      capacity: e.capacity,
      registeredCount: e.registeredCount,
      tags: e.tags,
    })),
    null,
    2
  ).slice(0, 7000)

  return {
    system: `Tu es un assistant spécialisé dans le catalogue d'événements d'un campus universitaire. Tu réponds aux questions des étudiants sur l'ensemble des événements.

Règles :
- Base-toi UNIQUEMENT sur les données fournies
- Si l'information n'est pas disponible dans le catalogue, indique-le clairement
- Réponds en français, de manière concise et utile
- Tu peux faire des calculs et des comparaisons entre événements
- Le format de réponse est un texte libre structuré (pas de JSON)

Format de sortie : réponse en texte naturel, avec des sections si pertinent.`,

    user: `Question de l'étudiant : "${question}"

Catalogue complet des événements :
${eventsJson}

Réponds à la question en te basant uniquement sur ces données.`,
  }
}
