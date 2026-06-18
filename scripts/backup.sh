#!/usr/bin/env bash
# Sauvegarde de la base PostgreSQL de TaskFlow.
#
# Produit un dump SQL horodaté et compressé dans ./backups.
# Principe (règle 3-2-1) : ce dump est la 2e copie ; on l'envoie ensuite sur un
# support différent (stockage objet / disque externe) et hors site.
#
# Usage :   ./scripts/backup.sh
# Planif :  via cron ou une tâche planifiée Coolify (ex. tous les jours à 2h).
set -euo pipefail

# Identifiants : repris de l'environnement, valeurs par défaut sinon.
PGUSER="${PGUSER:-taskflow}"
PGDATABASE="${PGDATABASE:-taskflow}"
DB_SERVICE="${DB_SERVICE:-db}"          # nom du service dans docker-compose.yml
BACKUP_DIR="${BACKUP_DIR:-backups}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d_%H-%M-%S)"
OUTFILE="$BACKUP_DIR/taskflow_${STAMP}.sql.gz"

echo "→ Sauvegarde de la base '$PGDATABASE'…"
docker compose exec -T "$DB_SERVICE" pg_dump -U "$PGUSER" "$PGDATABASE" \
  | gzip > "$OUTFILE"

echo "✓ Sauvegarde créée : $OUTFILE ($(du -h "$OUTFILE" | cut -f1))"

# Rotation : on ne conserve que les 7 sauvegardes les plus récentes en local.
ls -1t "$BACKUP_DIR"/taskflow_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm --
echo "✓ Rotation effectuée (7 dernières sauvegardes conservées)."
