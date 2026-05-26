"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateFormSchema, RESERVED_SLUGS } from "@repo/database";
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

type UpdateFormInput = z.infer<typeof updateFormSchema>;

const SLUG_REGEX = /^[a-z0-9-]{3,80}$/;

export default function FormSettingsPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;

  const { data: formData, isLoading } = trpc.form.getById.useQuery(
    { formId },
    { enabled: !!formId },
  );

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
    if (formData) {
      reset({
        formId,
        title: (formData as any).title ?? "",
        description: (formData as any).description ?? "",
        visibility: (formData as any).visibility ?? "public",
        coverImageUrl: (formData as any).coverImageUrl ?? null,
        metaTitle: (formData as any).metaTitle ?? "",
        metaDescription: (formData as any).metaDescription ?? "",
        settings: {
          successMessage: (formData as any).settings?.successMessage ?? "",
          redirectUrl: (formData as any).settings?.redirectUrl ?? null,
          showProgressBar: (formData as any).settings?.showProgressBar ?? true,
          allowMultipleSubmissions:
            (formData as any).settings?.allowMultipleSubmissions ?? false,
        },
      });
    }
  }, [formData, formId, reset]);

  const updateMutation = trpc.form.update.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId });
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
    if (formData) {
      setSlugValue((formData as any).slug ?? "");
    }
  }, [formData]);

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
  const formTitle = (formData as any)?.title ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-w-3xl">
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
  );
}
