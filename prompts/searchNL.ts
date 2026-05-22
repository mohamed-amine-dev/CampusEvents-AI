import { Event } from '../types'

export function getSearchNLPrompt(query: string, events: Event[]) {
  const eventsJson = JSON.stringify(
    events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      startDateTime: e.startDateTime,
      locationName: e.locationName,
      tags: e.tags,
    })),
    null,
    2
  ).slice(0, 6000)

  return {
    system: `Tu es un assistant de recherche d'événements universitaires. Tu reçois une requête en langage naturel et une liste d'événements au format JSON. Tu dois identifier les événements pertinents pour la requête.

Règles :
- Cherche des correspondances sémantiques, pas seulement des mots-clés exacts
- Par exemple, "IA" peut correspondre à "Machine Learning" ou "TensorFlow"
- Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ou après
- Si aucun événement n'est pertinent, retourne un tableau vide []

Format de sortie attendu :
[
  {
    "eventId": "id-de-l-evenement",
    "reason": "Courte justification (1 phrase en français)"
  }
]`,

    user: `Requête de l'étudiant : "${query}"

Catalogue des événements :
${eventsJson}

Réponds avec le tableau JSON uniquement.`,
  }
}
