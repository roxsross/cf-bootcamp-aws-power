#!/usr/bin/env bash
# ROXS RUNNER · prueba la EC2: nginx (puerto 80) y contenedor (puerto 8080)
# Uso: ./scripts/probar-web.sh <IP>
#      ./scripts/probar-web.sh localhost   (para probar el contenedor en tu compu)
set -u

HOST="${1:-}"
if [ -z "$HOST" ]; then
  echo "Uso: $0 <IP-publica-de-la-EC2>"
  exit 1
fi

fallos=0

probar() {
  local nombre="$1" url="$2" etiqueta="$3"
  local html
  if ! html=$(curl -s --max-time 5 "$url"); then
    echo "❌ $nombre ($url): no responde. ¿Puerto abierto en el grupo de seguridad? ¿Terminó el script?"
    fallos=$((fallos + 1))
    return
  fi
  if echo "$html" | grep -q "ROXS"; then
    if echo "$html" | grep -q "$etiqueta"; then
      echo "✅ $nombre ($url): responde y muestra \"$etiqueta\""
    else
      echo "✅ $nombre ($url): responde (etiqueta: $(echo "$html" | grep -o '● [^<]*' | head -1))"
    fi
  else
    echo "⚠️  $nombre ($url): responde, pero no es el juego (¿página por defecto de nginx?)"
    fallos=$((fallos + 1))
  fi
}

probar "EC2 · nginx" "http://$HOST" "● EC2 · NGINX"
probar "Contenedor Docker" "http://$HOST:8080" "● CONTENEDOR DOCKER"

exit "$fallos"
