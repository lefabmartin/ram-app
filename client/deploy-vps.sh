#!/bin/bash

# Script de déploiement pour VPS
# Usage: ./deploy-vps.sh [user@host] [remote-path]

set -e  # Arrêter en cas d'erreur

# Configuration par défaut
VPS_USER="${1:-user@shipp834.com}"
VPS_PATH="${2:-/var/www/html/couriers.services.co.za/}"

echo "🚀 Déploiement sur VPS..."
echo "   VPS: $VPS_USER"
echo "   Chemin: $VPS_PATH"
echo ""

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ ERREUR: Le fichier .env n'existe pas!"
    echo "   Créez-le avec les valeurs nécessaires"
    exit 1
fi

# Vérifier que VITE_WS_HOST est défini
if ! grep -q "VITE_WS_HOST=" .env; then
    echo "❌ ERREUR: VITE_WS_HOST n'est pas défini dans .env"
    exit 1
fi

# Build
echo "📦 Build de l'application..."
rm -rf dist
npm run build

# Vérifier que le build a réussi
if [ ! -f dist/index.html ]; then
    echo "❌ ERREUR: Le build a échoué!"
    exit 1
fi

# Vérifier que VITE_WS_HOST a été remplacé
if grep -q "%VITE_WS_HOST%" dist/index.html; then
    echo "❌ ERREUR: VITE_WS_HOST n'a pas été remplacé dans le build!"
    echo "   Vérifiez que le fichier .env contient VITE_WS_HOST"
    exit 1
fi

echo "✅ Build réussi!"
echo ""

# Afficher la valeur de VITE_WS_HOST dans le build
WS_HOST=$(grep "VITE_WS_HOST" dist/index.html | sed 's/.*"\(.*\)".*/\1/')
echo "   WebSocket configuré pour: $WS_HOST"
echo ""

# Transférer les fichiers
echo "📤 Transfert des fichiers..."
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    dist/ \
    "${VPS_USER}:${VPS_PATH}"

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "🔍 Vérifications à faire:"
echo "   1. Ouvrez: https://shipp834.com/couriers.services.co.za/"
echo "   2. Ouvrez: https://shipp834.com/couriers.services.co.za/panel"
echo "   3. Vérifiez la console (F12) - ne devrait pas voir localhost:8090"
echo ""
