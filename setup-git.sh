#!/bin/bash

# Script pour configurer Git et pousser le code sur GitHub/GitLab

echo "🚀 Configuration Git pour RAM App"
echo "=================================="
echo ""

# Vérifier si Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé. Installez Git d'abord."
    exit 1
fi

# Configuration Git (si pas déjà configuré)
if [ -z "$(git config user.name)" ]; then
    echo "📝 Configuration de Git..."
    read -p "Entrez votre nom (pour les commits Git): " GIT_NAME
    git config user.name "$GIT_NAME"
fi

if [ -z "$(git config user.email)" ]; then
    read -p "Entrez votre email (pour les commits Git): " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

echo ""
echo "✅ Configuration Git actuelle:"
echo "   Nom: $(git config user.name)"
echo "   Email: $(git config user.email)"
echo ""

# Demander le type de dépôt
echo "Choisissez votre plateforme:"
echo "1) GitHub"
echo "2) GitLab"
read -p "Votre choix (1 ou 2): " PLATFORM

if [ "$PLATFORM" != "1" ] && [ "$PLATFORM" != "2" ]; then
    echo "❌ Choix invalide"
    exit 1
fi

# Demander les informations du dépôt
echo ""
read -p "Entrez votre nom d'utilisateur GitHub/GitLab: " USERNAME
read -p "Entrez le nom du dépôt (ex: ram-app): " REPO_NAME

if [ "$PLATFORM" == "1" ]; then
    REPO_URL="https://github.com/$USERNAME/$REPO_NAME.git"
    PLATFORM_NAME="GitHub"
else
    REPO_URL="https://gitlab.com/$USERNAME/$REPO_NAME.git"
    PLATFORM_NAME="GitLab"
fi

echo ""
echo "📋 Résumé:"
echo "   Plateforme: $PLATFORM_NAME"
echo "   URL du dépôt: $REPO_URL"
echo ""
read -p "Confirmez-vous ces informations? (o/n): " CONFIRM

if [ "$CONFIRM" != "o" ] && [ "$CONFIRM" != "O" ]; then
    echo "❌ Annulé"
    exit 1
fi

# Vérifier si le dépôt distant existe déjà
if git remote get-url origin &> /dev/null; then
    echo ""
    echo "⚠️  Un dépôt distant 'origin' existe déjà."
    read -p "Voulez-vous le remplacer? (o/n): " REPLACE
    if [ "$REPLACE" == "o" ] || [ "$REPLACE" == "O" ]; then
        git remote remove origin
    else
        echo "❌ Annulé"
        exit 1
    fi
fi

# Ajouter le dépôt distant
echo ""
echo "🔗 Ajout du dépôt distant..."
git remote add origin "$REPO_URL"

# Vérifier la branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "📌 Renommage de la branche en 'main'..."
    git branch -M main
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📝 IMPORTANT: Avant de pousser le code:"
echo ""
if [ "$PLATFORM" == "1" ]; then
    echo "1. Créez le dépôt sur GitHub:"
    echo "   👉 https://github.com/new"
    echo ""
    echo "2. Nom du dépôt: $REPO_NAME"
    echo "3. NE COCHEZ PAS 'Initialize with README'"
    echo "4. Cliquez sur 'Create repository'"
    echo ""
    echo "5. Pour l'authentification, vous aurez besoin d'un Personal Access Token:"
    echo "   👉 https://github.com/settings/tokens"
    echo "   - Cliquez sur 'Generate new token (classic)'"
    echo "   - Donnez-lui un nom (ex: 'RAM App')"
    echo "   - Cochez 'repo' dans les permissions"
    echo "   - Cliquez sur 'Generate token'"
    echo "   - COPIEZ LE TOKEN (vous ne le reverrez plus!)"
else
    echo "1. Créez le projet sur GitLab:"
    echo "   👉 https://gitlab.com/projects/new"
    echo ""
    echo "2. Nom du projet: $REPO_NAME"
    echo "3. NE COCHEZ PAS 'Initialize repository with a README'"
    echo "4. Cliquez sur 'Create project'"
    echo ""
    echo "5. Pour l'authentification, vous aurez besoin d'un Personal Access Token:"
    echo "   👉 https://gitlab.com/-/user_settings/personal_access_tokens"
    echo "   - Donnez-lui un nom (ex: 'RAM App')"
    echo "   - Cochez 'write_repository' dans les permissions"
    echo "   - Cliquez sur 'Create personal access token'"
    echo "   - COPIEZ LE TOKEN (vous ne le reverrez plus!)"
fi

echo ""
read -p "Avez-vous créé le dépôt sur $PLATFORM_NAME? (o/n): " REPO_CREATED

if [ "$REPO_CREATED" != "o" ] && [ "$REPO_CREATED" != "O" ]; then
    echo ""
    echo "⏸️  Créez d'abord le dépôt, puis relancez ce script ou exécutez:"
    echo "   git push -u origin main"
    exit 0
fi

echo ""
echo "🚀 Poussage du code sur $PLATFORM_NAME..."
echo ""
echo "⚠️  Lorsqu'on vous demandera votre mot de passe, utilisez votre TOKEN (pas votre mot de passe)"
echo ""

# Pousser le code
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Succès! Votre code a été poussé sur $PLATFORM_NAME!"
    echo "   👉 $REPO_URL"
else
    echo ""
    echo "❌ Erreur lors du push. Vérifiez:"
    echo "   1. Que le dépôt existe bien sur $PLATFORM_NAME"
    echo "   2. Que vous utilisez un Personal Access Token (pas votre mot de passe)"
    echo "   3. Que le token a les bonnes permissions"
fi

