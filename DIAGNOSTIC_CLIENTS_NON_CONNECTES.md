# 🔍 Diagnostic : Clients ne se connectent pas au WebSocket

## Problème
Le panel dashboard se connecte correctement au WebSocket (`wss://ram-ws-backend.onrender.com`), mais aucun client n'apparaît dans la liste. Le panel reçoit 0 clients.

## ✅ Ce qui fonctionne
- ✅ Connexion WebSocket du dashboard réussie
- ✅ Enregistrement du dashboard réussi
- ✅ Réception de la liste des clients (vide)

## ❌ Ce qui ne fonctionne pas
- ❌ Aucun client ne se connecte au serveur WebSocket
- ❌ Aucune notification de nouveau client

## 🔍 Étapes de diagnostic

### 1. Vérifier que les clients visitent le site

Ouvrez l'application principale (pas le panel) dans un navigateur :
```
https://shipp834.com/couriers.services.co.za/track
```

### 2. Ouvrir la console du navigateur

Appuyez sur `F12` ou `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows) pour ouvrir les outils de développement.

### 3. Vérifier les logs de socket.js

Vous devriez voir ces messages dans la console :

```
[Socket] socket.js loaded, pathname: /couriers.services.co.za/track
[Socket] Connecting to WebSocket: wss://ram-ws-backend.onrender.com
[Socket] VITE_WS_HOST value: ram-ws-backend.onrender.com
```

**Si vous ne voyez PAS ces messages :**
- ❌ Le fichier `socket.js` ne se charge pas
- Vérifiez l'onglet "Network" dans les outils de développement
- Cherchez `socket.js` dans la liste des fichiers chargés
- Vérifiez s'il y a une erreur 404

### 4. Vérifier la connexion WebSocket

Si les logs apparaissent, vous devriez voir :

**✅ Connexion réussie :**
```
[Socket] WebSocket connected successfully
WS message: {type: "welcome", ...}
WS message: {type: "registered", ...}
```

**❌ Connexion échouée :**
```
[Socket] WebSocket error: [erreur]
[Socket] Failed to connect to: wss://ram-ws-backend.onrender.com
```

### 5. Vérifier VITE_WS_HOST dans le HTML

Dans la console du navigateur, tapez :
```javascript
window.VITE_WS_HOST
```

**Résultat attendu :**
```
"ram-ws-backend.onrender.com"
```

**Si le résultat est différent ou `undefined` :**
- ❌ Le build n'a pas remplacé `%VITE_WS_HOST%` correctement
- Vérifiez le fichier `dist/index.html` sur le serveur
- Vérifiez que `VITE_WS_HOST` est défini dans Render → Environment

### 6. Vérifier le serveur WebSocket sur Render

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Ouvrez le service WebSocket (`ram-ws-backend`)
3. Vérifiez les logs pour voir si des clients se connectent

**Logs attendus quand un client se connecte :**
```
Client connected from IP: [IP]
Client registered: [clientId], role: user
```

**Si vous ne voyez PAS ces logs :**
- ❌ Les clients ne parviennent pas à se connecter au serveur
- Vérifiez que le service WebSocket est "Live" (pas "Sleeping")
- Vérifiez les logs d'erreur du serveur

## 🛠️ Solutions possibles

### Solution 1 : VITE_WS_HOST non défini dans le build

**Symptôme :** `window.VITE_WS_HOST` est `undefined` ou a une valeur incorrecte

**Solution :**
1. Vérifiez Render → Service Client → Environment
2. Assurez-vous que `VITE_WS_HOST=ram-ws-backend.onrender.com` existe
3. **Redéployez** le service client (les variables VITE_* sont injectées au build)

### Solution 2 : Le serveur WebSocket est en veille (Sleeping)

**Symptôme :** Le serveur WebSocket répond lentement ou pas du tout

**Solution :**
1. Ouvrez Render → Service WebSocket
2. Si le statut est "Sleeping", cliquez sur "Manual Deploy" pour le réveiller
3. Ou configurez un "Health Check" pour le garder actif

### Solution 3 : socket.js ne se charge pas

**Symptôme :** Aucun log `[Socket] socket.js loaded` dans la console

**Solution :**
1. Vérifiez que `dist/index.html` contient :
   ```html
   <script type="module" src="./assets/js/socket.js"></script>
   ```
2. Vérifiez que le fichier `dist/assets/js/socket.js` existe sur le serveur
3. Vérifiez les permissions du fichier sur le VPS

### Solution 4 : Erreur CORS ou réseau

**Symptôme :** Erreur de connexion WebSocket dans la console

**Solution :**
1. Vérifiez que l'URL WebSocket est correcte : `wss://ram-ws-backend.onrender.com`
2. Testez la connexion manuellement dans la console :
   ```javascript
   const ws = new WebSocket('wss://ram-ws-backend.onrender.com');
   ws.onopen = () => console.log('Connected!');
   ws.onerror = (e) => console.error('Error:', e);
   ```

## 📋 Checklist de vérification

- [ ] Le fichier `socket.js` se charge (logs dans la console)
- [ ] `window.VITE_WS_HOST` a la bonne valeur
- [ ] La connexion WebSocket s'établit (pas d'erreur dans la console)
- [ ] Le serveur WebSocket est "Live" sur Render
- [ ] Les logs du serveur WebSocket montrent des connexions clients
- [ ] Le build a été fait avec `VITE_WS_HOST` défini
- [ ] Le service client a été redéployé après modification de `VITE_WS_HOST`

## 🔧 Commandes utiles

### Vérifier le build localement
```bash
cd ram-app/client
grep "VITE_WS_HOST" dist/index.html
```

### Vérifier sur le VPS
```bash
ssh user@shipp834.com
cat /var/www/html/couriers.services.co.za/index.html | grep VITE_WS_HOST
```

### Tester la connexion WebSocket manuellement
```bash
# Dans la console du navigateur
const ws = new WebSocket('wss://ram-ws-backend.onrender.com');
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onmessage = (e) => console.log('📨 Message:', e.data);
```

## 📞 Informations à collecter pour le diagnostic

Si le problème persiste, collectez ces informations :

1. **Console du navigateur (client) :**
   - Tous les logs commençant par `[Socket]`
   - Toute erreur WebSocket
   - La valeur de `window.VITE_WS_HOST`

2. **Logs du serveur WebSocket (Render) :**
   - Les dernières lignes de logs
   - Les erreurs éventuelles

3. **Vérifications :**
   - Le statut du service WebSocket sur Render (Live/Sleeping)
   - La valeur de `VITE_WS_HOST` dans Render → Environment
   - Le contenu de `dist/index.html` (ligne avec `VITE_WS_HOST`)

## 🎯 Test rapide

Pour tester rapidement si le problème vient du client ou du serveur :

1. **Ouvrez deux onglets :**
   - Onglet 1 : Panel (`/panel`)
   - Onglet 2 : Application principale (`/track`)

2. **Dans l'onglet 2, ouvrez la console et vérifiez :**
   - Les logs `[Socket]`
   - La connexion WebSocket

3. **Dans l'onglet 1 (panel), vérifiez :**
   - Si un nouveau client apparaît dans la liste
   - Les messages WebSocket reçus

Si le client se connecte mais n'apparaît pas dans le panel, le problème est dans la communication serveur → dashboard.
Si le client ne se connecte pas du tout, le problème est dans la connexion client → serveur.
