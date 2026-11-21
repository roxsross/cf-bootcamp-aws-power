#!/bin/bash
# =============================================================
#  ROXS RUNNER en EC2 · Ubuntu Server 24.04 LTS
#  Pega este script en: Lanzar instancia › Detalles avanzados ›
#  Datos de usuario. Se ejecuta una sola vez, al encender la máquina.
#
#  Parte 1 → el juego "instalado a mano" con nginx  → puerto 80
#  Parte 2 → el MISMO juego dentro de un contenedor → puerto 8080
# =============================================================
set -e
REPO="https://github.com/roxsross/roxs-runner-fest.git"

apt-get update -y

# ---------- Parte 1 · servidor web nginx ----------
apt-get install -y nginx git
git clone --depth 1 "$REPO" /opt/roxs-runner
cp -r /opt/roxs-runner/* /var/www/html/
# Etiqueta para saber desde dónde se sirve el juego
sed -i 's/● LIVE ARCADE/● EC2 · NGINX/' /var/www/html/index.html
systemctl enable --now nginx

# ---------- Parte 2 · el mismo juego en un contenedor ----------
apt-get install -y docker.io
mkdir -p /opt/contenedor
cp -r /opt/roxs-runner/* /opt/contenedor/
sed -i 's/● LIVE ARCADE/● CONTENEDOR DOCKER/' /opt/contenedor/index.html
cat > /opt/contenedor/Dockerfile <<'DOCKERFILE'
FROM nginx:alpine
COPY . /usr/share/nginx/html/
DOCKERFILE
docker build -t roxs-runner /opt/contenedor
docker run -d --name roxs-runner -p 8080:80 --restart always roxs-runner
