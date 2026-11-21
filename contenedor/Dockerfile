# ROXS RUNNER dentro de un contenedor: nginx + los archivos del juego
# Uso (desde la carpeta juego/):
#   docker build -t roxs-runner -f ../contenedor/Dockerfile .
#   docker run -p 8080:80 roxs-runner
FROM nginx:alpine
COPY . /usr/share/nginx/html/
