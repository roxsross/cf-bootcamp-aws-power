// ROXS RUNNER · API del ranking en AWS Lambda (Node.js 24)
// Para una API HTTP de API Gateway (formato de payload 2.0).
// No necesitas saber programar para usarla: léela como una receta.
// Cada "case" es una ruta de la API (un plato del menú).

// El ranking vive en memoria: si Lambda crea un entorno nuevo, se borra.
// (Más adelante en el bootcamp se guarda en una base de datos.)
const ranking = [];

// Arma la respuesta: código de estado + datos en formato JSON
const responder = (codigo, datos) => ({
  statusCode: codigo,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(datos),
});

export const handler = async (event) => {
  console.log(JSON.stringify({ nivel: "INFO", ruta: event.routeKey }));

  switch (event.routeKey) {
    // Ver el top 10
    case "GET /ranking":
      return responder(200, ranking.slice(0, 10));

    // Subir un puntaje: { "nombre": "Ana", "puntaje": 512 }
    case "POST /ranking": {
      let datos;
      try {
        datos = JSON.parse(event.isBase64Encoded
          ? Buffer.from(event.body || "", "base64").toString()
          : event.body || "{}");
      } catch {
        return responder(400, { error: "El cuerpo debe ser JSON" });
      }
      if (!datos || typeof datos !== "object") {
        return responder(400, { error: "El cuerpo debe ser JSON" });
      }

      const nombre = String(datos.nombre || "").trim().slice(0, 20);
      const puntaje = Number(datos.puntaje);
      if (!nombre) return responder(400, { error: "Falta el nombre" });
      if (!Number.isInteger(puntaje) || puntaje < 0 || puntaje > 100000) {
        return responder(400, { error: "Puntaje inválido" });
      }

      ranking.push({ nombre, puntaje, fecha: new Date().toISOString() });
      ranking.sort((a, b) => b.puntaje - a.puntaje);
      const posicion = ranking.findIndex((p) => p.nombre === nombre && p.puntaje === puntaje) + 1;
      return responder(201, { posicion, total: ranking.length });
    }

    default:
      return responder(404, { error: "Ruta no encontrada" });
  }
};
