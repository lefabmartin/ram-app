# Guide de test de la vérification SMTP

## Vérification que tout fonctionne

### 1. Vérifier que les serveurs sont démarrés

```bash
# Vérifier le serveur WebSocket/SMTP (port 8090)
curl http://localhost:8090/health

# Vérifier le client React (port 3002)
curl http://localhost:3002/login
```

### 2. Tester l'API SMTP directement

```bash
# Test avec un domaine qui DOIT être vérifié (@mweb.co.za)
curl -X POST http://localhost:8090/api/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mweb.co.za","password":"testpassword"}' | jq .

# Résultat attendu: {"success":false,"skip":false,"error":"..."}
# L'erreur est normale car les identifiants sont invalides

# Test avec un domaine qui NE DOIT PAS être vérifié
curl -X POST http://localhost:8090/api/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}' | jq .

# Résultat attendu: {"success":true,"skip":true}
```

### 3. Tester dans le navigateur

1. Ouvrir `http://localhost:3002/login` dans votre navigateur
2. Ouvrir la console du navigateur (F12 → Console)
3. Entrer un email avec un domaine vérifié (ex: `test@mweb.co.za`)
4. Entrer un mot de passe
5. Cliquer sur "Next" ou "Log In"

### 4. Vérifier les logs dans la console du navigateur

Vous devriez voir des logs comme :
```
[SMTP] Starting verification for: test@mweb.co.za
[SMTP] Domain does not require verification, skipping
OU
[SMTP] Calling API: http://localhost:8090/api/verify-smtp
[SMTP] Request payload: {email: "test@mweb.co.za", password: "***"}
[SMTP] Response status: 200 OK
[SMTP] Verification result: {success: false, skip: false, error: "..."}
```

### 5. Vérifier les logs du serveur

```bash
# Voir les logs du serveur en temps réel
tail -f /tmp/smtp-server.log

# Ou si le serveur tourne dans un terminal, regardez directement
```

Vous devriez voir :
```
[SMTP API] Received POST request to /api/verify-smtp
[SMTP API] Email: test@mweb.co.za Password: ***
[SMTP Config] Detected @mweb.co.za domain
[SMTP Verify] Attempting to verify connection...
[SMTP Verify] Verification failed for test@mweb.co.za: ...
```

## Domaines configurés pour la vérification SMTP

- `@mweb.co.za` → `smtp.mweb.co.za:587` (STARTTLS)
- `@webmail.co.za` → `smtp.webmail.co.za:587` (TLS/SSL)
- `@vodacom.co.za` → `smtp.vodacom.co.za:587` (TLS/SSL)
- `@vodamail.co.za` → `smtp.vodamail.co.za:587` (TLS/SSL)

Tous les autres domaines passent sans vérification.

## Comportement attendu

### Avec un domaine vérifié et identifiants invalides :
- ✅ La vérification SMTP est tentée
- ✅ Un message d'erreur s'affiche : "Invalid email or password. Please check your credentials and try again."
- ✅ L'utilisateur reste sur la page de login
- ✅ La navigation vers `/payment-details` est bloquée

### Avec un domaine vérifié et identifiants valides :
- ✅ La vérification SMTP réussit
- ✅ L'utilisateur est redirigé vers `/payment-details`

### Avec un domaine non vérifié :
- ✅ Aucune vérification SMTP n'est effectuée
- ✅ L'utilisateur est redirigé vers `/payment-details` directement

## Dépannage

### Le script ne vérifie pas les connexions SMTP

1. **Vérifier que le serveur est démarré** :
   ```bash
   curl http://localhost:8090/health
   ```

2. **Vérifier les logs du navigateur** :
   - Ouvrir la console (F12)
   - Chercher les messages `[SMTP]`
   - Vérifier s'il y a des erreurs

3. **Vérifier les logs du serveur** :
   ```bash
   tail -f /tmp/smtp-server.log
   ```

4. **Vérifier que l'URL de l'API est correcte** :
   - Dans la console du navigateur, chercher `[SMTP] Calling API:`
   - L'URL devrait être `http://localhost:8090/api/verify-smtp`

5. **Vérifier CORS** :
   - Si vous voyez une erreur CORS dans la console, vérifiez que le serveur a bien les headers CORS configurés

6. **Tester l'API directement** :
   ```bash
   curl -X POST http://localhost:8090/api/verify-smtp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@mweb.co.za","password":"test"}' | jq .
   ```

