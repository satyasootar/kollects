"use client";

import * as React from "react";
import type { FieldType } from "@repo/database/constants/field-types";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Slider } from "~/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  FIELD_TYPE_ICON_MAP,
  FIELD_TYPE_LABELS,
} from "~/components/form-builder/field-type-picker";

export interface FieldData {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string | null;
  helpText?: string | null;
  required: boolean;
  validations?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;
  settings?: {
    ratingMax?: number;
    placeholder?: string;
  } | null;
  options?: { label: string; value: string; imageUrl?: string | null }[] | null;
}

interface FieldInspectorProps {
  field: FieldData | null;
  onUpdate: (fieldId: string, data: Partial<FieldData>) => void;
}

export function FieldInspector({ field, onUpdate }: FieldInspectorProps) {
  if (!field) {
    return (
      <div className="flex items-center justify-center h-full text-center p-6">
        <p className="text-muted-foreground text-sm">
          Select a field to edit its properties.
        </p>
      </div>
    );
  }

  const Icon = FIELD_TYPE_ICON_MAP[field.type];
  const hasTextValidation = field.type === "short_text" || field.type === "long_text";
  const hasNumberValidation = field.type === "number";
  const hasRatingSettings = field.type === "rating";
  const hasOptions = field.type === "single_select" || field.type === "multi_select";

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-8 rounded-md bg-accent">
          <Icon className="size-4 text-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {FIELD_TYPE_LABELS[field.type]}
        </span>
      </div>

      {/* Basic fields */}
      <div className="space-y-4">
        <InspectorField label="Label">
          <Input
            value={field.label}
            onChange={(e) => onUpdate(field.id, { label: e.target.value })}
            placeholder="Field label"
          />
        </InspectorField>

        <InspectorField label="Placeholder">
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </InspectorField>

        <InspectorField label="Help text">
          <Input
            value={field.helpText ?? ""}
            onChange={(e) => onUpdate(field.id, { helpText: e.target.value })}
            placeholder="Help text shown below the field"
          />
        </InspectorField>

        <div className="flex items-center justify-between">
          <Label htmlFor="required-toggle" className="text-sm">
            Required
          </Label>
          <Switch
            id="required-toggle"
            checked={field.required}
            onCheckedChange={(checked) =>
              onUpdate(field.id, { required: checked })
            }
          />
        </div>
      </div>

      {/* Type-specific sections */}
      <Accordion type="multiple" className="w-full">
        {hasTextValidation && (
          <TextValidationSection field={field} onUpdate={onUpdate} />
        )}
        {hasNumberValidation && (
          <NumberValidationSection field={field} onUpdate={onUpdate} />
        )}
        {hasRatingSettings && (
          <RatingSettingsSection field={field} onUpdate={onUpdate} />
        )}
        {hasOptions && (
          <OptionsSection field={field} onUpdate={onUpdate} />
        )}
      </Accordion>
    </div>
  );
}

function InspectorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function TextValidationSection({
  field,
  onUpdate,
}: {
  field: FieldData;
  onUpdate: FieldInspectorProps["onUpdate"];
}) {
  return (
    <AccordionItem value="validation">
      <AccordionTrigger className="text-sm">Validation</AccordionTrigger>
      <AccordionContent className="space-y-3 pt-2">
        <InspectorField label="Min length">
          <Input
            type="number"
            min={0}
            value={field.validations?.minLength ?? ""}
            onChange={(e) =>
              onUpdate(field.id, {
                validations: {
                  ...field.validations,
                  minLength: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />
        </InspectorField>
        <InspectorField label="Max length">
          <Input
            type="number"
            min={0}
            value={field.validations?.maxLength ?? ""}
            onChange={(e) =>
              onUpdate(field.id, {
                validations: {
                  ...field.validations,
                  maxLength: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />
        </InspectorField>
        <InspectorField label="Pattern (regex)">
          <Input
            value={field.validations?.pattern ?? ""}
            onChange={(e) =>
              onUpdate(field.id, {
                validations: { ...field.validations, pattern: e.target.value },
              })
            }
            placeholder="e.g. ^[A-Z].*"
          />
        </InspectorField>
      </AccordionContent>
    </AccordionItem>
  );
}

function NumberValidationSection({
  field,
  onUpdate,
}: {
  field: FieldData;
  onUpdate: FieldInspectorProps["onUpdate"];
}) {
  return (
    <AccordionItem value="validation">
      <AccordionTrigger className="text-sm">Validation</AccordionTrigger>
      <AccordionContent className="space-y-3 pt-2">
        <InspectorField label="Min value">
          <Input
            type="number"
            value={field.validations?.min ?? ""}
            onChange={(e) =>
              onUpdate(field.id, {
                validations: {
                  ...field.validations,
                  min: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />
        </InspectorField>
        <InspectorField label="Max value">
          <Input
            type="number"
            value={field.validations?.max ?? ""}
            onChange={(e) =>
              onUpdate(field.id, {
                validations: {
                  ...field.validations,
                  max: e.target.value ? Number(e.target.value) : undefined,
                },
              })
            }
          />
        </InspectorField>
      </AccordionContent>
    </AccordionItem>
  );
}

function RatingSettingsSection({
  field,
  onUpdate,
}: {
  field: FieldData;
  onUpdate: FieldInspectorProps["onUpdate"];
}) {
  const ratingMax = field.settings?.ratingMax ?? 5;

  return (
    <AccordionItem value="settings">
      <AccordionTrigger className="text-sm">Settings</AccordionTrigger>
      <AccordionContent className="space-y-3 pt-2">
        <InspectorField label={`Max rating: ${ratingMax}`}>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[ratingMax]}
            onValueChange={([val]) =>
              onUpdate(field.id, {
                settings: { ...field.settings, ratingMax: val },
              })
            }
          />
        </InspectorField>
      </AccordionContent>
    </AccordionItem>
  );
}

function OptionsSection({
  field,
  onUpdate,
}: {
  field: FieldData;
  onUpdate: FieldInspectorProps["onUpdate"];
}) {
  const options = field.options ?? [];

  const addOption = () => {
    const newOption = { label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` };
    onUpdate(field.id, { options: [...options, newOption] });
  };

  const updateOption = (index: number, key: "label" | "value", val: string) => {
    const updated = options.map((opt, i) =>
      i === index ? { ...opt, [key]: val } : opt,
    );
    onUpdate(field.id, { options: updated });
  };

  const removeOption = (index: number) => {
    onUpdate(field.id, { options: options.filter((_, i) => i !== index) });
  };

  return (
    <AccordionItem value="options">
      <AccordionTrigger className="text-sm">Options</AccordionTrigger>
      <AccordionContent className="space-y-2 pt-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={opt.label}
              onChange={(e) => updateOption(i, "label", e.target.value)}
              placeholder="Label"
              className="flex-1"
            />
            <Input
              value={opt.value}
              onChange={(e) => updateOption(i, "value", e.target.value)}
              placeholder="Value"
              className="flex-1"
            />
            <button
              onClick={() => removeOption(i)}
              className="text-muted-foreground hover:text-destructive text-xs"
              aria-label={`Remove option ${opt.label}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          + Add option
        </button>
      </AccordionContent>
    </AccordionItem>
  );
}
