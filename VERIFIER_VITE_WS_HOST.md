# 🔍 Vérifier la valeur de VITE_WS_HOST

## ⚠️ Problème courant

La variable `VITE_WS_HOST` existe déjà dans Render, mais le panel ne fonctionne toujours pas.

## ✅ Vérifications à faire

### 1. Vérifier la valeur actuelle de VITE_WS_HOST

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Ouvrez votre service **ram-react-client**
3. Allez dans l'onglet **"Environment"**
4. Trouvez la variable **`VITE_WS_HOST`**
5. **Notez la valeur exacte**

### 2. Format correct vs incorrect

#### ✅ Format CORRECT :
```
ram-ws-backend.onrender.com
```
ou
```
votre-serveur.onrender.com
```

**Caractéristiques** :
- ✅ Pas de protocole (`wss://`, `ws://`, `https://`)
- ✅ Pas de slash à la fin
- ✅ Juste le nom de domaine (avec ou sans port si nécessaire)

#### ❌ Formats INCORRECTS :

```
wss://ram-ws-backend.onrender.com    ❌ (ne pas mettre wss://)
ws://ram-ws-backend.onrender.com     ❌ (ne pas mettre ws://)
https://ram-ws-backend.onrender.com  ❌ (ne pas mettre https://)
ram-ws-backend.onrender.com/         ❌ (pas de slash à la fin)
ram-ws-backend.onrender.com/ws       ❌ (pas de chemin)
```

### 3. Vérifier que le serveur WebSocket existe

1. Sur Render Dashboard, vérifiez si vous avez un service WebSocket déployé
2. Le nom devrait être quelque chose comme :
   - `ram-ws-backend`
   - `ram-websocket-server`
   - Ou un autre nom que vous avez choisi

3. **Vérifiez que le service est "Live"** (pas "Stopped")

### 4. Tester l'URL du serveur WebSocket

#### Test 1 : Vérifier l'endpoint /health

Ouvrez dans votre navigateur :
```
https://[VOTRE-SERVEUR-WEBSOCKET].onrender.com/health
```

Remplacez `[VOTRE-SERVEUR-WEBSOCKET]` par la valeur de votre `VITE_WS_HOST` (sans le protocole).

**Résultat attendu** :
```
WebSocket server is running
```

**Si erreur** :
- Le serveur WebSocket n'est pas démarré
- L'URL est incorrecte
- Le serveur n'est pas accessible

#### Test 2 : Vérifier l'URL complète dans le panel

1. Ouvrez le panel : https://ram-react-client.onrender.com/panel
2. Ouvrez la console du navigateur (F12)
3. Regardez le message d'erreur - il devrait afficher l'URL tentée
4. L'URL devrait être : `wss://[VOTRE-VITE_WS_HOST]`

### 5. Problèmes courants et solutions

#### Problème 1 : La valeur contient `wss://` ou `ws://`

**Symptôme** : L'URL tentée est `wss://wss://serveur.onrender.com` (double protocole)

**Solution** :
1. Dans Render → Environment → `VITE_WS_HOST`
2. Supprimez `wss://` ou `ws://` du début
3. Gardez seulement : `serveur.onrender.com`
4. Sauvegardez et redéployez

#### Problème 2 : La valeur contient un chemin (`/ws`, `/socket`, etc.)

**Symptôme** : L'URL tentée est `wss://serveur.onrender.com/ws` mais le serveur n'accepte pas ce chemin

**Solution** :
1. Supprimez le chemin de la valeur
2. Gardez seulement le nom de domaine : `serveur.onrender.com`
3. Le code ajoutera automatiquement le protocole `wss://`

#### Problème 3 : Le serveur WebSocket n'est pas déployé

**Symptôme** : Erreur de connexion, le serveur n'existe pas

**Solution** :
1. Déployez d'abord le serveur WebSocket sur Render
2. Voir le guide : `CONFIGURER_WEBSOCKET_RENDER.md`
3. Une fois déployé, utilisez son URL dans `VITE_WS_HOST`

