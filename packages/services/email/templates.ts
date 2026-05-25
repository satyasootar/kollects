export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== "string") return String(unsafe);
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderTemplate(template: string, variables: Record<string, any>): string {
  if (!template) return "";

  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (trimmedKey === "response.answersTable" && variables.response && variables.fields) {
      return generateAnswersTable(variables.response.answers, variables.fields);
    }

    // Resolve nested dot notation (e.g., user.name)
    const keys = trimmedKey.split(".");
    let value = variables;
    for (const k of keys) {
      if (value === null || value === undefined) break;
      value = value[k];
    }

    return value !== undefined && value !== null ? escapeHtml(String(value)) : match;
  });
}

function generateAnswersTable(answers: any[], fields: any[]): string {
  if (!answers || !answers.length) return "<p>No answers provided.</p>";

  const fieldMap = new Map<string, any>();
  for (const field of fields) {
    fieldMap.set(field.id, field);
  }

  let html = `<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">`;
  html += `<thead><tr style="background-color: #f3f4f6; text-align: left;">`;
  html += `<th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Question</th>`;
  html += `<th style="padding: 12px; border-bottom: 2px solid #e5e7eb;">Answer</th>`;
  html += `</tr></thead><tbody>`;

  for (const answer of answers) {
    const field = fieldMap.get(answer.fieldId);
    if (!field) continue;

    let displayValue = answer.value;
    if (Array.isArray(displayValue)) {
      displayValue = displayValue.join(", ");
    } else if (typeof displayValue === "boolean") {
      displayValue = displayValue ? "Yes" : "No";
    }

    html += `<tr>`;
    html += `<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${escapeHtml(String(field.label))}</td>`;
    html += `<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(String(displayValue || "-"))}</td>`;
    html += `</tr>`;
  }

  html += `</tbody></table>`;
  return html;
}
