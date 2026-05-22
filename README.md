# 🎓 CampusEvents AI

Application mobile multiplateforme développée avec **React Native (Expo)** qui centralise les événements du campus universitaire et aide les étudiants à trouver les événements qui leur correspondent grâce à un assistant IA.

---

## 📱 Fonctionnalités

### 🔐 Authentification
- Deux comptes préconfigurés : **Admin** et **Étudiant**
- Session persistante (restez connecté après la fermeture de l'application)
- Navigation adaptée au rôle connecté

### 👨‍💼 Interface Admin
- **Gestion complète des événements** (Créer, Modifier, Supprimer, Lister)
- Formulaire avec validation (champs requis, dates cohérentes, capacité valide)
- Suppression avec confirmation et nettoyage automatique des inscriptions/favoris

### 👨‍🎓 Interface Étudiant
- **Catalogue** avec recherche texte, filtres par catégorie et par période
- **Détail événement** avec inscription, favoris, jauge de capacité
- **Mes favoris** et **Mes inscriptions** persistants
- Règles métier : pas d'inscription en double, événement complet/passé désactivé

### 🤖 Assistant IA (Groq LLM)
- **Recherche en langage naturel** : trouvez des événements sans mots-clés exacts
- **Recommandation personnalisée** : suggestions basées sur vos favoris et inscriptions
- **Assistant de planification** : planning hebdomadaire sans conflit
- **Questions/réponses** sur l'ensemble du catalogue
- Cache intelligent des résultats (pas d'appels redondants)
- Tous les états gérés : chargement, erreur, vide, résultat

### 🌙 Thème sombre / clair
- Bouton de bascule avec animation fluide
- Préférence persistante (sauvegardée sur l'appareil)
- Détection automatique du thème système

---

## 🏗️ Architecture

```
campusevents-ai/
├── app/                    # Expo Router (navigation)
│   ├── _layout.tsx         # Layout racine (connexion, rôles)
│   ├── login.tsx           # Écran de connexion
│   ├── event/[id].tsx      # Détail événement
│   ├── (admin)/            # Interface administrateur
│   └── (student)/          # Interface étudiant
├── components/
│   ├── ui/                 # Composants réutilisables (9 primitives)
│   ├── EventCard.tsx       # Carte événement
│   ├── EventForm.tsx       # Formulaire événement
│   └── ...
├── context/                # Contexte React (Auth + Theme)
├── database/               # Couche SQLite (5 modules CRUD)
├── services/llm.ts         # Service IA (API Groq)
├── prompts/                # 4 prompts LLM documentés
├── constants/              # Couleurs, thèmes, données initiales
└── types/                  # Types TypeScript
```

### Stack technique

| Technologie | Utilisation |
|------------|-------------|
| **Expo SDK 56** | Framework React Native |
| **Expo Router** | Navigation (file-based routing) |
| **expo-sqlite** | Base de données locale SQLite |
| **Groq API** | LLM (Llama 3 70B, gratuit) |
| **AsyncStorage** | Session et préférences |
| **React Context** | Gestion d'état |

---

## 🚀 Installation et démarrage

### Prérequis
- Node.js 18+
- Expo Go sur votre téléphone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/mohamed-amine-dev/CampusEvents-AI.git
cd CampusEvents-AI

# Installer les dépendances
npm install

# Lancer l'application
npx expo start
```

Scannez le QR code avec **Expo Go** sur votre téléphone.

### Configuration de l'IA

1. Obtenez une clé API gratuite sur [console.groq.com](https://console.groq.com)
2. Deux options :
   - **Option 1** : Créez un fichier `.env` à la racine :
     ```
     GROQ_API_KEY=gsk_votre_cle_ici
     ```
   - **Option 2** : Lancez l'app, allez dans l'onglet **Assistant**, cliquez sur ⚙️ et saisissez votre clé directement

---

## 🔑 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | `admin@campus.ma` | `admin123` |
| Étudiant | `etudiant@campus.ma` | `etudiant123` |

> **Note** : Les deux profils partagent la même base de données SQLite sur le même appareil. C'est une contrainte inhérente à une architecture 100% locale, acceptable dans le cadre d'une démonstration.

---

## 🗄️ Base de données

L'application utilise **expo-sqlite** avec 4 tables :

| Table | Description |
|-------|-------------|
| `events` | Catalogue des événements (CRUD complet) |
| `registrations` | Inscriptions des étudiants aux événements |
| `favorites` | Favoris des étudiants |
| `llm_results` | Cache des résultats de l'assistant IA |

12 événements de démonstration sont préchargés au premier lancement.

---

## 📝 Prompts IA

Les 4 prompts sont documentés dans le dossier `prompts/` :

| Fichier | Fonctionnalité | Format de sortie |
|---------|---------------|-----------------|
| `searchNL.ts` | Recherche naturelle | `[{ eventId, reason }]` |
| `recommendation.ts` | Recommandation | `[{ eventId, title, reason }]` |
| `planning.ts` | Planification | `{ planning: [{ day, events }] }` |
| `qa.ts` | Questions/Réponses | Texte libre structuré |

Chaque prompt comprend :
- Un rôle système explicite
- Les données injectées au format JSON
- Un format de sortie clairement spécifié
- Une limite de contexte (4 000 à 8 000 caractères)

---

## 📱 Captures d'écran

| Connexion | Catalogue | Assistant |
|-----------|-----------|-----------|
| Écran de connexion avec sélecteur de rôle | Liste des événements avec filtres et recherche | Assistant IA avec 4 modes |

---

## 🎯 Objectifs pédagogiques

Ce projet a été développé dans le cadre d'un mini-projet universitaire (Université Abdelmalek Essaâdi — Département Informatique) et évalue :

- **React Native / Expo** : Navigation multi-rôles, composants, formulaires avec validation
- **SQLite** : Modélisation relationnelle, CRUD, requêtes filtrées
- **LLM / Prompt engineering** : Conception de prompts structurés, parsing de réponse, gestion d'erreurs
- **Architecture** : Séparation des responsabilités, organisation du code
- **UI/UX** : Design adaptatif (clair/sombre), animations, expérience utilisateur

---


