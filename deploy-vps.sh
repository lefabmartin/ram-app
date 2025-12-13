#!/bin/bash

# Script de déploiement pour VPS
# Usage: ./deploy-vps.sh [user@host] [remote_path]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_USER_HOST=${1:-"user@your-vps-ip"}
REMOTE_PATH=${2:-"/var/www/html"}
BACKUP_DIR="/var/backups/ram-app"
DATE=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}=== Script de déploiement RAM App sur VPS ===${NC}\n"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo -e "${RED}Erreur: Ce script doit être exécuté depuis la racine du projet ram-app${NC}"
    exit 1
fi

# Étape 1: Build du client
echo -e "${YELLOW}[1/5] Build du client React...${NC}"
cd client
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
fi
npm run build
cd ..

# Étape 2: Créer une archive
echo -e "${YELLOW}[2/5] Création de l'archive...${NC}"
tar -czf dist.tar.gz -C client/dist .

# Étape 3: Upload sur le VPS
echo -e "${YELLOW}[3/5] Upload sur le VPS...${NC}"
scp dist.tar.gz ${VPS_USER_HOST}:/tmp/

# Étape 4: Déploiement sur le VPS
echo -e "${YELLOW}[4/5] Déploiement sur le VPS...${NC}"
ssh ${VPS_USER_HOST} << EOF
    # Créer le répertoire de backup
    sudo mkdir -p ${BACKUP_DIR}
    
    # Backup de l'ancienne version
    if [ -d "${REMOTE_PATH}" ] && [ "\$(ls -A ${REMOTE_PATH})" ]; then
        echo "Création du backup..."
        sudo tar -czf ${BACKUP_DIR}/dist_backup_${DATE}.tar.gz -C ${REMOTE_PATH} .
    fi
    
    # Extraire la nouvelle version
    echo "Extraction de la nouvelle version..."
    sudo mkdir -p ${REMOTE_PATH}
    sudo tar -xzf /tmp/dist.tar.gz -C ${REMOTE_PATH}
    
    # Définir les permissions
    echo "Configuration des permissions..."
    sudo chown -R www-data:www-data ${REMOTE_PATH}
    sudo chmod -R 755 ${REMOTE_PATH}
    
    # Nettoyer
    rm /tmp/dist.tar.gz
    
    # Redémarrer Apache (ou Nginx si vous l'utilisez)
    echo "Redémarrage du serveur web..."
    # Pour Apache :
    sudo systemctl reload apache2
    # Pour Nginx, décommentez la ligne suivante :
    # sudo systemctl reload nginx
    
    echo "Déploiement terminé !"
EOF

# Étape 5: Nettoyer localement
echo -e "${YELLOW}[5/5] Nettoyage...${NC}"
rm dist.tar.gz

echo -e "\n${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}L'application est maintenant disponible sur votre VPS${NC}"

