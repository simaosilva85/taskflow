import { Router } from "express";
import { pool } from "../db.js";

export const tasksRouter = Router();

const PRIORITIES = ["basse", "normale", "haute"];

// GET /api/tasks — liste toutes les tâches, les plus récentes d'abord.
tasksRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, priority, done, created_at FROM tasks ORDER BY done ASC, created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks — crée une tâche. Corps attendu : { title, priority? }
tasksRouter.post("/", async (req, res, next) => {
  try {
    const title = (req.body?.title || "").trim();
    const priority = req.body?.priority || "normale";

    if (!title) {
      return res.status(400).json({ error: "Le titre est obligatoire." });
    }
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Priorité invalide (attendu : ${PRIORITIES.join(", ")}).` });
    }

    const { rows } = await pool.query(
      "INSERT INTO tasks (title, priority) VALUES ($1, $2) RETURNING id, title, priority, done, created_at",
      [title, priority]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id — bascule l'état "fait / à faire".
tasksRouter.patch("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "UPDATE tasks SET done = NOT done WHERE id = $1 RETURNING id, title, priority, done, created_at",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Tâche introuvable." });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id — supprime une tâche.
tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Tâche introuvable." });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
