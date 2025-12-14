# 🔍 Diagnostic du Panel Dashboard

## 📍 URL du Panel
**https://ram-react-client.onrender.com/panel**

## ✅ Vérifications à faire

### 1. Ouvrir le Panel et vérifier l'état

1. **Ouvrez le panel** : https://ram-react-client.onrender.com/panel
2. **Ouvrez la console du navigateur** (F12 → Console)
3. **Regardez les messages affichés** :

#### ✅ Si vous voyez :
- **"✅ Connecté au serveur WebSocket"** (en vert) → **Tout fonctionne !**
- La liste des clients s'affiche (même si vide)

#### ❌ Si vous voyez :
- **"⚠️ Erreur de connexion WebSocket"** (en rouge)
- **"⏳ Connexion en cours..."** (en jaune, qui reste bloqué)

### 2. Vérifier la console du navigateur

Dans la console (F12), vous devriez voir :

#### ✅ Messages normaux :
```
WebSocket connected to: wss://ram-ws-backend.onrender.com
```

#### ❌ Messages d'erreur possibles :
```
WebSocket error: ...
Failed to connect to WebSocket
```

**Notez l'URL tentée** dans le message d'erreur - elle vous indiquera quelle URL est utilisée.

### 3. Vérifier la configuration dans Render

#### A. Vérifier la variable d'environnement VITE_WS_HOST

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Ouvrez votre service **ram-react-client**
3. Allez dans l'onglet **"Environment"**
4. Cherchez la variable **`VITE_WS_HOST`**

**Si elle n'existe pas** :
- Cliquez sur **"Add Environment Variable"**
- **Key**: `VITE_WS_HOST`
- **Value**: L'URL de votre serveur WebSocket (ex: `ram-ws-backend.onrender.com`)
- **⚠️ IMPORTANT**: Sans `wss://` ou `ws://`
- Cliquez sur **"Save Changes"**
- Render redéploiera automatiquement

**Si elle existe** :
- Vérifiez que la valeur est correcte
- Elle doit être au format : `votre-serveur.onrender.com` (sans protocole)
- Si vous l'avez modifiée, attendez le redéploiement

#### B. Vérifier que le serveur WebSocket est déployé

1. Sur Render Dashboard, vérifiez si vous avez un service **ram-ws-backend** (ou similaire)
2. Si **non**, vous devez le créer :
   - Voir le guide : `CONFIGURER_WEBSOCKET_RENDER.md`
3. Si **oui**, vérifiez qu'il est **"Live"** (pas "Stopped")

### 4. Tester la connexion WebSocket directement

#### Test 1 : Vérifier que le serveur répond

Ouvrez dans votre navigateur :
```
https://votre-serveur-websocket.onrender.com/health
```

**Résultat attendu** :
```
WebSocket server is running
```

**Si erreur 404 ou autre** :
- Le serveur WebSocket n'est pas démarré ou mal configuré
- Vérifiez les logs du service WebSocket sur Render

#### Test 2 : Vérifier l'URL complète

L'URL complète du WebSocket devrait être :
```
wss://votre-serveur-websocket.onrender.com
```

(Le `wss://` est ajouté automatiquement par le code)

## 🐛 Problèmes courants et solutions

### Problème 1 : "Impossible de se connecter au serveur WebSocket"

**Cause** : La variable `VITE_WS_HOST` n'est pas configurée ou incorrecte

**Solution** :
1. Vérifiez que `VITE_WS_HOST` existe dans Render → Environment
2. Vérifiez que la valeur est correcte (sans `wss://`)
3. Redéployez le service client après modification

### Problème 2 : "Erreur de connexion WebSocket"

**Cause** : Le serveur WebSocket n'est pas démarré ou inaccessible

**Solution** :
1. Vérifiez que le service WebSocket est **"Live"** sur Render
2. Vérifiez les logs du serveur WebSocket
3. Testez l'endpoint `/health` du serveur WebSocket

### Problème 3 : Le panel charge mais reste vide

**Cause** : La connexion WebSocket fonctionne mais aucun client n'est connecté

**Solution** :
- C'est normal ! Le panel affiche les clients qui sont connectés en temps réel
- Pour tester, ouvrez une autre page de l'application (ex: `/track`) dans un autre onglet
- Le client devrait apparaître dans le panel

### Problème 4 : "Connexion en cours..." qui reste bloqué

**Cause** : Le WebSocket essaie de se connecter mais échoue silencieusement

**Solution** :
1. Ouvrez la console (F12) pour voir les erreurs détaillées
2. Vérifiez que `VITE_WS_HOST` est bien configuré
3. Vérifiez que le serveur WebSocket est démarré
4. Attendez quelques secondes - le système essaie de se reconnecter automatiquement

## 📋 Checklist de diagnostic

Cochez chaque point :

- [ ] Le panel s'ouvre sans erreur 404
- [ ] La console du navigateur ne montre pas d'erreurs JavaScript
- [ ] La variable `VITE_WS_HOST` existe dans Render → Environment
- [ ] La valeur de `VITE_WS_HOST` est correcte (format: `serveur.onrender.com`)
- [ ] Le service WebSocket existe sur Render
- [ ] Le service WebSocket est **"Live"** (pas "Stopped")
- [ ] L'endpoint `/health` du serveur WebSocket répond
- [ ] Le service client a été redéployé après avoir ajouté/modifié `VITE_WS_HOST`

## 🔧 Commandes utiles pour tester

### Dans la console du navigateur (F12)

```javascript
// Vérifier la variable d'environnement (si accessible)
console.log('VITE_WS_HOST:', import.meta.env.VITE_WS_HOST);

// Tester une connexion WebSocket manuellement
const ws = new WebSocket('wss://ram-ws-backend.onrender.com');
ws.onopen = () => console.log('✅ Connexion réussie');
ws.onerror = (e) => console.error('❌ Erreur:', e);
ws.onclose = (e) => console.log('🔌 Fermé:', e.code, e.reason);
```

## 📞 Support

Si le problème persiste après avoir vérifié tous les points :

1. **Copiez les messages d'erreur** de la console du navigateur
2. **Vérifiez les logs** du service WebSocket sur Render
3. **Vérifiez les logs** du service Client sur Render
4. Consultez le guide complet : `CONFIGURER_WEBSOCKET_RENDER.md`

---

**Note importante** : Les variables d'environnement `VITE_*` sont injectées au moment du **build**. Si vous modifiez `VITE_WS_HOST`, vous devez **redéployer** le service client pour que les changements prennent effet.
