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
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";

export default function FieldsPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;
  const { data: form, isLoading, refetch } = trpc.form.getByIdWithFields.useQuery(
    { formId },
    { enabled: !!formId }
  );

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
        customTheme: formData.settings?.customTheme,
        showFieldIcons: formData.settings?.showFieldIcons ?? false,
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
  const createFieldMutation = trpc.field.create.useMutation();
  const updateFieldMutation = trpc.field.update.useMutation();
  const deleteFieldMutation = trpc.field.delete.useMutation();
  const reorderFieldMutation = trpc.field.reorder.useMutation();

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      await updateFormMutation.mutateAsync({
        formId,
        title: store.title,
        description: store.description || undefined,
        coverImageUrl: store.coverImageUrl,
        settings: {
          ...((form as any)?.settings || {}),
          showFieldIcons: store.showFieldIcons,
          customTheme: store.customTheme,
        },
      });

      // Find deleted fields (in form but not in store)
      const initialFields = (form as any)?.fields || [];
      const deletedIds = initialFields
        .map((f: any) => f.id)
        .filter((id: string) => !store.fields.find(f => f.id === id));
        
      for (const id of deletedIds) {
        await deleteFieldMutation.mutateAsync({ formId, fieldId: id });
      }

      // Create new fields and update existing
      const createPromises = store.fields
        .filter(f => f.id.startsWith("temp_"))
        .map(async field => {
          const res = await createFieldMutation.mutateAsync({
            formId,
            type: field.type as any,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            required: field.required,
            options: field.options,
            validations: field.validations,
            settings: field.settings,
          });
          return { tempId: field.id, realId: res.id };
        });

      const updatePromises = store.fields
        .filter(f => !f.id.startsWith("temp_"))
        .map(field => updateFieldMutation.mutateAsync({
            formId,
            fieldId: field.id,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            required: field.required,
            options: field.options,
            validations: field.validations,
            settings: field.settings,
        }));

      const created = await Promise.all(createPromises);
      await Promise.all(updatePromises);

      const idMap = new Map(created.map(c => [c.tempId, c.realId]));
      const finalIds = store.fields.map(f => idMap.get(f.id) || f.id);

      await reorderFieldMutation.mutateAsync({
        formId,
        fieldIds: finalIds,
      });

      store.markSaved();
      refetch(); 
      toast.success("Form saved!");
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
        settings: {
          ...((form as any)?.settings || {}),
          showFieldIcons: store.showFieldIcons,
          customTheme: store.customTheme,
        },
      });

      const initialFields = (form as any)?.fields || [];
      const deletedIds = initialFields
        .map((f: any) => f.id)
        .filter((id: string) => !store.fields.find(f => f.id === id));
        
      for (const id of deletedIds) {
        await deleteFieldMutation.mutateAsync({ formId, fieldId: id });
      }

      const createPromises = store.fields
        .filter(f => f.id.startsWith("temp_"))
        .map(async field => {
          const res = await createFieldMutation.mutateAsync({
            formId,
            type: field.type as any,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            required: field.required,
            options: field.options,
            validations: field.validations,
            settings: field.settings,
          });
          return { tempId: field.id, realId: res.id };
        });

      const updatePromises = store.fields
        .filter(f => !f.id.startsWith("temp_"))
        .map(field => updateFieldMutation.mutateAsync({
            formId,
            fieldId: field.id,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            required: field.required,
            options: field.options,
            validations: field.validations,
            settings: field.settings,
        }));

      const created = await Promise.all(createPromises);
      await Promise.all(updatePromises);

      const idMap = new Map(created.map(c => [c.tempId, c.realId]));
      const finalIds = store.fields.map(f => idMap.get(f.id) || f.id);

      await reorderFieldMutation.mutateAsync({
        formId,
        fieldIds: finalIds,
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
      <div className="flex h-screen">
        <div className="w-56 p-4 border-r"><Skeleton className="h-full rounded-xl" /></div>
        <div className="flex-1 p-8"><Skeleton className="h-96 rounded-xl" /></div>
        <div className="w-64 p-4 border-l"><Skeleton className="h-full rounded-xl" /></div>
      </div>
    );
  }

  const selectedField = store.fields.find((f) => f.id === store.selectedFieldId) ?? null;

  return (
    <div className="flex flex-col h-screen">
      {/* Save bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          {store.isDirty && (
            <span className="text-xs text-muted-foreground bg-tint-butter/60 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="globalShowFieldIcons" className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
              Show field icons
            </Label>
            <Switch
              id="globalShowFieldIcons"
              checked={store.showFieldIcons}
              onCheckedChange={store.setShowFieldIcons}
            />
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
      </div>

      {/* Editor panels */}
      <div className="flex flex-1 overflow-hidden">
        <FieldPalette onAddField={store.addField} />
        <FormCanvas
          fields={store.fields}
          formTitle={store.title}
          formDescription={store.description}
          onUpdateTitle={store.setTitle}
          onUpdateDescription={store.setDescription}
          selectedFieldId={store.selectedFieldId}
          onSelectField={store.selectField}
          onReorder={store.reorderFields}
          onDeleteField={store.deleteField}
          onUpdateField={store.updateField}
          showFieldIcons={store.showFieldIcons}
          coverImageUrl={store.coverImageUrl}
          onUpdateCoverImage={store.setCoverImageUrl}
        />
        <FieldSettings
          field={selectedField}
          onUpdate={store.updateField}
          showFieldIcons={store.showFieldIcons}
          onUpdateShowFieldIcons={store.setShowFieldIcons}
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
