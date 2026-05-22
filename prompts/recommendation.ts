import { Event } from '../types'

export function getRecommendationPrompt(
  query: string,
  upcomingEvents: Event[],
  favoriteEvents: (Event | undefined)[],
  registeredEvents: (Event | undefined)[]
) {
  const favsJson = JSON.stringify(
    favoriteEvents.filter(Boolean).map((e) => ({
      title: e!.title,
      category: e!.category,
      tags: e!.tags,
    })),
    null,
    2
  )

  const regsJson = JSON.stringify(
    registeredEvents.filter(Boolean).map((e) => ({
      title: e!.title,
      category: e!.category,
      tags: e!.tags,
    })),
    null,
    2
  )

  const upcomingJson = JSON.stringify(
    upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description.slice(0, 150),
      category: e.category,
      startDateTime: e.startDateTime,
      tags: e.tags,
    })),
    null,
    2
  ).slice(0, 5000)

  return {
    system: `Tu es un assistant de recommandation d'événements universitaires. Tu reçois l'historique d'un étudiant (favoris et inscriptions) ainsi que les événements à venir. Tu dois recommander 3 événements maximum qui correspondent le mieux à ses centres d'intérêt.

Règles :
- Analyse les patterns dans les favoris et inscriptions (catégories, tags, thèmes)
- Ne recommande PAS des événements auxquels l'étudiant est déjà inscrit
- Propose des suggestions variées mais cohérentes avec son profil
- Retourne UNIQUEMENT un tableau JSON valide

Format de sortie attendu :
[
  {
    "eventId": "id",
    "title": "Titre",
    "reason": "Pourquoi cet événement correspond à son profil (1-2 phrases en français)"
  }
]`,

    user: `Requête ou contexte : "${query}"

Favoris de l'étudiant :
${favsJson}

Inscriptions de l'étudiant :
${regsJson}

Événements à venir :
${upcomingJson}

Réponds avec le tableau JSON uniquement.`,
  }
}
