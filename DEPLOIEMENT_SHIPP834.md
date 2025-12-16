# Guide de déploiement sur shipp834.com

## Problème résolu

Le panel ne s'affichait pas correctement car le serveur web ne redirigeait pas les routes React Router vers `index.html`.

## Solution

### 1. Structure des fichiers sur le serveur

Les fichiers du dossier `client/dist/` doivent être déployés dans :
```
/var/www/html/couriers.services.co.za/
```

Ou selon votre configuration Apache, dans le répertoire correspondant au sous-dossier `/couriers.services.co.za/`.

### 2. Fichiers à déployer

Tous les fichiers du dossier `client/dist/` doivent être copiés dans le répertoire du serveur, **y compris le fichier `.htaccess`**.

Structure attendue sur le serveur :
```
/var/www/html/couriers.services.co.za/
├── .htaccess          ← IMPORTANT : Ce fichier doit être présent
├── index.html
├── vite.svg
└── assets/
    ├── index-*.js
    ├── index-*.css
    ├── js/
    │   └── socket.js
    └── images/
        └── ...
```

### 3. Configuration Apache

#### Option A : Utiliser le fichier .htaccess (recommandé)

Assurez-vous que votre configuration Apache permet l'utilisation de `.htaccess` :

```apache
<Directory /var/www/html/couriers.services.co.za>
    Options -Indexes +FollowSymLinks
    AllowOverride All    ← IMPORTANT : Doit être "All"
    Require all granted
</Directory>
```

#### Option B : Configuration dans le VirtualHost

Si vous préférez configurer directement dans Apache (sans .htaccess), utilisez le fichier `apache-config-couriers.conf` fourni.

### 4. Vérification

Après le déploiement, vérifiez que :

1. ✅ Le fichier `.htaccess` est présent dans `/var/www/html/couriers.services.co.za/`
2. ✅ Les permissions sont correctes (lecture pour Apache)
3. ✅ Apache a `AllowOverride All` pour ce répertoire
4. ✅ Le module `mod_rewrite` est activé : `sudo a2enmod rewrite`

### 5. Test

- Site principal : https://shipp834.com/couriers.services.co.za/
- Panel : https://shipp834.com/couriers.services.co.za/panel

### 6. Commandes utiles

```bash
# Vérifier que mod_rewrite est activé
apache2ctl -M | grep rewrite

# Activer mod_rewrite si nécessaire
sudo a2enmod rewrite
sudo systemctl restart apache2

# Vérifier les logs en cas d'erreur
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/couriers-services-error.log
```

### 7. Dépannage

Si le panel ne s'affiche toujours pas :

1. Vérifiez les logs Apache : `sudo tail -f /var/log/apache2/error.log`
2. Vérifiez que le fichier `.htaccess` est bien présent et lisible
3. Vérifiez que `AllowOverride All` est configuré pour le répertoire
4. Vérifiez que `mod_rewrite` est activé
5. Testez avec `curl -I https://shipp834.com/couriers.services.co.za/panel` pour voir les en-têtes HTTP

## Notes importantes

- Le fichier `.htaccess` est automatiquement copié dans `dist/` lors du build
- Le base path `/couriers.services.co.za/` est configuré dans `vite.config.js`
- React Router gère le routing côté client une fois que `index.html` est chargé

