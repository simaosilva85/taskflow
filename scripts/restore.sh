#!/usr/bin/env bash
# Restauration de la base PostgreSQL de TaskFlow à partir d'un dump.
#
# Une sauvegarde n'a de valeur que si la restauration a été testée :
# ce script sert justement à vérifier qu'on sait remonter les données.
#
# Usage :   ./scripts/restore.sh backups/taskflow_AAAA-MM-JJ_HH-MM-SS.sql.gz
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage : $0 <fichier_de_sauvegarde.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
PGUSER="${PGUSER:-taskflow}"
PGDATABASE="${PGDATABASE:-taskflow}"
DB_SERVICE="${DB_SERVICE:-db}"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Fichier introuvable : $BACKUP_FILE" >&2
  exit 1
fi

echo "⚠  Cette opération va écraser les données actuelles de '$PGDATABASE'."
read -r -p "Continuer ? (oui/non) " answer
[[ "$answer" == "oui" ]] || { echo "Annulé."; exit 0; }

echo "→ Restauration depuis $BACKUP_FILE…"
gunzip -c "$BACKUP_FILE" \
  | docker compose exec -T "$DB_SERVICE" psql -U "$PGUSER" -d "$PGDATABASE"

echo "✓ Restauration terminée."
