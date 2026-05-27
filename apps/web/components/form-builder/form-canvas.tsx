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
import { Button } from "~/components/ui/button";

interface FormCanvasProps {
  fields: any[];
  formTitle: string;
  formDescription?: string;
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onReorder: (fieldIds: string[]) => void;
  onDeleteField: (id: string) => void;
}

export function FormCanvas({
  fields,
  formTitle,
  formDescription,
  selectedFieldId,
  onSelectField,
  onReorder,
  onDeleteField,
}: FormCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fieldIds = fields.map((f: any) => f.id);

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

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-border/60 shadow-sm p-8 min-h-[600px]">
        {/* Form header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground">{formTitle}</h2>
          {formDescription && (
            <p className="mt-1 text-sm text-muted-foreground">{formDescription}</p>
          )}
        </div>

        {/* Fields */}
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-sm">
              Drag fields from the left panel to start building your form.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {fields.map((field: any) => (
                  <SortableCanvasField
                    key={field.id}
                    field={field}
                    isSelected={field.id === selectedFieldId}
                    onSelect={() => onSelectField(field.id)}
                    onDelete={() => onDeleteField(field.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Next button preview */}
        {fields.length > 0 && (
          <div className="mt-8">
            <Button variant="forest" className="gap-2">
              Next <span>→</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableCanvasField({
  field,
  isSelected,
  onSelect,
  onDelete,
}: {
  field: any;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border p-4 cursor-pointer transition-all",
        isSelected
          ? "border-primary/40 bg-primary/[0.02] shadow-sm"
          : "border-transparent hover:border-border",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      {/* Drag handle */}
      <button
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Delete button */}
      <button
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="size-3.5" />
      </button>

      {/* Field preview */}
      <div className="pl-5">
        <label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
        <div className="mt-2">
          <FieldPreviewInput type={field.type} placeholder={field.placeholder} />
        </div>
      </div>
    </div>
  );
}

function FieldPreviewInput({ type, placeholder }: { type: string; placeholder?: string }) {
  const baseClass = "w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground pointer-events-none";

  switch (type) {
    case "long_text":
      return <div className={cn(baseClass, "h-20")}>{placeholder || "Enter text..."}</div>;
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <div className="size-4 rounded border border-border" />
          <span className="text-sm text-muted-foreground">{placeholder || "Checkbox"}</span>
        </div>
      );
    case "rating":
      return (
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-lg text-border">★</span>
          ))}
        </div>
      );
    case "single_select":
    case "multi_select":
      return <div className={baseClass}>{placeholder || "Select an option..."}</div>;
    default:
      return <div className={baseClass}>{placeholder || "Ex. lumix"}</div>;
  }
}
