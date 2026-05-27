"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateFormSchema } from "@repo/database/schemas/form";
import { RESERVED_SLUGS } from "@repo/database/constants/reserved-slugs";
import type { z } from "zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
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
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { applyServerFieldErrors } from "~/lib/form-helpers";
import {
  GeneralSection,
  SeoSection,
  AccessControlSection,
  BehaviorSection,
  DangerZoneSection,
} from "./_sections";

import { useFormContext } from "../layout";
import { useFormEditorStore } from "~/lib/stores/form-editor-store";
import { FormPreviewRenderer } from "~/components/form-builder/form-preview-renderer";
import { loadTheme, type ThemeConfig } from "~/components/form-themes";
import "~/components/form-themes/themes/_register-all";
import Link from "next/link";
import { Layout, Palette } from "lucide-react";

type UpdateFormInput = z.infer<typeof updateFormSchema>;

const SLUG_REGEX = /^[a-z0-9-]{3,80}$/;

export default function FormSettingsPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;

  const { form, isLoading } = useFormContext();
  const store = useFormEditorStore();
  
  const [themeConfig, setThemeConfig] = React.useState<ThemeConfig | null>(null);

  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateFormInput>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: { formId },
  });

  // Reset form when data loads
  React.useEffect(() => {
    if (form) {
      const formData = form as any;
      reset({
        formId,
        title: formData.title ?? "",
        description: formData.description ?? "",
        visibility: formData.visibility ?? "public",
        coverImageUrl: formData.coverImageUrl ?? null,
        metaTitle: formData.metaTitle ?? "",
        metaDescription: formData.metaDescription ?? "",
        settings: {
          successMessage: formData.settings?.successMessage ?? "",
          redirectUrl: formData.settings?.redirectUrl ?? null,
          showProgressBar: formData.settings?.showProgressBar ?? true,
          allowMultipleSubmissions: formData.settings?.allowMultipleSubmissions ?? false,
          customTheme: formData.settings?.customTheme,
        },
      });

      // Hydrate store for integrated editor
      if (store.formId !== formId) {
        store.setFormData({
          formId,
          title: formData.title ?? "",
          description: formData.description ?? "",
          fields: formData.fields ?? [],
          themeId: formData.themeId,
          coverImageUrl: formData.coverImageUrl,
          customTheme: formData.settings?.customTheme,
        });
      }
    }
  }, [form, formId, reset, store]);

  // Load theme
  React.useEffect(() => {
    async function fetchTheme() {
      if (store.themeId) {
        const t = await loadTheme(store.themeId);
        setThemeConfig(t);
      } else {
        const defaultTheme = await loadTheme("default-light");
        setThemeConfig(defaultTheme);
      }
    }
    if (store.formId) {
      fetchTheme();
    }
  }, [store.themeId, store.formId]);

  const activeThemeConfig = React.useMemo(() => {
    if (!themeConfig) return null;
    if (store.customTheme) {
      const custom = store.customTheme;
      return {
        ...themeConfig,
        ...custom,
        colors: { ...themeConfig.colors, ...(custom.colors || {}) },
        fonts: { ...themeConfig.fonts, ...(custom.fonts || {}) },
        shape: { ...themeConfig.shape, ...(custom.shape || {}) },
        motion: { ...themeConfig.motion, ...(custom.motion || {}) },
        chrome: { ...themeConfig.chrome, ...(custom.chrome || {}) },
      };
    }
    return themeConfig;
  }, [themeConfig, store.customTheme]);

  const updateMutation = trpc.form.update.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId });
      utils.form.getByIdWithFields.invalidate({ formId });
      utils.form.list.invalidate();
      toast.success("Settings saved.");
    },
    onError: (err) => {
      if (!applyServerFieldErrors<UpdateFormInput>(err, setError)) {
        handleTrpcError(err);
      }
    },
  });

  const deleteMutation = trpc.form.delete.useMutation({
    onSuccess: () => {
      utils.form.list.invalidate();
      toast.success("Form deleted.");
      router.push("/dashboard");
    },
    onError: (err) => handleTrpcError(err),
  });

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [slugValue, setSlugValue] = React.useState("");
  const [slugStatus, setSlugStatus] = React.useState<
    "idle" | "valid" | "invalid" | "reserved"
  >("idle");

  // Sync slug from loaded data
  React.useEffect(() => {
    if (form) {
      setSlugValue((form as any).slug ?? "");
    }
  }, [form]);

  const validateSlug = (value: string) => {
    if (!value) {
      setSlugStatus("idle");
      return;
    }
    if (RESERVED_SLUGS.includes(value as any)) {
      setSlugStatus("reserved");
      return;
    }
    if (!SLUG_REGEX.test(value)) {
      setSlugStatus("invalid");
      return;
    }
    setSlugStatus("valid");
  };

  const onSubmit = (data: UpdateFormInput) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const visibility = watch("visibility");
  const showProgressBar = watch("settings.showProgressBar");
  const allowMultiple = watch("settings.allowMultipleSubmissions");
  const formTitle = (form as any)?.title ?? "";

  return (
    <div className="flex flex-1 min-h-0 h-full">
      {/* Left panel — Settings */}
      <div className="flex-1 overflow-y-auto p-6 lg:border-r lg:border-border">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
          {/* Sticky save button */}
          <div className="sticky top-0 z-30 flex justify-end py-2 bg-background/95 backdrop-blur">
            <Button
              type="submit"
              variant="forest"
              disabled={!isDirty || isSubmitting || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>

          <GeneralSection register={register} errors={errors} />

          <SeoSection
            register={register}
            slugValue={slugValue}
            slugStatus={slugStatus}
            onSlugChange={(v) => {
              const cleaned = v.toLowerCase().replace(/[^a-z0-9-]/g, "");
              setSlugValue(cleaned);
              validateSlug(cleaned);
            }}
          />

          <AccessControlSection
            visibility={visibility}
            onVisibilityChange={(v) =>
              setValue("visibility", v as any, { shouldDirty: true })
            }
          />

          <BehaviorSection
            register={register}
            showProgressBar={showProgressBar}
            allowMultiple={allowMultiple}
            onProgressBarChange={(v) =>
              setValue("settings.showProgressBar", v, { shouldDirty: true })
            }
            onAllowMultipleChange={(v) =>
              setValue("settings.allowMultipleSubmissions", v, { shouldDirty: true })
            }
          />

          <DangerZoneSection onDelete={() => setShowDeleteDialog(true)} />

          {/* Delete confirmation dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &ldquo;{formTitle}&rdquo;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Type the form title to confirm deletion. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={formTitle}
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={deleteConfirmText !== formTitle}
                  onClick={() => deleteMutation.mutate({ formId })}
                >
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </div>

      {/* Right panel — Live Preview */}
      <div 
        className="w-[450px] hidden lg:flex flex-col transition-colors duration-300 min-h-0"
        style={{ backgroundColor: activeThemeConfig?.colors?.background ?? "#fafafa" }}
      >
        {/* Sticky header */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-border/20 mix-blend-difference text-white"
          style={{ backgroundColor: activeThemeConfig?.colors?.background ?? "#fafafa" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Live Preview
          </h3>
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              asChild
              className="bg-background text-foreground hover:bg-background/90 h-8"
            >
              <Link href={`/dashboard/forms/${formId}/fields`}>
                <Layout className="size-3.5 mr-1.5" />
                Edit Fields
              </Link>
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              asChild
              className="bg-background text-foreground hover:bg-background/90 h-8"
            >
              <Link href={`/dashboard/forms/${formId}/theme`}>
                <Palette className="size-3.5 mr-1.5" />
                Edit Design
              </Link>
            </Button>
          </div>
        </div>

        {/* Scrollable form preview */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeThemeConfig ? (
            <FormPreviewRenderer
              fields={store.fields}
              formTitle={store.title}
              formDescription={store.description}
              coverImageUrl={store.coverImageUrl}
              themeConfig={activeThemeConfig}
            />
          ) : (
            <Skeleton className="h-96 w-full rounded-2xl" />
          )}
        </div>
      </div>
    </div>
  );
}
