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
import { env } from "~/env.js";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

interface FormCanvasProps {
  fields: any[];
  formTitle: string;
  formDescription?: string;
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onReorder: (fieldIds: string[]) => void;
  onDeleteField: (id: string) => void;
  coverImageUrl: string | null;
  onUpdateCoverImage: (url: string | null) => void;
}

export function FormCanvas({
  fields,
  formTitle,
  formDescription,
  selectedFieldId,
  onSelectField,
  onReorder,
  onDeleteField,
  coverImageUrl,
  onUpdateCoverImage,
}: FormCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = (env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc").replace("/trpc", "/api/upload");
      // Using the exact API upload route expected
      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      onUpdateCoverImage(data.url);
    } catch (err) {
      console.error(err);
      alert("Failed to upload banner.");
    } finally {
      setIsUploading(false);
    }
  };

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
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-border/60 shadow-sm p-8 min-h-[600px] relative group">
        
        {/* Banner Section */}
        <div className="mb-8 relative rounded-xl overflow-hidden bg-muted/30 group/banner transition-all">
          {coverImageUrl ? (
            <div className="relative w-full h-48 group">
              <img src={coverImageUrl} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Button variant="secondary" size="sm" onClick={() => onUpdateCoverImage(null)}>
                  <Trash2 className="size-4 mr-2" />
                  Remove Banner
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-24 border-2 border-dashed border-border/60 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors">
              <Label className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                {isUploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4"><path d="M7.5 1.5C7.77614 1.5 8 1.72386 8 2V7H13C13.2761 7 13.5 7.22386 13.5 7.5C13.5 7.77614 13.2761 8 13 8H8V13C8 13.2761 7.77614 13.5 7.5 13.5C7.22386 13.5 7 13.2761 7 13V8H2C1.72386 8 1.5 7.77614 1.5 7.5C1.5 7.22386 1.72386 7 2 7H7V2C7 1.72386 7.22386 1.5 7.5 1.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    Add Banner Image
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadBanner} disabled={isUploading} />
              </Label>
            </div>
          )}
        </div>

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
        "group relative rounded-xl border p-4 cursor-pointer transition-colors",
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
          <FieldPreviewInput field={field} />
        </div>
      </div>
    </div>
  );
}

function FieldPreviewInput({ field }: { field: any }) {
  const type = field.type;
  const placeholder = field.placeholder;
  const baseClass = "w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground pointer-events-none flex items-center";

  switch (type) {
    case "long_text":
      return <div className={cn(baseClass, "h-20 items-start py-2")}>{placeholder || "Enter text..."}</div>;
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
      if (field.options && field.options.length > 0) {
        return (
          <div className="space-y-2 pointer-events-none mt-2">
            {field.options.map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn("size-4 border border-border shrink-0", type === "single_select" ? "rounded-full" : "rounded")} />
                <span className="text-sm text-foreground">{opt.label}</span>
              </div>
            ))}
          </div>
        );
      }
      return <div className={baseClass}>{placeholder || "Select an option..."}</div>;
    case "date":
      return <input type="date" className={baseClass} readOnly />;
    default:
      return <div className={baseClass}>{placeholder || "Your answer..."}</div>;
  }
}
