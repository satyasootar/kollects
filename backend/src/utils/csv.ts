/**
 * One CSV cell. Text starting with = + - @ tab or CR is prefixed with ' so spreadsheets show it
 * instead of running it as a formula (respondents control most exported text).
 */
export function csvCell(value: unknown): string {
  if (typeof value === "number") return String(value);
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
