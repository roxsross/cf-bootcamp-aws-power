#!/usr/bin/env bash
# ROXS RUNNER · prueba la API del ranking (Lambda + API Gateway)
# Uso: ./scripts/probar-api.sh https://<id>.execute-api.<region>.amazonaws.com
set -u

API="${1:-}"
API="${API%/}"
if [ -z "$API" ]; then
  echo "Uso: $0 https://<id>.execute-api.<region>.amazonaws.com"
  exit 1
fi

echo "1) GET $API/ranking"
curl -s --max-time 10 -w "\n   → HTTP %{http_code}\n" "$API/ranking"

echo
echo "2) POST $API/ranking (puntaje de prueba)"
curl -s --max-time 10 -w "\n   → HTTP %{http_code} (esperado 201)\n" \
  -X POST "$API/ranking" \
  -H "content-type: application/json" \
  -d '{"nombre":"prueba-cli","puntaje":123}'

echo
echo "3) POST con datos inválidos (debe responder 400)"
curl -s --max-time 10 -w "\n   → HTTP %{http_code} (esperado 400)\n" \
  -X POST "$API/ranking" \
  -H "content-type: application/json" \
  -d '{"nombre":"","puntaje":-5}'

echo
echo "4) CORS: el navegador pregunta antes de hacer el POST"
cors=$(curl -s --max-time 10 -o /dev/null -D - -X OPTIONS "$API/ranking" \
  -H "Origin: http://ejemplo.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: " | tr -d '\r' | grep -i '^access-control-allow-origin')
if [ -n "$cors" ]; then
  echo "   ✅ $cors"
else
  echo "   ❌ Sin access-control-allow-origin: configura CORS en la API (origen *, GET y POST, content-type)"
fi
