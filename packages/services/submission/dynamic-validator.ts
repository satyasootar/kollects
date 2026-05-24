import { z } from "zod";
import { type SelectFormField } from "@repo/database/models/form-field";

/**
 * Dynamically builds a Zod schema from an array of form fields.
 */
export function buildValidationSchema(fields: SelectFormField[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let fieldSchema: z.ZodTypeAny;

    const validations = field.validations || {};

    switch (field.type) {
      case "short_text":
      case "long_text": {
        let strSchema = z.string();
        if (validations.minLength !== undefined) strSchema = strSchema.min(Number(validations.minLength));
        if (validations.maxLength !== undefined) strSchema = strSchema.max(Number(validations.maxLength));
        if (validations.pattern) strSchema = strSchema.regex(new RegExp(String(validations.pattern)));
        fieldSchema = strSchema;
        break;
      }
      case "email": {
        fieldSchema = z.string().email();
        break;
      }
      case "number": {
        let numSchema = z.number();
        if (validations.min !== undefined) numSchema = numSchema.min(Number(validations.min));
        if (validations.max !== undefined) numSchema = numSchema.max(Number(validations.max));
        fieldSchema = numSchema;
        break;
      }
      case "date": {
        fieldSchema = z.coerce.date();
        break;
      }
      case "single_select": {
        if (!field.options || field.options.length === 0) {
          fieldSchema = z.string();
        } else {
          const values = field.options.map((opt) => String(opt.value || opt.label));
          fieldSchema = z.enum([values[0], ...values.slice(1)] as [string, ...string[]]);
        }
        break;
      }
      case "multi_select": {
        if (!field.options || field.options.length === 0) {
          fieldSchema = z.array(z.string());
        } else {
          const values = field.options.map((opt) => String(opt.value || opt.label));
          fieldSchema = z.array(z.enum([values[0], ...values.slice(1)] as [string, ...string[]]));
        }
        break;
      }
      case "checkbox": {
        fieldSchema = z.boolean();
        break;
      }
      case "rating": {
        let ratingSchema = z.number().int();
        const maxRating = Number(field.settings?.maxRating) || 5;
        ratingSchema = ratingSchema.min(1).max(maxRating);
        fieldSchema = ratingSchema;
        break;
      }
      case "url": {
        fieldSchema = z.string().url();
        break;
      }
      case "phone": {
        // Basic phone validation (allowing digits, +, -, space, brackets)
        fieldSchema = z.string().regex(/^[+\d\s()\-.]+$/);
        break;
      }
      default:
        fieldSchema = z.any();
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional().nullable();
    }

    shape[field.id] = fieldSchema;
  }

  return z.object(shape);
}
