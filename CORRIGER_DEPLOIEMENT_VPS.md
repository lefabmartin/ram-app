# 🔧 Corriger le déploiement VPS

## 🐛 Problèmes identifiés

1. **Page par défaut du serveur affichée** → Les fichiers ne sont pas déployés correctement
2. **WebSocket essaie de se connecter à `localhost:8090`** → `VITE_WS_HOST` n'est pas configuré dans le build

## ✅ Solution étape par étape

### Étape 1 : Configurer le fichier .env

**⚠️ IMPORTANT** : Les variables d'environnement doivent être définies **AVANT** le build.

```bash
cd ram-app/client
nano .env
```

Ajoutez ces lignes dans `.env` :

```env
# Base path (optionnel - détection automatique fonctionne)
VITE_BASE_PATH=/couriers.services.co.za/

# Serveur WebSocket (REQUIS - remplacez par votre serveur)
VITE_WS_HOST=ram-ws-backend.onrender.com

# Telegram (REQUIS)
VITE_TELEGRAM_TOKEN=votre_token_bot_telegram
VITE_TELEGRAM_CHAT_ID=votre_chat_id_telegram
```

**⚠️ IMPORTANT** :
- `VITE_WS_HOST` doit être **sans** `wss://` ou `ws://`
- Exemple correct : `ram-ws-backend.onrender.com`
- Exemple incorrect : `wss://ram-ws-backend.onrender.com`

### Étape 2 : Vérifier que le fichier .env existe

```bash
cd ram-app/client
cat .env
```

Vous devriez voir toutes les variables listées ci-dessus.

### Étape 3 : Nettoyer et rebuild

```bash
cd ram-app/client

# Nettoyer les anciens builds
rm -rf dist

# Installer les dépendances (si nécessaire)
npm install

# Build avec les variables d'environnement
npm run build
```

### Étape 4 : Vérifier le build

Vérifiez que `VITE_WS_HOST` a été remplacé dans `dist/index.html` :

```bash
cd ram-app/client
grep "VITE_WS_HOST" dist/index.html
```

**Résultat attendu** :
```html
window.VITE_WS_HOST = "ram-ws-backend.onrender.com";
```

**❌ Si vous voyez encore `%VITE_WS_HOST%`** :
- Le fichier `.env` n'existe pas ou n'est pas au bon endroit
- Les variables ne sont pas chargées
- Rebuild après avoir créé/corrigé `.env`

### Étape 5 : Transférer les fichiers sur le VPS

```bash
cd ram-app/client

# Méthode 1 : SCP
scp -r dist/* user@shipp834.com:/var/www/html/couriers.services.co.za/

# Méthode 2 : RSYNC (recommandé)
rsync -avz --delete dist/ user@shipp834.com:/var/www/html/couriers.services.co.za/
```

**⚠️ IMPORTANT** :
- Transférez le **contenu** du dossier `dist/`, pas le dossier `dist/` lui-même
- Utilisez `dist/*` ou `dist/` selon votre méthode de transfert

### Étape 6 : Vérifier les fichiers sur le VPS

Connectez-vous au VPS :

```bash
ssh user@shipp834.com
cd /var/www/html/couriers.services.co.za/
ls -la
```

Vous devriez voir :
```
index.html
assets/
.htaccess
(autres fichiers)
```

**Vérifiez que `index.html` contient la bonne valeur** :

```bash
grep "VITE_WS_HOST" index.html
```

Devrait afficher :
```html
window.VITE_WS_HOST = "ram-ws-backend.onrender.com";
```

### Étape 7 : Vérifier les permissions

```bash
sudo chown -R www-data:www-data /var/www/html/couriers.services.co.za/
sudo chmod -R 755 /var/www/html/couriers.services.co.za/
```

### Étape 8 : Vérifier la configuration Apache

Assurez-vous que `.htaccess` est présent et que mod_rewrite est activé :

