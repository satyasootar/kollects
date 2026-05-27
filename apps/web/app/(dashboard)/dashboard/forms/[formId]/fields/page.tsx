"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { FieldPalette } from "~/components/form-builder/field-palette";
import { FormCanvas } from "~/components/form-builder/form-canvas";
import { FieldSettings } from "~/components/form-builder/field-settings";
import { useFormEditorStore } from "~/lib/stores/form-editor-store";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import type { FieldType } from "@repo/database/constants/field-types";

export default function FieldsPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;

  const { data: form, isLoading } = trpc.form.getById.useQuery(
    { formId },
    { enabled: !!formId },
  );

  const store = useFormEditorStore();
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(null);

  // Initialize store from API data on first load
  React.useEffect(() => {
    if (form && store.formId !== formId) {
      const formData = form as any;
      store.setFormData(
        formId,
        formData.title ?? "",
        formData.description ?? "",
        formData.fields ?? [],
      );
    }
  }, [form, formId]);

  // Auto-save with debounce (10s interval when enabled)
  React.useEffect(() => {
    if (!store.autoSaveEnabled || !store.isDirty) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 10000);
    return () => clearTimeout(timer);
  }, [store.autoSaveEnabled, store.isDirty, store.fields, store.title]);

  // Warn before leaving with unsaved changes
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (store.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [store.isDirty]);

  // Save mutations
  const updateFormMutation = trpc.form.update.useMutation();
  const createFieldMutation = trpc.field.create.useMutation();
  const updateFieldMutation = trpc.field.update.useMutation();
  const deleteFieldMutation = trpc.field.delete.useMutation();
  const reorderFieldsMutation = trpc.field.reorder.useMutation();
  const publishMutation = trpc.form.publish.useMutation();

  const handleSave = async () => {
    if (!store.isDirty) return;
    try {
      // 1. Update form metadata
      await updateFormMutation.mutateAsync({
        formId,
        title: store.title,
        description: store.description,
      });

      // 2. Sync fields — for new fields (temp IDs), create them; for existing, update
      for (const field of store.fields) {
        if (field.id.startsWith("temp_")) {
          await createFieldMutation.mutateAsync({
            formId,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            required: field.required,
            options: field.options,
            validations: field.validations,
            settings: field.settings,
          });
        }
      }

      // 3. Reorder
      const existingFieldIds = store.fields
        .filter((f) => !f.id.startsWith("temp_"))
        .map((f) => f.id);
      if (existingFieldIds.length > 0) {
        await reorderFieldsMutation.mutateAsync({ formId, fieldIds: existingFieldIds });
      }

      store.markSaved();
      toast.success("Form saved.");
    } catch (err) {
      handleTrpcError(err);
    }
  };

  const handlePublish = async () => {
    await handleSave();
    try {
      await publishMutation.mutateAsync({ formId });
      toast.success("Form published!");
    } catch (err) {
      handleTrpcError(err);
    }
  };

  const handleNavigateAway = (path: string) => {
    if (store.isDirty) {
      setPendingNavigation(path);
      setShowLeaveDialog(true);
    } else {
      router.push(path);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)]">
        <div className="w-56 p-4 border-r"><Skeleton className="h-full rounded-xl" /></div>
        <div className="flex-1 p-8"><Skeleton className="h-96 rounded-xl" /></div>
        <div className="w-64 p-4 border-l"><Skeleton className="h-full rounded-xl" /></div>
      </div>
    );
  }

  const selectedField = store.fields.find((f) => f.id === store.selectedFieldId) ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Save bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          {store.isDirty && (
            <span className="text-xs text-muted-foreground bg-tint-butter/60 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
          <div className="flex items-center gap-2">
            <Switch
              id="auto-save"
              checked={store.autoSaveEnabled}
              onCheckedChange={store.toggleAutoSave}
              className="scale-75"
            />
            <Label htmlFor="auto-save" className="text-xs text-muted-foreground cursor-pointer">
              Auto-save
            </Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!store.isDirty || updateFormMutation.isPending}
          >
            {updateFormMutation.isPending ? "Saving…" : "Save Draft"}
          </Button>
          <Button variant="forest" size="sm" onClick={handlePublish}>
            Publish
          </Button>
        </div>
      </div>

      {/* Editor panels */}
      <div className="flex flex-1 overflow-hidden">
        <FieldPalette onAddField={store.addField} />
        <FormCanvas
          fields={store.fields}
          formTitle={store.title}
          formDescription={store.description}
          selectedFieldId={store.selectedFieldId}
          onSelectField={store.selectField}
          onReorder={store.reorderFields}
          onDeleteField={store.deleteField}
        />
        <FieldSettings
          field={selectedField}
          onUpdate={store.updateField}
        />
      </div>

      {/* Leave confirmation dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowLeaveDialog(false);
              if (pendingNavigation) router.push(pendingNavigation);
            }}>
              Leave without saving
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await handleSave();
              setShowLeaveDialog(false);
              if (pendingNavigation) router.push(pendingNavigation);
            }}>
              Save & leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
