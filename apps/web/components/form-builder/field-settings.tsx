"use client";

import * as React from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Slider } from "~/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Button } from "~/components/ui/button";
import { Trash2, Plus } from "lucide-react";
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

  let defaultPlaceholder = "Your answer...";
  if (field.type === "email") defaultPlaceholder = "john@example.com";
  else if (field.type === "number") defaultPlaceholder = "123";
  else if (field.type === "short_text") defaultPlaceholder = "John Doe";
  else if (field.type === "long_text") defaultPlaceholder = "Enter your message...";
  else if (field.type === "date") defaultPlaceholder = "mm/dd/yyyy";
  else if (field.type === "single_select" || field.type === "multi_select") defaultPlaceholder = "Select an option...";

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
          placeholder={defaultPlaceholder}
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
            <div className="space-y-2">
              <SettingRow
                label="Max character"
                checked={!!field.validations?.maxLength}
                onChange={(v) =>
                  onUpdate(field.id, {
                    validations: { ...field.validations, maxLength: v ? 255 : undefined },
                  })
                }
              />
              {!!field.validations?.maxLength && (
                <div className="pl-1 pr-1 pb-1">
                  <Input 
                    type="number" 
                    className="h-8 text-xs" 
                    value={field.validations.maxLength}
                    onChange={(e) => onUpdate(field.id, {
                      validations: { ...field.validations, maxLength: Number(e.target.value) || 255 }
                    })}
                  />
                </div>
              )}
            </div>
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

      {/* Options Editor */}
      {(field.type === "single_select" || field.type === "multi_select") && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Options
          </p>
          <div className="space-y-2">
            {(field.options || []).map((opt: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  className="h-8 text-xs"
                  value={opt.label}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])];
                    newOptions[idx] = { label: e.target.value, value: e.target.value };
                    onUpdate(field.id, { options: newOptions });
                  }}
                />
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className="shrink-0 size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const newOptions = [...(field.options || [])];
                    newOptions.splice(idx, 1);
                    onUpdate(field.id, { options: newOptions });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs gap-1.5 h-8 mt-2"
              onClick={() => {
                const newOptions = [...(field.options || [])];
                const nextNum = newOptions.length + 1;
                newOptions.push({ label: `Option ${nextNum}`, value: `Option ${nextNum}` });
                onUpdate(field.id, { options: newOptions });
              }}
            >
              <Plus className="size-3.5" />
              Add Option
            </Button>
          </div>
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
