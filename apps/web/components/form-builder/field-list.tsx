"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  FIELD_TYPE_ICON_MAP,
  FIELD_TYPE_LABELS,
} from "~/components/form-builder/field-type-picker";
import type { FieldType } from "@repo/database";

export interface FieldItem {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
}

interface FieldListProps {
  fields: FieldItem[];
  selectedFieldId: string | null;
  onSelect: (fieldId: string) => void;
  onReorder: (fieldIds: string[]) => void;
  onDelete: (fieldId: string) => void;
}

export function FieldList({
  fields,
  selectedFieldId,
  onSelect,
  onReorder,
  onDelete,
}: FieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fieldIds = fields.map((f) => f.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fieldIds.indexOf(active.id as string);
    const newIndex = fieldIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newIds = [...fieldIds];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, active.id as string);
    onReorder(newIds);
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">
          No fields yet. Add your first field below.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1" role="list" aria-label="Form fields">
          {fields.map((field, index) => (
            <SortableFieldRow
              key={field.id}
              field={field}
              index={index}
              isSelected={field.id === selectedFieldId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableFieldRowProps {
  field: FieldItem;
  index: number;
  isSelected: boolean;
  onSelect: (fieldId: string) => void;
  onDelete: (fieldId: string) => void;
}

function SortableFieldRow({
  field,
  index,
  isSelected,
  onSelect,
  onDelete,
}: SortableFieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = FIELD_TYPE_ICON_MAP[field.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
      data-index={index}
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
        isSelected
          ? "border-foreground/20 bg-accent"
          : "border-transparent hover:bg-accent/50",
        isDragging && "rotate-[0.5deg] shadow-lg opacity-90",
      )}
      onClick={() => onSelect(field.id)}
    >
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
        aria-label={`Drag to reorder ${field.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <Icon className="size-4 text-muted-foreground shrink-0" />

      <span className="text-sm font-medium truncate flex-1">
        {field.label}
        {field.required && (
          <span className="text-destructive ml-0.5">*</span>
        )}
      </span>

      <span className="text-xs text-muted-foreground">
        {FIELD_TYPE_LABELS[field.type]}
      </span>

      <button
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field.id);
        }}
        aria-label={`Delete ${field.label}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
