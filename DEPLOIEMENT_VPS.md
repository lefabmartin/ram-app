# 🚀 Guide de déploiement sur VPS

## 📋 Prérequis

- VPS avec Apache ou Nginx installé
- Node.js et npm installés sur le VPS
- Accès SSH au VPS
- Domaine configuré (optionnel)

## 🎯 Configuration pour votre cas

**URLs souhaitées** :
- Site : `https://shipp834.com/couriers.services.co.za/`
- Panel : `https://shipp834.com/couriers.services.co.za/panel`

## 📦 Étapes de déploiement

### 1. Préparer le build localement

```bash
cd ram-app/client

# Créer/modifier .env si nécessaire
# (Optionnel - la détection automatique fonctionne)
echo "VITE_BASE_PATH=/couriers.services.co.za/" > .env
echo "VITE_WS_HOST=votre-serveur-websocket.onrender.com" >> .env

# Build l'application
npm run build
```

### 2. Transférer les fichiers sur le VPS

```bash
# Depuis votre machine locale
cd ram-app/client
scp -r dist/* user@shipp834.com:/var/www/html/couriers.services.co.za/
```

Ou utilisez FTP/SFTP pour transférer le contenu du dossier `dist/`.

### 3. Structure sur le VPS

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

### 4. Configuration Apache

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

### 5. Configuration Nginx (si utilisé)

Créez/modifiez la configuration :

```nginx
server {
    listen 80;
    server_name shipp834.com;

    root /var/www/html;
    index index.html;

    location /couriers.services.co.za/ {
        alias /var/www/html/couriers.services.co.za/;
        try_files $uri $uri/ /couriers.services.co.za/index.html;
    }
}
```

Puis rechargez Nginx :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Configuration SSL/HTTPS (recommandé)

### Avec Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d shipp834.com
```

Ou pour Nginx :
```bash
sudo certbot --nginx -d shipp834.com
```

## ✅ Vérification

1. **Testez le site principal** :
   ```
   https://shipp834.com/couriers.services.co.za/
   ```
   Devrait rediriger vers `/track`

2. **Testez le panel** :
   ```
   https://shipp834.com/couriers.services.co.za/panel
   ```
   Devrait afficher le Dashboard

3. **Vérifiez la console** (F12) :
   - Pas d'erreurs 404
   - WebSocket se connecte correctement

## 🔄 Mise à jour

Pour mettre à jour l'application :

```bash
# 1. Build localement
cd ram-app/client
npm run build

# 2. Transférer les nouveaux fichiers
scp -r dist/* user@shipp834.com:/var/www/html/couriers.services.co.za/

# Ou utiliser Git sur le VPS
```

## 📝 Configuration avec Git (recommandé)

### Sur le VPS

```bash
# Cloner le repository
cd /var/www/html
git clone https://github.com/lefabmartin/ram-app.git
cd ram-app/client

# Installer les dépendances
npm install

# Configurer .env
nano .env
# Ajouter :
# VITE_BASE_PATH=/couriers.services.co.za/
# VITE_WS_HOST=votre-serveur-websocket.onrender.com

# Build
npm run build

# Copier les fichiers dans le dossier de déploiement
cp -r dist/* /var/www/html/couriers.services.co.za/
```

### Mise à jour avec Git

```bash
cd /var/www/html/ram-app
git pull
cd client
npm install
npm run build
cp -r dist/* /var/www/html/couriers.services.co.za/
```

## 🔐 Variables d'environnement importantes

Dans `.env` (ram-app/client/.env) :

```env
# Base path (optionnel - détection automatique)
VITE_BASE_PATH=/couriers.services.co.za/

# Serveur WebSocket (requis)
VITE_WS_HOST=ram-ws-backend.onrender.com

# Telegram (requis)
VITE_TELEGRAM_TOKEN=votre_token
VITE_TELEGRAM_CHAT_ID=votre_chat_id
```

## 🐛 Dépannage

### Erreur 404 sur les routes

**Solution** : Vérifiez que `.htaccess` est présent et que mod_rewrite est activé.

### Les assets ne se chargent pas

**Solution** : Vérifiez que `VITE_BASE_PATH` est correctement configuré dans `.env`.

### Le WebSocket ne se connecte pas

**Solution** : Vérifiez que `VITE_WS_HOST` est configuré et que le serveur WebSocket est accessible.

## 📚 Ressources

- Guide de configuration du base path : `CONFIGURER_BASE_PATH.md`
- Guide WebSocket : `CONFIGURER_WEBSOCKET_RENDER.md`

---

**Note** : Le code détecte automatiquement le base path, donc même sans configuration explicite, ça devrait fonctionner si vous déployez dans le bon dossier.
