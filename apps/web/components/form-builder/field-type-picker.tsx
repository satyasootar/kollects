"use client";

import * as React from "react";
import { FIELD_TYPES, type FieldType } from "@repo/database";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import {
  Type,
  AlignLeft,
  AtSign,
  Hash,
  Calendar,
  CircleDot,
  ListChecks,
  SquareCheck,
  Star,
  Link2,
  Phone,
  type LucideIcon,
} from "lucide-react";

export const FIELD_TYPE_ICON_MAP: Record<FieldType, LucideIcon> = {
  short_text: Type,
  long_text: AlignLeft,
  email: AtSign,
  number: Hash,
  date: Calendar,
  single_select: CircleDot,
  multi_select: ListChecks,
  checkbox: SquareCheck,
  rating: Star,
  url: Link2,
  phone: Phone,
};

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  email: "Email",
  number: "Number",
  date: "Date",
  single_select: "Single Select",
  multi_select: "Multi Select",
  checkbox: "Checkbox",
  rating: "Rating",
  url: "URL",
  phone: "Phone",
};

interface FieldTypePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: FieldType) => void;
}

export function FieldTypePicker({
  open,
  onOpenChange,
  onSelect,
}: FieldTypePickerProps) {
  const handleSelect = (type: string) => {
    onSelect(type as FieldType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-sm" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Add a field</DialogTitle>
        <Command>
          <CommandInput placeholder="Search field types…" />
          <CommandList>
            <CommandEmpty>No field type found.</CommandEmpty>
            <CommandGroup heading="Field Types">
              {FIELD_TYPES.map((type) => {
                const Icon = FIELD_TYPE_ICON_MAP[type];
                return (
                  <CommandItem
                    key={type}
                    value={type}
                    onSelect={handleSelect}
                    data-testid={`field-type-${type}`}
                  >
                    <Icon className="size-4 mr-2 text-muted-foreground" />
                    {FIELD_TYPE_LABELS[type]}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
