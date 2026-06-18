import express from "express";
import morgan from "morgan";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { logger } from "./logger.js";
import { initDb, waitForDb, ping } from "./db.js";
import { tasksRouter } from "./routes/tasks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

// Version lue depuis package.json : exposée dans /health pour tracer la version
// réellement déployée (utile au support et après un redéploiement Coolify).
const { version: VERSION } = JSON.parse(
  readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);

const app = express();

app.use(express.json());

// Logs d'accès HTTP au format "combined", envoyés sur stdout.
// Chaque requête laisse une trace : méthode, URL, code, durée -> exploitable dans Coolify.
app.use(morgan("combined"));

// --- Supervision ---------------------------------------------------------
// Endpoint de health check utilisé par Docker ET par Coolify pour savoir si
// l'application est vivante. On vérifie aussi que la base répond : une app qui
// tourne mais sans base n'est pas réellement "disponible".
app.get("/health", async (_req, res) => {
  try {
    await ping();
    res.json({
      status: "ok",
      service: "taskflow",
      version: VERSION,
      db: "up",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Health check en échec : base injoignable", { error: err.message });
    res.status(503).json({
      status: "degraded",
      service: "taskflow",
      version: VERSION,
      db: "down",
      timestamp: new Date().toISOString(),
    });
  }
});

// --- API et frontend -----------------------------------------------------
app.use("/api/tasks", tasksRouter);
app.use(express.static(path.join(__dirname, "..", "public")));

// Gestionnaire d'erreurs central : toute erreur non gérée finit ici, est loguée
// et renvoie une réponse propre au lieu de faire planter le serveur.
app.use((err, _req, res, _next) => {
  logger.error("Erreur non gérée", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Erreur interne du serveur." });
});

async function start() {
  try {
    await waitForDb();
    await initDb();
    app.listen(PORT, () => {
      logger.info("TaskFlow démarré", { port: PORT, env: process.env.NODE_ENV || "development" });
    });
  } catch (err) {
    logger.error("Démarrage impossible", { error: err.message });
    process.exit(1);
  }
}

// Arrêt propre : on log le signal reçu (utile pour comprendre un redéploiement Coolify).
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    logger.info("Signal d'arrêt reçu, fermeture de TaskFlow", { signal });
    process.exit(0);
  });
}

start();