#### Problème 4 : Le serveur WebSocket est "Stopped"

**Symptôme** : Le serveur existe mais n'est pas démarré

**Solution** :
1. Sur Render Dashboard, ouvrez votre service WebSocket
2. Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**
3. Attendez que le service soit "Live"

#### Problème 5 : La variable a été modifiée mais pas redéployée

**Symptôme** : Vous avez modifié `VITE_WS_HOST` mais le panel utilise toujours l'ancienne valeur

**Solution** :
- **Important** : Les variables `VITE_*` sont injectées au moment du **build**
- Après avoir modifié `VITE_WS_HOST`, vous devez **redéployer** le service client
- Render devrait redéployer automatiquement, mais si ce n'est pas le cas :
  1. Allez dans votre service client sur Render
  2. Cliquez sur **"Manual Deploy"** → **"Deploy latest commit"**

## 📋 Checklist de vérification

Cochez chaque point :

- [ ] La variable `VITE_WS_HOST` existe dans Render → Environment
- [ ] La valeur ne contient **PAS** `wss://` ou `ws://`
- [ ] La valeur ne contient **PAS** de slash à la fin (`/`)
- [ ] La valeur ne contient **PAS** de chemin (`/ws`, `/socket`, etc.)
- [ ] La valeur est au format : `serveur.onrender.com` (ou similaire)
- [ ] Le serveur WebSocket existe sur Render
- [ ] Le serveur WebSocket est **"Live"** (pas "Stopped")
- [ ] L'endpoint `/health` du serveur WebSocket répond correctement
- [ ] Le service client a été **redéployé** après modification de `VITE_WS_HOST`

## 🔧 Comment corriger la valeur

### Étape 1 : Modifier la variable

1. Render Dashboard → Service **ram-react-client** → **Environment**
2. Trouvez `VITE_WS_HOST`
3. Cliquez sur **"Edit"** ou modifiez la valeur
4. Assurez-vous que la valeur est au format : `votre-serveur.onrender.com`
5. Cliquez sur **"Save Changes"**

### Étape 2 : Redéployer

**Option A - Redéploiement automatique** :
- Render devrait redéployer automatiquement après avoir sauvegardé

**Option B - Redéploiement manuel** :
1. Allez dans votre service client
2. Cliquez sur **"Manual Deploy"**
3. Sélectionnez **"Deploy latest commit"**
4. Attendez la fin du déploiement

### Étape 3 : Vérifier

1. Attendez que le déploiement soit terminé
2. Ouvrez le panel : https://ram-react-client.onrender.com/panel
3. Ouvrez la console (F12)
4. Vérifiez les messages :
   - ✅ `WebSocket connected to: wss://votre-serveur.onrender.com`
   - ❌ Si erreur, vérifiez les logs et la valeur de `VITE_WS_HOST`

## 💡 Exemple concret

### Configuration correcte :

**Dans Render → Environment → VITE_WS_HOST** :
```
ram-ws-backend.onrender.com
```

**Résultat dans le code** :
- Le code construit : `wss://ram-ws-backend.onrender.com`
- La connexion WebSocket fonctionne ✅

### Configuration incorrecte :

**Dans Render → Environment → VITE_WS_HOST** :
```
wss://ram-ws-backend.onrender.com
```

**Résultat dans le code** :
- Le code construit : `wss://wss://ram-ws-backend.onrender.com` ❌
- La connexion WebSocket échoue ❌

## 🆘 Besoin d'aide ?

Si le problème persiste après avoir vérifié tous les points :

1. **Copiez la valeur exacte** de `VITE_WS_HOST` depuis Render
2. **Copiez les messages d'erreur** de la console du navigateur (F12)
3. **Vérifiez les logs** du service WebSocket sur Render
4. **Vérifiez les logs** du service Client sur Render

Ces informations aideront à identifier le problème exact.

---

**Rappel important** : Après avoir modifié `VITE_WS_HOST`, vous **DEVEZ** redéployer le service client car les variables `VITE_*` sont injectées au moment du build.
