# ✅ TaskFlow — Gestionnaire de tâches

Application web de gestion de tâches développée dans le cadre du projet final
**« Déployer et exploiter une application web »**.

Elle démontre le cycle de vie complet d'une application : code → conteneur →
déploiement → supervision → exploitation.

`VS Code → GitHub → Docker → Coolify → Internet`

---

## 🧩 Fonctionnalités

- Créer une tâche avec une priorité (basse / normale / haute)
- Marquer une tâche comme faite / à faire
- Supprimer une tâche
- Persistance des données en base PostgreSQL
- Endpoint de supervision `/health`

## 🏗️ Architecture

```
Utilisateur
   ↓ (HTTPS)
Internet
   ↓
Coolify (reverse-proxy + TLS)
   ↓
Conteneur "app"  ──►  Conteneur "db" (PostgreSQL)
 (Node + Express)        volume persistant
```

| Brique      | Technologie              | Rôle                                  |
| ----------- | ------------------------ | ------------------------------------- |
| Frontend    | HTML / CSS / JS (vanilla) | Interface utilisateur                 |
| Backend/API | Node.js 20 + Express     | API REST `/api/tasks`                 |
| Base        | PostgreSQL 16            | Persistance des tâches                |
| Conteneur   | Docker / Docker Compose  | Empaquetage et orchestration          |
| Déploiement | Coolify                  | Mise en ligne + URL publique + TLS    |

## 📡 API

| Méthode  | Route             | Description                         |
| -------- | ----------------- | ----------------------------------- |
| `GET`    | `/api/tasks`      | Liste les tâches                    |
| `POST`   | `/api/tasks`      | Crée une tâche `{ title, priority }`|
| `PATCH`  | `/api/tasks/:id`  | Bascule fait / à faire              |
| `DELETE` | `/api/tasks/:id`  | Supprime une tâche                  |
| `GET`    | `/health`         | État du service (app + base)        |

---

## 🚀 Lancer en local

Prérequis : **Docker** et **Docker Compose**.

```bash
# 1. Cloner le dépôt
git clone <url-du-depot> taskflow && cd taskflow

# 2. (Optionnel) configurer les variables
cp .env.example .env

# 3. Démarrer l'application et la base
docker compose up --build
```

L'application est disponible sur **http://localhost:3000**
Health check : **http://localhost:3000/health**

Pour arrêter : `Ctrl+C` puis `docker compose down` (ajouter `-v` pour effacer aussi les données).

### Sans Docker (développement)

```bash
npm install
# nécessite un PostgreSQL accessible (voir variables PG* dans .env.example)
npm run dev
```

---

## ☁️ Déploiement sur Coolify

Déploiement **depuis GitHub** sur l'instance Coolify partagée du cours
(domaines en `*.planbadge.fr`).

1. Dans votre projet Coolify : **New Resource → Public/Private Repository**,
   pointez ce dépôt GitHub (branche `main`).
2. **Build Pack : Docker Compose** — Coolify lit le `docker-compose.yml` et
   construit l'image `app` via le `Dockerfile`, et démarre la base `db`.
3. **Variables d'environnement** à définir dans Coolify (onglet *Environment*),
   jamais dans le dépôt :
   - `PGUSER`, `PGPASSWORD`, `PGDATABASE`
4. **Port interne** : `3000` (le port exposé par le conteneur `app`).
5. **Domaine** : associez une URL du type `https://taskflow.planbadge.fr`
   (choisir un nom non utilisé par un autre groupe). Coolify génère
   automatiquement le certificat **HTTPS** (Let's Encrypt).
6. **Deploy**, puis observez les **logs** de déploiement dans Coolify.
7. Testez l'URL publique et vérifiez que le cadenas HTTPS est valide.

> ⚠️ Les mots de passe ne doivent **jamais** être commités. Ils se définissent
> uniquement dans l'interface Coolify.
>
> Rappel des règles de l'instance partagée : ne modifier que les ressources de
> votre groupe, ne pas réutiliser un domaine déjà pris.

---

## 🔍 Exploitation

### Supervision
- **Health check applicatif** : `GET /health` vérifie que le serveur **et** la
  base répondent. Renvoie `200 {status:"ok"}` ou `503 {status:"degraded"}`.
- **Health check Docker/Coolify** : intégré au `Dockerfile` (`HEALTHCHECK`) et au
  `docker-compose.yml`. Coolify affiche l'état et peut redémarrer le conteneur.
- **Uptime Kuma** (déjà déployé en TP4) : ajouter un *monitor* de type HTTP(s)
  qui sonde `https://taskflow.planbadge.fr/health` toutes les minutes et alerte
  (mail / Discord) en cas d'indisponibilité — c'est le « dispositif de
  supervision » attendu par le projet.

### Logs
- L'application écrit ses logs sur **stdout/stderr** (format JSON pour les
  événements applicatifs, format `combined` pour les accès HTTP).
- Consultables :
  - en local : sortie de `docker compose logs -f app`
  - en production : onglet **Logs** de l'application dans Coolify.
- Utilité : tracer les requêtes, diagnostiquer une erreur, suivre les
  démarrages/arrêts et les pertes de connexion à la base.

### Stratégie de mise à jour
1. Développement sur une branche, *pull request* sur GitHub.
2. Merge sur `main` → Coolify redéploie (build d'une nouvelle image).
3. `restart: unless-stopped` assure le redémarrage automatique du conteneur.

### Sauvegardes — règle 3-2-1
- **3 copies** des données : la base en production + 2 sauvegardes.
- **2 supports différents** : ex. volume serveur + stockage objet (S3) / disque externe.
- **1 copie hors site** : sur un autre hébergeur ou un cloud distinct.

Exemple de sauvegarde de la base PostgreSQL :

```bash
# Dump quotidien (planifiable via cron ou une tâche planifiée Coolify)
docker compose exec db pg_dump -U taskflow taskflow > backup-$(date +%F).sql

# Restauration
cat backup-AAAA-MM-JJ.sql | docker compose exec -T db psql -U taskflow -d taskflow
```

---

## 📁 Structure du projet

```
taskflow/
├── src/
│   ├── server.js        # Serveur Express, /health, gestion des erreurs
│   ├── db.js            # Connexion PostgreSQL + init du schéma
│   ├── logger.js        # Logs structurés JSON
│   └── routes/tasks.js  # API REST des tâches
├── public/              # Frontend (HTML / CSS / JS)
├── db/init.sql          # Schéma de référence
├── Dockerfile           # Image de l'application
├── docker-compose.yml   # App + base de données
└── .env.example         # Modèle de configuration
```

## 👥 Auteurs

Projet réalisé par : _(à compléter avec les noms et prénoms du groupe)_
