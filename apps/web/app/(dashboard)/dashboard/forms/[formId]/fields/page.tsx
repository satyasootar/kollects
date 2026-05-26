"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { FieldList, type FieldItem } from "~/components/form-builder/field-list";
import { FieldInspector, type FieldData } from "~/components/form-builder/field-inspector";
import { FieldTypePicker } from "~/components/form-builder/field-type-picker";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import type { FieldType } from "@repo/database";

export default function FieldsPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const { data: form, isLoading } = trpc.form.getById.useQuery(
    { formId },
    { enabled: !!formId },
  );
  const utils = trpc.useUtils();

  const [selectedFieldId, setSelectedFieldId] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const formData = form as any;
  const fields: FieldItem[] = (formData?.fields ?? []).map((f: any) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    required: f.required ?? false,
  }));

  const selectedField: FieldData | null = React.useMemo(() => {
    if (!selectedFieldId || !formData?.fields) return null;
    const f = (formData.fields as any[]).find((x: any) => x.id === selectedFieldId);
    if (!f) return null;
    return {
      id: f.id,
      type: f.type,
      label: f.label,
      placeholder: f.placeholder,
      helpText: f.helpText,
      required: f.required ?? false,
      validations: f.validations,
      settings: f.settings,
      options: f.options,
    };
  }, [selectedFieldId, formData?.fields]);

  // Mutations
  const createMutation = trpc.field.create.useMutation({
    onSuccess: (data: any) => {
      utils.form.getById.invalidate({ formId });
      setSelectedFieldId(data?.id ?? null);
      toast.success("Field added.");
    },
    onError: (err) => handleTrpcError(err),
  });

  const updateMutation = trpc.field.update.useMutation({
    onSuccess: () => utils.form.getById.invalidate({ formId }),
    onError: (err) => handleTrpcError(err),
  });

  const deleteMutation = trpc.field.delete.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId });
      if (selectedFieldId) setSelectedFieldId(null);
      toast.success("Field deleted.");
    },
    onError: (err) => handleTrpcError(err),
  });

  const reorderMutation = trpc.field.reorder.useMutation({
    onError: (err) => {
      handleTrpcError(err);
      utils.form.getById.invalidate({ formId });
    },
  });

  const handleAddField = (type: FieldType) => {
    createMutation.mutate({
      formId,
      type,
      label: `New ${type.replace(/_/g, " ")} field`,
    });
  };

  const handleReorder = (fieldIds: string[]) => {
    // Optimistic update
    utils.form.getById.setData({ formId }, (old: any) => {
      if (!old?.fields) return old;
      const fieldMap = new Map(old.fields.map((f: any) => [f.id, f]));
      const reordered = fieldIds.map((id) => fieldMap.get(id)).filter(Boolean);
      return { ...old, fields: reordered };
    });
    reorderMutation.mutate({ formId, fieldIds });
  };

  const handleDelete = (fieldId: string) => {
    deleteMutation.mutate({ fieldId });
  };

  const handleUpdate = (fieldId: string, data: Partial<FieldData>) => {
    // Convert null values to undefined for the mutation schema
    const cleaned: Record<string, unknown> = { fieldId };
    for (const [key, value] of Object.entries(data)) {
      cleaned[key] = value === null ? undefined : value;
    }
    updateMutation.mutate(cleaned as any);
  };

  // Keyboard shortcut for opening picker
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setPickerOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left column — field list */}
      <div className="w-[60%] border-r border-border p-4 flex flex-col">
        <div className="flex-1 overflow-auto">
          <FieldList
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelect={setSelectedFieldId}
            onReorder={handleReorder}
            onDelete={handleDelete}
          />
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-4" />
            Add field
          </Button>
        </div>
      </div>

      {/* Right column — inspector */}
      <div className="w-[40%] sticky top-0 h-full overflow-auto">
        <FieldInspector field={selectedField} onUpdate={handleUpdate} />
      </div>

      {/* Field type picker */}
      <FieldTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAddField}
      />
    </div>
  );
}
