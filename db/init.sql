-- Schéma de référence de la base TaskFlow.
-- L'application crée déjà cette table automatiquement au démarrage (voir src/db.js).
-- Ce fichier sert de documentation et peut servir à restaurer une base vide.

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       TEXT        NOT NULL,
  priority    TEXT        NOT NULL DEFAULT 'normale'
              CHECK (priority IN ('basse', 'normale', 'haute')),
  done        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
