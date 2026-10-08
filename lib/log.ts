type Severity = "INFO" | "WARNING" | "ERROR";

/**
 * One JSON line per event on stdout. Cloud Run forwards it to Cloud Logging, which reads
 * `severity` and `message` as structured fields. Never pass pitch or answer text here.
 */
export function log(severity: Severity, message: string, fields: Record<string, string | number | boolean> = {}): void {
  if (process.env.NODE_ENV === "test") return;
  console.log(JSON.stringify({ severity, message, ...fields }));
}
