"use client";

import * as React from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Slider } from "~/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { FIELD_TYPE_LABELS } from "./field-type-picker";

interface FieldSettingsProps {
  field: any | null;
  onUpdate: (fieldId: string, data: any) => void;
}

export function FieldSettings({ field, onUpdate }: FieldSettingsProps) {
  if (!field) {
    return (
      <div className="w-72 border-l border-border bg-background p-6 flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">
          Select a field to edit its settings.
        </p>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-border bg-background overflow-y-auto p-5 space-y-6">
      {/* Field type */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Field type
        </p>
        <div className="h-9 rounded-lg border border-border bg-secondary/30 px-3 flex items-center text-sm">
          {FIELD_TYPE_LABELS[field.type as keyof typeof FIELD_TYPE_LABELS] ?? field.type}
        </div>
      </div>

      {/* Label */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Label
        </p>
        <Input
          value={field.label ?? ""}
          onChange={(e) => onUpdate(field.id, { label: e.target.value })}
          className="h-9"
        />
      </div>

      {/* Placeholder */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Placeholder
        </p>
        <Input
          value={field.placeholder ?? ""}
          onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
          placeholder="Ex. lumix"
          className="h-9"
        />
      </div>

      {/* Settings */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Settings
        </p>
        <div className="space-y-3">
          <SettingRow
            label="Required"
            checked={field.required ?? false}
            onChange={(v) => onUpdate(field.id, { required: v })}
          />
          {(field.type === "short_text" || field.type === "long_text") && (
            <SettingRow
              label="Max character"
              checked={!!field.validations?.maxLength}
              onChange={(v) =>
                onUpdate(field.id, {
                  validations: { ...field.validations, maxLength: v ? 255 : undefined },
                })
              }
            />
          )}
          <SettingRow
            label="Info message"
            checked={!!field.helpText}
            onChange={(v) =>
              onUpdate(field.id, { helpText: v ? "Help text here" : "" })
            }
          />
        </div>
      </div>

      {/* Rating max */}
      {field.type === "rating" && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Max rating: {field.settings?.ratingMax ?? 5}
          </p>
          <Slider
            min={1}
            max={10}
            step={1}
            value={[field.settings?.ratingMax ?? 5]}
            onValueChange={([val]) =>
              onUpdate(field.id, { settings: { ...field.settings, ratingMax: val } })
            }
          />
        </div>
      )}

      {/* Help text input (when enabled) */}
      {field.helpText && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Help text
          </p>
          <Input
            value={field.helpText}
            onChange={(e) => onUpdate(field.id, { helpText: e.target.value })}
            className="h-9"
          />
        </div>
      )}
    </div>
  );
}

function SettingRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
