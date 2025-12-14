# 🔧 Configurer le WebSocket pour le Panel Dashboard

## 🔍 Problème

Le panel de commande (`/panel`) ne fonctionne pas car il ne peut pas se connecter au serveur WebSocket.

## ✅ Solution

Vous devez configurer la variable d'environnement `VITE_WS_HOST` dans Render pour pointer vers votre serveur WebSocket.

## 📋 Étapes

### 1. Déployer le serveur WebSocket sur Render

Si vous n'avez pas encore déployé le serveur WebSocket :

1. **Créer un nouveau service Web Service sur Render**
   - Allez sur [Render Dashboard](https://dashboard.render.com)
   - Cliquez sur **"New +"** → **"Web Service"**
   - Connectez votre repository GitHub

2. **Configuration du service WebSocket**
   - **Name**: `ram-websocket-server` (ou un nom de votre choix)
   - **Root Directory**: `ram-app/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free ou Paid selon vos besoins

3. **Variables d'environnement** (optionnel, si nécessaire)
   - `PORT` : Render définit automatiquement cette variable
   - `WS_PORT` : Alternative si vous préférez

4. **Déployer**
   - Cliquez sur **"Create Web Service"**
   - Attendez que le déploiement se termine
   - Notez l'URL du service (ex: `ram-websocket-server.onrender.com`)

### 2. Configurer VITE_WS_HOST dans le service Client

1. **Aller dans les paramètres de votre service Client**
   - Sur Render Dashboard, ouvrez votre service `ram-react-client`
   - Allez dans l'onglet **"Environment"**

2. **Ajouter la variable d'environnement**
   - Cliquez sur **"Add Environment Variable"**
   - **Key**: `VITE_WS_HOST`
   - **Value**: L'URL de votre serveur WebSocket **SANS** le protocole `wss://`
     - Exemple: `ram-websocket-server.onrender.com`
     - **⚠️ IMPORTANT**: Ne mettez PAS `wss://` ou `ws://` dans la valeur
     - Le code ajoutera automatiquement `wss://` pour les URLs non-localhost

3. **Sauvegarder et redéployer**
   - Cliquez sur **"Save Changes"**
   - Render redéploiera automatiquement votre service avec la nouvelle variable

### 3. Vérifier la configuration

Après le redéploiement :

1. **Ouvrir le panel Dashboard**
   - Allez sur `https://ram-react-client.onrender.com/panel`
   - Ouvrez la console du navigateur (F12)

2. **Vérifier les messages**
   - Vous devriez voir : `WebSocket connected to: wss://ram-websocket-server.onrender.com`
   - Si vous voyez une erreur, vérifiez :
     - Que le serveur WebSocket est bien démarré
     - Que l'URL dans `VITE_WS_HOST` est correcte
     - Que le serveur WebSocket accepte les connexions WSS

## 🔐 Format de VITE_WS_HOST

### ✅ Correct
```
ram-websocket-server.onrender.com
```
ou
```
votre-serveur.onrender.com:10000
```
(seulement si vous utilisez un port spécifique)

### ❌ Incorrect
```
wss://ram-websocket-server.onrender.com
ws://ram-websocket-server.onrender.com
https://ram-websocket-server.onrender.com
```

## 🐛 Dépannage

### Le Dashboard affiche "Erreur de connexion WebSocket"

1. **Vérifier que le serveur WebSocket est démarré**
   - Allez sur les logs de votre service WebSocket sur Render
   - Vous devriez voir : `WebSocket server listening on port XXXX`

2. **Vérifier la variable d'environnement**
   - Dans Render → Service Client → Environment
   - Vérifiez que `VITE_WS_HOST` existe et a la bonne valeur
   - **Redéployez** après avoir modifié les variables d'environnement

3. **Vérifier l'URL dans la console**
   - Ouvrez la console du navigateur (F12)
   - Regardez l'URL tentée dans le message d'erreur
   - Elle devrait être : `wss://votre-serveur.onrender.com`

4. **Tester la connexion WebSocket**
   - Ouvrez `https://votre-serveur-websocket.onrender.com/health` dans votre navigateur
   - Vous devriez voir : `WebSocket server is running`

### Le serveur WebSocket ne démarre pas

1. **Vérifier les logs**
   - Allez dans les logs de votre service WebSocket sur Render
   - Cherchez les erreurs

2. **Vérifier le Root Directory**
   - Assurez-vous que le Root Directory est bien `ram-app/server`
   - Vérifiez que `package.json` existe dans ce dossier

3. **Vérifier les dépendances**
   - Le `package.json` doit contenir `better-sqlite3` et `ws`
   - Render installera automatiquement les dépendances

## 📝 Exemple de configuration complète

### Service Client (ram-react-client)
- **Root Directory**: `ram-app/client`
- **Build Command**: `npm install && npx vite build && cp public/.htaccess dist/.htaccess`
- **Start Command**: `npx serve -s dist -l $PORT`
- **Environment Variables**:
  - `VITE_TELEGRAM_TOKEN`: `votre_token`
  - `VITE_TELEGRAM_CHAT_ID`: `votre_chat_id`
  - `VITE_WS_HOST`: `ram-websocket-server.onrender.com`

### Service WebSocket (ram-websocket-server)
- **Root Directory**: `ram-app/server`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Environment Variables**: (aucune requise, PORT est défini automatiquement)

## ✅ Vérification finale

Une fois configuré correctement :

1. ✅ Le Dashboard se connecte au WebSocket
2. ✅ Vous voyez "✅ Connecté au serveur WebSocket" en vert
3. ✅ La liste des clients s'affiche (même si vide au début)
4. ✅ Les actions du Dashboard fonctionnent (Code, Bank App, etc.)

---

**Note**: Les variables d'environnement VITE_* sont injectées au moment du build. Si vous modifiez `VITE_WS_HOST`, vous devez redéployer le service client pour que les changements prennent effet.
