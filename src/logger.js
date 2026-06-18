// Logger minimal en JSON sur stdout/stderr.
// Pourquoi du JSON ? Les logs sont collectés par Docker puis affichés dans Coolify.
// Un format structuré reste lisible à l'œil ET exploitable par un outil (grep, jq...).

function write(stream, level, message, extra = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...extra,
  });
  stream.write(line + "\n");
}

export const logger = {
  info: (message, extra) => write(process.stdout, "info", message, extra),
  warn: (message, extra) => write(process.stdout, "warn", message, extra),
  error: (message, extra) => write(process.stderr, "error", message, extra),
};
