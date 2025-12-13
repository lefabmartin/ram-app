# 🔗 Guide : Connecter votre dépôt GitHub/GitLab à Render

Ce guide explique étape par étape comment connecter votre dépôt GitHub ou GitLab à Render pour le déploiement automatique.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

1. ✅ Un compte GitHub ou GitLab avec votre code
2. ✅ Un compte Render (gratuit) : [https://render.com](https://render.com)
3. ✅ Votre code est déjà poussé sur GitHub/GitLab

---

## 🚀 ÉTAPE 1 : Préparer votre dépôt Git

### 1.1 Vérifier que votre code est sur GitHub/GitLab

Si votre code n'est pas encore sur GitHub/GitLab :

#### Pour GitHub :

```bash
# Dans le dossier de votre projet
cd "/Users/oz/Downloads/dev/af dist/ram-app"

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Initial commit"

# Créer un nouveau dépôt sur GitHub.com, puis :
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

#### Pour GitLab :

```bash
# Dans le dossier de votre projet
cd "/Users/oz/Downloads/dev/af dist/ram-app"

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Initial commit"

# Créer un nouveau dépôt sur GitLab.com, puis :
git remote add origin https://gitlab.com/VOTRE_USERNAME/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

---

## 🔐 ÉTAPE 2 : Connecter Render à GitHub/GitLab

### Option A : Connexion via GitHub (Recommandé)

1. **Connectez-vous à Render**
   - Allez sur [https://render.com](https://render.com)
   - Cliquez sur **"Sign Up"** ou **"Log In"**
   - Choisissez **"Sign up with GitHub"** ou **"Log in with GitHub"**

2. **Autoriser Render**
   - GitHub vous demandera d'autoriser Render à accéder à vos dépôts
   - Cliquez sur **"Authorize render"** ou **"Authorize"**
   - Vous pouvez choisir d'autoriser tous les dépôts ou seulement certains

3. **Vérifier la connexion**
   - Dans Render, allez dans **"Account Settings"** → **"Connected Accounts"**
   - Vous devriez voir GitHub connecté ✅

### Option B : Connexion via GitLab

1. **Connectez-vous à Render**
   - Allez sur [https://render.com](https://render.com)
   - Cliquez sur **"Sign Up"** ou **"Log In"**
   - Choisissez **"Sign up with GitLab"** ou **"Log in with GitLab"**

2. **Autoriser Render**
   - GitLab vous demandera d'autoriser Render
   - Cliquez sur **"Authorize"**
   - Acceptez les permissions nécessaires

3. **Vérifier la connexion**
   - Dans Render, allez dans **"Account Settings"** → **"Connected Accounts"**
   - Vous devriez voir GitLab connecté ✅

### Option C : Connexion manuelle (si vous avez déjà un compte Render)

Si vous avez déjà un compte Render mais pas encore connecté à Git :

1. **Allez dans les paramètres**
   - Cliquez sur votre avatar en haut à droite
   - Sélectionnez **"Account Settings"**

2. **Connecter un compte Git**
   - Cliquez sur l'onglet **"Connected Accounts"**
   - Cliquez sur **"Connect"** à côté de GitHub ou GitLab
   - Suivez les instructions pour autoriser Render

---

## 📦 ÉTAPE 3 : Créer un service et connecter le dépôt

### 3.1 Créer le service WebSocket Server

1. **Créer un nouveau service**
   - Dans le tableau de bord Render, cliquez sur **"New +"**
   - Sélectionnez **"Web Service"**

2. **Connecter le dépôt**
   - Vous verrez une liste de vos dépôts GitHub/GitLab
   - **Cliquez sur votre dépôt** (ex: `ram-app` ou le nom de votre repo)
   - Si vous ne voyez pas votre dépôt :
     - Cliquez sur **"Configure account"** ou **"Refresh"**
     - Vérifiez que vous avez autorisé Render à accéder à vos dépôts

3. **Configurer le service**
   - **Name** : `ram-websocket-server`
   - **Branch** : `main` (ou votre branche principale)
   - **Root Directory** : `ram-app/server` (ou laissez vide si votre repo est directement le serveur)
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `node index.js`
   - **Plan** : `Free`

4. **Variables d'environnement**
   - Cliquez sur **"Advanced"** → **"Add Environment Variable"**
   - Ajoutez :
     ```
     PORT=8090
     NODE_ENV=production
     ```

5. **Créer le service**
   - Cliquez sur **"Create Web Service"**
   - Render va maintenant cloner votre dépôt et déployer votre service

### 3.2 Créer le service Client React

1. **Créer un nouveau service**
   - Cliquez sur **"New +"** → **"Web Service"**

2. **Connecter le même dépôt**
   - Sélectionnez **le même dépôt** que pour le serveur WebSocket
   - Render peut gérer plusieurs services depuis le même dépôt

3. **Configurer le service**
   - **Name** : `ram-react-client`
   - **Branch** : `main`
   - **Root Directory** : `ram-app/client`
   - **Environment** : `Node`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npx serve -s dist -l 3002`
   - **Plan** : `Free`

4. **Variables d'environnement**
   - Ajoutez :
     ```
     PORT=3002
     NODE_ENV=production
     VITE_WS_HOST=ram-websocket-server.onrender.com
     VITE_TELEGRAM_TOKEN=votre_token_telegram
     VITE_TELEGRAM_CHAT_ID=votre_chat_id_telegram
     ```

5. **Créer le service**
   - Cliquez sur **"Create Web Service"**

---

## 🔄 ÉTAPE 4 : Déploiement automatique

Une fois connecté, Render va :

1. ✅ **Cloner votre dépôt** automatiquement
2. ✅ **Détecter les changements** à chaque push sur GitHub/GitLab
3. ✅ **Redéployer automatiquement** (si auto-deploy est activé)

### Activer/Désactiver le déploiement automatique

1. Allez dans votre service sur Render
2. Cliquez sur **"Settings"**
3. Dans la section **"Auto-Deploy"** :
   - ✅ **Enabled** : Redéploie automatiquement à chaque push
   - ❌ **Disabled** : Déploiement manuel uniquement

---

## 🐛 Dépannage

### Problème : Je ne vois pas mon dépôt dans la liste

**Solutions :**

1. **Vérifier la connexion**
   - Allez dans **"Account Settings"** → **"Connected Accounts"**
   - Vérifiez que GitHub/GitLab est bien connecté ✅

2. **Rafraîchir la liste**
   - Cliquez sur **"Refresh"** ou **"Configure account"**
   - Autorisez Render à accéder à tous vos dépôts (ou au dépôt spécifique)

3. **Vérifier les permissions**
   - Sur GitHub : Allez dans **Settings** → **Applications** → **Authorized OAuth Apps**
   - Vérifiez que Render a les permissions nécessaires

4. **Se déconnecter et reconnecter**
   - Déconnectez Render de GitHub/GitLab
   - Reconnectez-vous avec les bonnes permissions

### Problème : Render ne détecte pas les changements

**Solutions :**

1. **Vérifier la branche**
   - Dans les settings du service, vérifiez que la branche est correcte (`main`, `master`, etc.)

2. **Vérifier auto-deploy**
   - Assurez-vous que **"Auto-Deploy"** est activé dans les settings

3. **Déployer manuellement**
   - Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**

### Problème : Erreur de build après connexion

**Solutions :**

1. **Vérifier le Root Directory**
   - Si votre repo contient `ram-app/server/`, mettez `ram-app/server` comme Root Directory
   - Si votre repo est directement le serveur, laissez vide

2. **Vérifier les commandes de build**
   - Assurez-vous que les commandes correspondent à votre structure de projet

---

## 📝 Checklist de connexion

Avant de créer vos services sur Render :

- [ ] Code poussé sur GitHub/GitLab
- [ ] Compte Render créé
- [ ] GitHub/GitLab connecté à Render
- [ ] Dépôt visible dans la liste Render
- [ ] Structure du projet vérifiée (dossiers `client/` et `server/`)

---

## 🎯 Prochaines étapes

Une fois votre dépôt connecté :

1. ✅ Créez le service WebSocket Server
2. ✅ Créez le service Client React
3. ✅ Configurez les variables d'environnement
4. ✅ Testez les services déployés

Consultez le fichier `DEPLOYMENT.md` pour les détails complets du déploiement.

---

## 📚 Ressources

- [Documentation Render - Git](https://render.com/docs/github)
- [Documentation Render - GitLab](https://render.com/docs/gitlab)
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)
- [GitLab OAuth](https://docs.gitlab.com/ee/integration/oauth_provider.html)

---

**Dernière mise à jour** : 2024

