import pg from "pg";
import { logger } from "./logger.js";

const { Pool } = pg;

// Connexion : on accepte soit une URL complète (DATABASE_URL, pratique sur Coolify),
// soit des variables séparées (PGHOST, PGUSER...). L'URL a la priorité si elle existe.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || "db",
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || "taskflow",
      password: process.env.PGPASSWORD || "taskflow",
      database: process.env.PGDATABASE || "taskflow",
    });

pool.on("error", (err) => {
  logger.error("Erreur inattendue du pool PostgreSQL", { error: err.message });
});

// Crée la table si elle n'existe pas. Appelé une fois au démarrage : pas besoin
// de migration manuelle pour la démo, l'app est auto-suffisante.
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      title       TEXT        NOT NULL,
      priority    TEXT        NOT NULL DEFAULT 'normale'
                  CHECK (priority IN ('basse', 'normale', 'haute')),
      done        BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  logger.info("Base de données prête (table 'tasks' vérifiée)");
}

// Réessaie la connexion : au démarrage, PostgreSQL peut ne pas être encore prêt
// (l'app et la base démarrent en parallèle dans Docker). On attend, on ne crashe pas.
export async function waitForDb(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      logger.info("Connexion à PostgreSQL établie", { attempt });
      return;
    } catch (err) {
      logger.warn("PostgreSQL pas encore disponible, nouvelle tentative...", {
        attempt,
        retries,
        error: err.message,
      });
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Impossible de se connecter à PostgreSQL après plusieurs essais");
}

export async function ping() {
  await pool.query("SELECT 1");
}

export { pool };
