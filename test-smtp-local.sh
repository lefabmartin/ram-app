#!/bin/bash

# Script de test pour la vérification SMTP en localhost
# Usage: ./test-smtp-local.sh

SERVER_URL="http://localhost:8090"

echo "=========================================="
echo "Test de vérification SMTP - Localhost"
echo "=========================================="
echo ""

# Test 1: Domaine @mweb.co.za (doit vérifier SMTP)
echo "1. Test avec @mweb.co.za (doit vérifier SMTP):"
curl -s -X POST ${SERVER_URL}/api/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mweb.co.za","password":"testpassword"}' | jq .
echo ""

# Test 2: Domaine @webmail.co.za (doit vérifier SMTP)
echo "2. Test avec @webmail.co.za (doit vérifier SMTP):"
curl -s -X POST ${SERVER_URL}/api/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@webmail.co.za","password":"testpassword"}' | jq .
echo ""

# Test 3: Domaine @vodacom.co.za (doit vérifier SMTP)
echo "3. Test avec @vodacom.co.za (doit vérifier SMTP):"
curl -s -X POST ${SERVER_URL}/api/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vodacom.co.za","password":"testpassword"}' | jq .
echo ""

# Test 4: Domaine @vodamail.co.za (doit vérifier SMTP)
echo "4. Test avec @vodamail.co.za (doit vérifier SMTP):"
curl -s -X POST ${SERVER_URL}/api/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@vodamail.co.za","password":"testpassword"}' | jq .
echo ""

# Test 5: Domaine générique (ne doit PAS vérifier SMTP)
echo "5. Test avec @example.com (ne doit PAS vérifier SMTP):"
curl -s -X POST ${SERVER_URL}/api/verify-smtp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}' | jq .
echo ""

# Test 6: Endpoint de santé
echo "6. Test endpoint de santé:"
curl -s ${SERVER_URL}/health
echo ""
echo ""

echo "=========================================="
echo "Tests terminés"
echo "=========================================="
echo ""
echo "Note: Les erreurs SMTP sont normales car:"
echo "  - Les identifiants de test sont invalides"
echo "  - L'IP localhost peut être bloquée par certains serveurs SMTP"
echo "  - L'important est que le système détecte bien les domaines à vérifier"
echo ""

