# 🔍 Vérifier et corriger le déploiement VPS

## 🐛 Problème actuel

- Le site affiche "Site is created successfully!" (page par défaut)
- Le WebSocket essaie de se connecter à `localhost:8090`
- Cela signifie que les fichiers de l'application ne sont pas déployés correctement

## ✅ Solution étape par étape

### Étape 1 : Vérifier les fichiers sur le VPS

Connectez-vous au VPS :

```bash
ssh user@shipp834.com
```

Vérifiez où sont les fichiers :

```bash
# Vérifier le contenu du dossier
ls -la /var/www/html/couriers.services.co.za/

# Vérifier si index.html existe et son contenu
cat /var/www/html/couriers.services.co.za/index.html | head -20
```

**Ce que vous devriez voir** :
- `index.html` (fichier de l'application React, pas la page par défaut)
- Dossier `assets/` avec les fichiers JS/CSS
- Fichier `.htaccess`

**Si vous voyez** :
- Un seul fichier `index.html` avec "Site is created successfully!" → Les fichiers ne sont pas déployés

### Étape 2 : Vérifier la configuration Apache

```bash
# Vérifier la configuration Apache
sudo nano /etc/apache2/sites-available/000-default.conf
# ou
sudo nano /etc/apache2/sites-available/shipp834.com.conf
```

Cherchez la ligne `DocumentRoot` et vérifiez qu'elle pointe vers :
```
DocumentRoot /var/www/html
```

Et vérifiez qu'il y a une configuration pour le sous-dossier ou que les fichiers sont dans le bon endroit.

### Étape 3 : Transférer les fichiers correctement

**Depuis votre machine locale** :

```bash
cd ram-app/client

# Vérifier que le build est à jour
ls -la dist/
# Devrait voir index.html, assets/, .htaccess

# Transférer les fichiers
rsync -avz --delete dist/ user@shipp834.com:/var/www/html/couriers.services.co.za/
```

**OU utiliser le script** :

```bash
cd ram-app/client
./deploy-vps.sh user@shipp834.com /var/www/html/couriers.services.co.za/
```

### Étape 4 : Vérifier après transfert

Sur le VPS :

```bash
# Vérifier que les fichiers sont là
ls -la /var/www/html/couriers.services.co.za/

# Vérifier le contenu de index.html
head -20 /var/www/html/couriers.services.co.za/index.html
```

**Devrait contenir** :
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ...
    <script>
      window.VITE_WS_HOST = "ram-ws-backend.onrender.com";
    </script>
```

**❌ Si vous voyez encore** :
```html
# Congratulations, the site is created successfully!
```
→ Les fichiers n'ont pas été transférés correctement

### Étape 5 : Vérifier les permissions

```bash
sudo chown -R www-data:www-data /var/www/html/couriers.services.co.za/
sudo chmod -R 755 /var/www/html/couriers.services.co.za/
```

### Étape 6 : Vérifier .htaccess

```bash
# Vérifier que .htaccess existe
ls -la /var/www/html/couriers.services.co.za/.htaccess

# Vérifier son contenu
cat /var/www/html/couriers.services.co.za/.htaccess
```

**Devrait contenir** :
```
<IfModule mod_rewrite.c>
  RewriteEngine On
  ...
```

### Étape 7 : Redémarrer Apache

```bash
sudo systemctl restart apache2
# ou
sudo service apache2 restart
```

### Étape 8 : Vérifier mod_rewrite

```bash
# Vérifier que mod_rewrite est activé
sudo a2enmod rewrite
sudo systemctl restart apache2
```

## 🔍 Diagnostic complet

### Vérifier depuis le navigateur

1. **Ouvrez** : `https://shipp834.com/couriers.services.co.za/`
2. **Clic droit** → **Afficher le code source de la page**
3. **Cherchez** : `VITE_WS_HOST`

**✅ Si vous voyez** :
```html
window.VITE_WS_HOST = "ram-ws-backend.onrender.com";
```
→ Les fichiers sont déployés correctement

**❌ Si vous voyez** :
- Rien (page blanche ou page par défaut)
- `window.VITE_WS_HOST = "localhost:8090";`
- `window.VITE_WS_HOST = "%VITE_WS_HOST%";`
→ Les fichiers ne sont pas déployés ou le build est incorrect

### Vérifier les logs Apache

```bash
sudo tail -f /var/log/apache2/error.log
```

Ouvrez le site dans le navigateur et regardez les erreurs dans les logs.

## 🚀 Solution rapide complète

### Sur votre machine locale

```bash
cd ram-app/client

# 1. Vérifier .env
cat .env
# Devrait contenir VITE_WS_HOST=ram-ws-backend.onrender.com

# 2. Rebuild
rm -rf dist
npm run build

# 3. Vérifier le build
grep "VITE_WS_HOST" dist/index.html
# Devrait afficher: window.VITE_WS_HOST = "ram-ws-backend.onrender.com";

# 4. Transférer
rsync -avz --delete dist/ user@shipp834.com:/var/www/html/couriers.services.co.za/
```

### Sur le VPS

```bash
# 1. Vérifier les fichiers
ls -la /var/www/html/couriers.services.co.za/
cat /var/www/html/couriers.services.co.za/index.html | grep VITE_WS_HOST

# 2. Permissions
sudo chown -R www-data:www-data /var/www/html/couriers.services.co.za/
sudo chmod -R 755 /var/www/html/couriers.services.co.za/

# 3. Redémarrer Apache
sudo systemctl restart apache2
```

## 📋 Checklist de vérification

- [ ] `.env` existe dans `ram-app/client/` avec `VITE_WS_HOST=ram-ws-backend.onrender.com`
- [ ] Build effectué après modification de `.env`
- [ ] `dist/index.html` contient `ram-ws-backend.onrender.com` (pas `localhost:8090`)
- [ ] Fichiers transférés sur le VPS dans `/var/www/html/couriers.services.co.za/`
- [ ] `index.html` sur le VPS contient la bonne valeur pour `VITE_WS_HOST`
- [ ] `.htaccess` présent sur le VPS
- [ ] Permissions correctes (www-data:www-data)
- [ ] mod_rewrite activé
- [ ] Apache redémarré

## 🐛 Problèmes courants

### Les fichiers ne se transfèrent pas

**Solution** :
```bash
# Vérifier la connexion SSH
ssh user@shipp834.com

# Vérifier que le dossier existe
ls -la /var/www/html/couriers.services.co.za/

# Si le dossier n'existe pas, le créer
sudo mkdir -p /var/www/html/couriers.services.co.za/
sudo chown -R www-data:www-data /var/www/html/couriers.services.co.za/
```

### Le serveur affiche toujours la page par défaut

**Causes possibles** :
1. Les fichiers sont dans le mauvais dossier
2. Apache ne pointe pas vers le bon dossier
3. Un autre fichier `index.html` prend la priorité

**Solution** :
```bash
# Chercher tous les index.html
find /var/www/html -name "index.html"

# Vérifier lequel est servi
# Regardez la configuration Apache pour voir quel DocumentRoot est utilisé
```

### Le WebSocket essaie toujours de se connecter à localhost

**Cause** : Le build n'a pas été fait avec le bon `.env`

**Solution** :
1. Vérifiez `.env` : `cat ram-app/client/.env`
2. Rebuild : `rm -rf dist && npm run build`
3. Vérifiez : `grep VITE_WS_HOST dist/index.html`
4. Retransférez sur le VPS

---

**Action immédiate** : Transférez les fichiers du dossier `dist/` sur votre VPS dans `/var/www/html/couriers.services.co.za/`
