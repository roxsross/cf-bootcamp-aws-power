// ROXS RUNNER · simula API Gateway + Lambda en tu computadora (opcional, requiere Node.js)
// Uso: node scripts/api-local.mjs        → http://localhost:3000
// Luego en juego/config.js: window.RANKING_API = "http://localhost:3000";
import http from "node:http";
import { handler } from "../lambda/index.mjs";

const PORT = Number(process.env.PORT) || 3000;
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST",
  "access-control-allow-headers": "content-type",
};

http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    return res.end();
  }
  let body = "";
  for await (const chunk of req) body += chunk;
  const path = new URL(req.url, "http://localhost").pathname.replace(/\/+$/, "");
  // Mismo formato de evento que manda una API HTTP (payload 2.0)
  let r;
  try {
    r = await handler({ routeKey: `${req.method} ${path}`, body, isBase64Encoded: false });
  } catch (err) {
    console.error(err); // en AWS esto sería un 500 "Internal Server Error"
    r = { statusCode: 500, headers: {}, body: JSON.stringify({ message: "Internal Server Error" }) };
  }
  res.writeHead(r.statusCode, { ...cors, ...r.headers });
  res.end(r.body);
}).listen(PORT, () => console.log(`API local del ranking en http://localhost:${PORT}/ranking`));
