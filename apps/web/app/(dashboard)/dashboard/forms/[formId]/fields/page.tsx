"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { FieldPalette } from "~/components/form-builder/field-palette";
import { FormCanvas } from "~/components/form-builder/form-canvas";
import { FieldSettings } from "~/components/form-builder/field-settings";
import { useFormEditorStore } from "~/lib/stores/form-editor-store";
import { useFormContext } from "../layout";
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
import { ArrowRight, Save } from "lucide-react";

export default function FieldsPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;
  const { form, isLoading, refetch } = useFormContext();

  const store = useFormEditorStore();
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Initialize store from API data on first load or when form data changes
  React.useEffect(() => {
    if (form && store.formId !== formId) {
      const formData = form as any;
      store.setFormData({
        formId,
        title: formData.title ?? "",
        description: formData.description ?? "",
        fields: (formData.fields ?? []).map((f: any) => ({
          id: f.id,
          type: f.type,
          label: f.label,
          placeholder: f.placeholder ?? undefined,
          helpText: f.helpText ?? undefined,
          required: f.required ?? false,
          pageNumber: f.pageNumber,
          options: f.options ?? undefined,
          validations: f.validations ?? undefined,
          settings: f.settings ?? undefined,
        })),
        themeId: formData.themeId,
        coverImageUrl: formData.coverImageUrl,
      });
    }
  }, [form, formId]);

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
  const bulkSyncMutation = trpc.field.bulkSync.useMutation();

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      // 1. Update form title/description
      await updateFormMutation.mutateAsync({
        formId,
        title: store.title,
        description: store.description || undefined,
        coverImageUrl: store.coverImageUrl,
      });

      // 2. Bulk sync all fields
      const fieldsToSync = store.fields.map((field) => ({
        // Only send real DB IDs, not temp IDs
        id: field.id.startsWith("temp_") ? undefined : field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        required: field.required,
        pageNumber: field.pageNumber,
        options: field.options,
        validations: field.validations,
        settings: field.settings,
      }));

      await bulkSyncMutation.mutateAsync({
        formId,
        fields: fieldsToSync,
      });

      store.markSaved();
      refetch(); // Refresh form data in context
      toast.success("Form saved!");

      // Navigate to theme designer
      router.push(`/dashboard/forms/${formId}/theme`);
    } catch (err) {
      handleTrpcError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!store.isDirty) return;
    setIsSaving(true);
    try {
      await updateFormMutation.mutateAsync({
        formId,
        title: store.title,
        description: store.description || undefined,
        coverImageUrl: store.coverImageUrl,
      });

      const fieldsToSync = store.fields.map((field) => ({
        id: field.id.startsWith("temp_") ? undefined : field.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        required: field.required,
        pageNumber: field.pageNumber,
        options: field.options,
        validations: field.validations,
        settings: field.settings,
      }));

      await bulkSyncMutation.mutateAsync({
        formId,
        fields: fieldsToSync,
      });

      store.markSaved();
      refetch();
      toast.success("Draft saved.");
    } catch (err) {
      handleTrpcError(err);
    } finally {
      setIsSaving(false);
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
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={!store.isDirty || isSaving}
          >
            <Save className="size-3.5 mr-1.5" />
            {isSaving ? "Saving…" : "Save Draft"}
          </Button>
          <Button
            variant="forest"
            size="sm"
            onClick={handleSaveAndContinue}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save & Continue"}
            <ArrowRight className="size-3.5 ml-1.5" />
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
          coverImageUrl={store.coverImageUrl}
          onUpdateCoverImage={store.setCoverImageUrl}
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
              await handleSaveDraft();
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
