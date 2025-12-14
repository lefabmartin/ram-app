# 🔧 Configurer le Base Path pour déploiement VPS

## 📋 Situation

Vous voulez déployer votre application sur un VPS avec un chemin personnalisé :
- **Site principal** : `https://shipp834.com/couriers.services.co.za/`
- **Panel** : `https://shipp834.com/couriers.services.co.za/panel`

## ✅ Solution

Le code détecte automatiquement le base path, mais vous pouvez aussi le configurer manuellement avec une variable d'environnement.

## 🎯 Option 1 : Détection automatique (recommandé)

Le code détecte automatiquement le base path depuis l'URL. **Aucune configuration nécessaire** si vous déployez dans un sous-dossier.

**Comment ça fonctionne** :
- Si vous accédez à `https://shipp834.com/couriers.services.co.za/panel`
- Le code détecte automatiquement que le base path est `/couriers.services.co.za`
- Toutes les routes fonctionnent automatiquement

## 🔧 Option 2 : Configuration manuelle avec variable d'environnement

Si vous préférez définir explicitement le base path :

### 1. Créer/modifier le fichier `.env` dans `ram-app/client/`

```bash
cd ram-app/client
nano .env
```

### 2. Ajouter la variable `VITE_BASE_PATH`

```env
# Base path pour le déploiement
# Exemples :
#   /couriers.services.co.za/  (pour sous-dossier)
#   /  (pour domaine racine)
#   ./  (pour chemins relatifs, par défaut)

VITE_BASE_PATH=/couriers.services.co.za/
```

**⚠️ Important** :
- Le chemin doit commencer par `/` et se terminer par `/`
- Exemples valides :
  - `/couriers.services.co.za/` ✅
  - `/mon-app/` ✅
  - `/` ✅ (pour domaine racine)

### 3. Rebuild l'application

```bash
cd ram-app/client
npm run build
```

## 📦 Déploiement sur VPS

### Structure des fichiers sur le VPS

```
/var/www/html/couriers.services.co.za/
├── index.html
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
└── .htaccess
```

### Configuration Apache/Nginx

#### Apache (.htaccess)

Le fichier `.htaccess` est déjà inclus dans le build. Assurez-vous qu'il est présent dans le dossier de déploiement.

#### Nginx

Si vous utilisez Nginx, ajoutez cette configuration :

```nginx
location /couriers.services.co.za/ {
    root /var/www/html;
    try_files $uri $uri/ /couriers.services.co.za/index.html;
}
```

## 🔄 Changer le base path plus tard

### Méthode 1 : Détection automatique (recommandé)

**Aucune action nécessaire** - Le code détecte automatiquement le nouveau chemin.

### Méthode 2 : Variable d'environnement

1. **Modifier `.env`** :
   ```env
   VITE_BASE_PATH=/nouveau-chemin/
   ```

2. **Rebuild** :
   ```bash
   npm run build
   ```

3. **Redéployer** sur le VPS

## 📝 Exemples de configuration

### Exemple 1 : Sous-dossier spécifique

```env
VITE_BASE_PATH=/couriers.services.co.za/
```

**URLs résultantes** :
- Site : `https://shipp834.com/couriers.services.co.za/`
- Panel : `https://shipp834.com/couriers.services.co.za/panel`

### Exemple 2 : Domaine racine

```env
VITE_BASE_PATH=/
```

**URLs résultantes** :
- Site : `https://shipp834.com/`
- Panel : `https://shipp834.com/panel`

### Exemple 3 : Autre sous-dossier

```env
VITE_BASE_PATH=/mon-app/
```

**URLs résultantes** :
- Site : `https://shipp834.com/mon-app/`
- Panel : `https://shipp834.com/mon-app/panel`

## ✅ Vérification

Après le déploiement, vérifiez :

1. **Le site principal fonctionne** :
   - `https://shipp834.com/couriers.services.co.za/` → Redirige vers `/track`

2. **Le panel fonctionne** :
   - `https://shipp834.com/couriers.services.co.za/panel` → Affiche le Dashboard

3. **Les routes fonctionnent** :
   - `https://shipp834.com/couriers.services.co.za/login`
   - `https://shipp834.com/couriers.services.co.za/payment-details`
   - etc.

4. **Les assets se chargent** :
   - Ouvrez la console (F12)
   - Vérifiez qu'il n'y a pas d'erreurs 404 pour les fichiers JS/CSS

## 🐛 Dépannage

### Les assets ne se chargent pas (404)

**Problème** : Le base path n'est pas correctement configuré.

**Solution** :
1. Vérifiez la variable `VITE_BASE_PATH` dans `.env`
2. Assurez-vous qu'elle se termine par `/`
3. Rebuild : `npm run build`
4. Vérifiez que les chemins dans `dist/index.html` sont corrects

### Les routes ne fonctionnent pas

**Problème** : Le serveur web ne redirige pas vers `index.html`.

**Solution** :
1. Vérifiez que `.htaccess` est présent (Apache)
2. Vérifiez la configuration Nginx (si utilisé)
3. Assurez-vous que le serveur redirige toutes les routes vers `index.html`

### Le panel ne se connecte pas au WebSocket

**Problème** : `VITE_WS_HOST` n'est pas configuré pour le nouveau domaine.

**Solution** :
1. Configurez `VITE_WS_HOST` dans `.env` avec l'URL du serveur WebSocket
2. Rebuild et redéployez

## 📚 Résumé

- ✅ **Détection automatique** : Fonctionne sans configuration
- ✅ **Configuration manuelle** : Utilisez `VITE_BASE_PATH` dans `.env`
- ✅ **Changement facile** : Modifiez `.env` et rebuild
- ✅ **Compatible** : Fonctionne avec Apache et Nginx

---

**Pour votre cas spécifique** :
- Base path : `/couriers.services.co.za/`
- Le code détectera automatiquement ce chemin
- Aucune configuration supplémentaire nécessaire si vous déployez dans ce dossier
