type Level = "info" | "warn" | "error";

function write(level: Level, message: string, extra?: Record<string, unknown>) {
  const line = `${new Date().toISOString()} ${level.toUpperCase()} ${message}`;
  const out = extra ? `${line} ${JSON.stringify(extra)}` : line;
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.info(out);
}

export const log = {
  info: (message: string, extra?: Record<string, unknown>) => write("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) => write("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) => write("error", message, extra),
};
