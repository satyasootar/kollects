import Papa from "papaparse";
import { type SelectFormField } from "@repo/database/models/form-field";

type ResponseAnswerMap = Record<string, any>;

export interface ExportResponseData {
  id: string;
  submittedAt: Date;
  completionTimeSeconds: number | null;
  ipHash: string | null;
  userAgent: string | null;
  answers: ResponseAnswerMap;
}

export function generateCsvHeaders(fields: SelectFormField[]): string {
  const metadataHeaders = [
    "Response ID",
    "Submitted At",
    "Completion Time (s)",
    "IP Hash",
    "User Agent",
  ];
  const fieldHeaders = fields.map((f) => f.label || f.type);
  const headers = [...metadataHeaders, ...fieldHeaders];
  return Papa.unparse([headers]);
}

export function generateCsvRows(
  fields: SelectFormField[],
  responses: ExportResponseData[],
): string {
  if (responses.length === 0) return "";

  const data = responses.map((response) => {
    const row: any[] = [];

    // 1. Metadata
    row.push(response.id);
    row.push(response.submittedAt.toISOString());
    row.push(response.completionTimeSeconds !== null ? response.completionTimeSeconds : "");
    row.push(response.ipHash || "");
    row.push(response.userAgent || "");

    // 2. Answers mapped by field order
    for (const field of fields) {
      const answer = response.answers[field.id];
      if (answer === undefined || answer === null) {
        row.push("");
        continue;
      }

      // Handle multi-selects and arrays
      if (Array.isArray(answer)) {
        row.push(answer.join(", "));
      } else if (typeof answer === "object") {
        row.push(JSON.stringify(answer));
      } else if (typeof answer === "boolean") {
        row.push(answer ? "Yes" : "No");
      } else {
        row.push(String(answer));
      }
    }

    return row;
  });

  return Papa.unparse(data, { header: false });
}

export function generateCsvExport(
  fields: SelectFormField[],
  responses: ExportResponseData[],
): string {
  const headers = generateCsvHeaders(fields);
  const rows = generateCsvRows(fields, responses);
  return rows ? `${headers}\n${rows}` : headers;
}
