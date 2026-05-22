import { Event } from '../types'

export function getPlanningPrompt(userConstraints: string, weekEvents: Event[]) {
  const eventsJson = JSON.stringify(
    weekEvents.map((e) => ({
      id: e.id,
      title: e.title,
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime,
      locationName: e.locationName,
    })),
    null,
    2
  ).slice(0, 5000)

  return {
    system: `Tu es un assistant de planification de semaine universitaire. Tu reçois les contraintes horaires d'un étudiant et les événements de la semaine. Tu dois produire un planning suggéré sans conflits.

Règles :
- Évite les chevauchements entre événements
- Tiens compte des contraintes de l'étudiant (cours, examens, etc.)
- Suggère un ordre de priorité si plusieurs événements se chevauchent
- Retourne UNIQUEMENT un objet JSON valide
- Si aucun événement n'est compatible, retourne { "planning": [], "message": "Aucun événement compatible cette semaine" }

Format de sortie attendu :
{
  "planning": [
    {
      "day": "Lundi",
      "events": [
        {
          "eventId": "id",
          "title": "Titre",
          "startTime": "09:00",
          "endTime": "11:00",
          "note": "Note optionnelle sur le conflit ou la priorité"
        }
      ]
    }
  ],
  "message": "Résumé optionnel du planning"
}`,

    user: `Contraintes de l'étudiant : "${userConstraints}"

Événements de la semaine :
${eventsJson}

Réponds avec l'objet JSON uniquement.`,
  }
}