```bash
# Vérifier que .htaccess existe
ls -la /var/www/html/couriers.services.co.za/.htaccess

# Activer mod_rewrite si nécessaire
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Étape 9 : Tester

1. **Ouvrez** : `https://shipp834.com/couriers.services.co.za/`
   - Devrait afficher l'application React (pas la page par défaut)

2. **Ouvrez** : `https://shipp834.com/couriers.services.co.za/panel`
   - Devrait afficher le Dashboard

3. **Ouvrez la console** (F12) :
   - Ne devrait **PAS** voir `ws://localhost:8090`
   - Devrait voir `wss://ram-ws-backend.onrender.com` (ou votre serveur WebSocket)

## 🔍 Vérification complète

### Checklist

- [ ] Fichier `.env` créé dans `ram-app/client/`
- [ ] `VITE_WS_HOST` configuré dans `.env` (sans protocole)
- [ ] Build effectué après création de `.env`
- [ ] `dist/index.html` contient la bonne valeur pour `VITE_WS_HOST`
- [ ] Fichiers transférés sur le VPS
- [ ] `index.html` sur le VPS contient la bonne valeur
- [ ] `.htaccess` présent sur le VPS
- [ ] Permissions correctes
- [ ] mod_rewrite activé (Apache)

## 🐛 Dépannage

### Le site affiche toujours la page par défaut

**Causes possibles** :
1. Les fichiers ne sont pas dans le bon dossier
2. Le serveur web ne pointe pas vers le bon dossier
3. `index.html` n'est pas présent

**Solution** :
```bash
# Vérifier où sont les fichiers
ls -la /var/www/html/couriers.services.co.za/

# Vérifier la configuration Apache
sudo nano /etc/apache2/sites-available/000-default.conf
# Cherchez DocumentRoot et vérifiez qu'il pointe vers le bon dossier
```

### Le WebSocket essaie toujours de se connecter à localhost

**Cause** : `VITE_WS_HOST` n'a pas été remplacé dans le build.

**Solution** :
1. Vérifiez que `.env` existe : `cat ram-app/client/.env`
2. Vérifiez que `VITE_WS_HOST` est défini
3. Supprimez `dist/` et rebuild : `rm -rf dist && npm run build`
4. Vérifiez `dist/index.html` : `grep VITE_WS_HOST dist/index.html`
5. Retransférez les fichiers sur le VPS

### Les assets ne se chargent pas (404)

**Cause** : Le base path n'est pas correctement configuré.

**Solution** :
1. Vérifiez `VITE_BASE_PATH` dans `.env`
2. Rebuild
3. Vérifiez les chemins dans `dist/index.html`

## 📝 Exemple complet de .env

```env
# Base path pour le déploiement
VITE_BASE_PATH=/couriers.services.co.za/

# Serveur WebSocket (sans protocole)
VITE_WS_HOST=ram-ws-backend.onrender.com

# Telegram Bot
VITE_TELEGRAM_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
VITE_TELEGRAM_CHAT_ID=123456789
```

## 🚀 Script de déploiement rapide

Créez un script `deploy.sh` :

```bash
#!/bin/bash

# Configuration
VPS_USER="user"
VPS_HOST="shipp834.com"
VPS_PATH="/var/www/html/couriers.services.co.za/"

# Build
cd ram-app/client
echo "Building..."
npm run build

# Vérifier le build
if grep -q "%VITE_WS_HOST%" dist/index.html; then
    echo "❌ ERREUR: VITE_WS_HOST n'a pas été remplacé!"
    echo "Vérifiez que le fichier .env existe et contient VITE_WS_HOST"
    exit 1
fi

# Transférer
echo "Transferring files..."
rsync -avz --delete dist/ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}

echo "✅ Déploiement terminé!"
```

Utilisation :
```bash
chmod +x deploy.sh
./deploy.sh
```

---

**Résumé** : Le problème principal est que `VITE_WS_HOST` doit être défini dans `.env` **AVANT** le build. Après avoir créé `.env` et rebuild, retransférez les fichiers sur le VPS.
