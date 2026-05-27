"use client";

import * as React from "react";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import type { FieldType } from "@repo/database/constants/field-types";
import { FIELD_TYPE_ICON_MAP, FIELD_TYPE_LABELS } from "./field-type-picker";

const CATEGORIES = [
  {
    label: "Text",
    types: ["short_text", "long_text", "email", "phone"] as FieldType[],
  },
  {
    label: "Numbers & Date",
    types: ["number", "date", "rating"] as FieldType[],
  },
  {
    label: "Selection",
    types: ["single_select", "multi_select", "checkbox"] as FieldType[],
  },
  {
    label: "Links",
    types: ["url"] as FieldType[],
  },
];

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  const [search, setSearch] = React.useState("");

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    types: cat.types.filter((t) =>
      FIELD_TYPE_LABELS[t].toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.types.length > 0);

  return (
    <div className="w-64 border-r border-border bg-background overflow-y-auto p-4 space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 rounded-lg bg-secondary/50 border-0"
        />
      </div>

      {/* Categories */}
      {filteredCategories.map((category) => (
        <div key={category.label}>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {category.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {category.types.map((type) => {
              const Icon = FIELD_TYPE_ICON_MAP[type];
              return (
                <button
                  key={type}
                  onClick={() => onAddField(type)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/60 bg-card hover:border-primary/30 hover:bg-secondary/50 transition-all text-center group cursor-pointer"
                >
                  <div className="size-8 rounded-lg bg-tint-sky/60 flex items-center justify-center group-hover:bg-tint-sky transition-colors">
                    <Icon className="size-4 text-tint-sky-ink" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground/80 leading-tight">
                    {FIELD_TYPE_LABELS[type]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
