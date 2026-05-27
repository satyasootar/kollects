"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { StatusBadge } from "~/components/chrome";
import { ArrowLeft, Check, MoreHorizontal, Share2, Edit2, BarChart2, MessageSquare, Settings, Mail, Layout, Palette, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { ShareModal } from "~/components/form-builder/share-modal";
import { cn } from "~/lib/utils";

const DRAFT_STEPS = [
  { id: "build", label: "Editor", path: "/fields", icon: Layout },
  { id: "design", label: "Design", path: "/theme", icon: Palette },
  { id: "preview", label: "Preview", path: "/preview", icon: Eye },
] as const;

const PUBLISHED_STEPS = [
  { id: "build", label: "Editor", path: "/fields", icon: Layout },
  { id: "design", label: "Design", path: "/theme", icon: Palette },
  { id: "analytics", label: "Analytics", path: "/analytics", icon: BarChart2 },
  { id: "responses", label: "Responses", path: "/responses", icon: MessageSquare },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
  { id: "email", label: "Email", path: "/email-settings", icon: Mail },
] as const;

// ─── Form Data Context ─────────────────────────────────────────────────────────
// Shares loaded form data with child pages to avoid redundant queries
interface FormContextValue {
  form: any;
  isLoading: boolean;
  refetch: () => void;
}

const FormContext = React.createContext<FormContextValue>({
  form: null,
  isLoading: true,
  refetch: () => {},
});

export function useFormContext() {
  return React.useContext(FormContext);
}

// ─── Layout ─────────────────────────────────────────────────────────────────────
export default function FormEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ formId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const formId = params.formId;

  const { data: form, isLoading, refetch } = trpc.form.getByIdWithFields.useQuery(
    { formId },
    { enabled: !!formId },
  );
  const utils = trpc.useUtils();

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState("");
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const updateMutation = trpc.form.update.useMutation({
    onSuccess: () => {
      utils.form.getByIdWithFields.invalidate({ formId });
      utils.form.getById.invalidate({ formId });
      utils.form.list.invalidate();
    },
    onError: (err) => handleTrpcError(err),
  });

  const publishMutation = trpc.form.publish.useMutation({
    onSuccess: (data) => {
      utils.form.getByIdWithFields.invalidate({ formId });
      utils.form.getById.invalidate({ formId });
      utils.form.list.invalidate();
      
      const url = `${window.location.origin}/f/${data.slug}`;
      toast.success("Form published!", {
        action: {
          label: "Copy Link",
          onClick: () => {
            navigator.clipboard.writeText(url);
            toast.success("Link copied!");
          },
        },
      });
    },
    onError: (err) => handleTrpcError(err),
  });

  const unpublishMutation = trpc.form.unpublish.useMutation({
    onSuccess: () => {
      utils.form.getByIdWithFields.invalidate({ formId });
      utils.form.getById.invalidate({ formId });
      utils.form.list.invalidate();
      toast.success("Form unpublished.");
    },
    onError: (err) => handleTrpcError(err),
  });

  const archiveMutation = trpc.form.archive.useMutation({
    onSuccess: () => {
      utils.form.list.invalidate();
      toast.success("Form archived.");
      router.push("/dashboard");
    },
    onError: (err) => handleTrpcError(err),
  });

  const deleteMutation = trpc.form.delete.useMutation({
    onSuccess: () => {
      utils.form.list.invalidate();
      toast.success("Form deleted.");
      router.push("/dashboard");
    },
    onError: (err) => handleTrpcError(err),
  });

  const cloneMutation = trpc.form.clone.useMutation({
    onSuccess: (data: any) => {
      utils.form.list.invalidate();
      toast.success("Form cloned!");
      if (data?.id) router.push(`/dashboard/forms/${data.id}`);
    },
    onError: (err) => handleTrpcError(err),
  });

  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);

  // Determine which step set to show
  const basePath = `/dashboard/forms/${formId}`;
  const isPublished = (form as any)?.status === "published";
  const activeSteps = isPublished ? PUBLISHED_STEPS : DRAFT_STEPS;

  // Determine active step from pathname
  const currentStepIndex = activeSteps.findIndex((s) => {
    if (s.id === "build") {
      return pathname === basePath || pathname.startsWith(`${basePath}/fields`);
    }
    return pathname.startsWith(`${basePath}${s.path}`);
  });
  const activeStepIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  const navigateToStep = (index: number) => {
    const step = activeSteps[index];
    if (step) {
      router.push(`${basePath}${step.path}`);
    }
  };

  const startEditingTitle = () => {
    if (!form) return;
    setTitleDraft((form as any).title ?? "");
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== (form as any)?.title) {
      updateMutation.mutate({ formId, title: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const cancelEditTitle = () => {
    setIsEditingTitle(false);
    setTitleDraft((form as any)?.title ?? "");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Form not found</h2>
        <p className="mt-2 text-muted-foreground">
          This form may have been deleted.
        </p>
        <Button variant="forest" asChild className="mt-4">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const formData = form as any;
  const isDraft = formData.status === "draft";
  const isOnPreview = activeSteps[activeStepIndex]?.id === "preview";
  const isArchived = formData.status === "archived";

  return (
    <FormContext.Provider value={{ form, isLoading, refetch }}>
      <div className="flex flex-col flex-1 min-h-0 h-full">
        {/* Top bar */}
        <div className="sticky top-0 z-40 h-14 flex items-center gap-4 px-6 border-b border-border bg-background/95 backdrop-blur shrink-0">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/dashboard")}
            className="shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="size-4" />
          </Button>

          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") cancelEditTitle();
                }}
                className="bg-transparent border-b border-foreground outline-none text-sm font-semibold w-48"
                aria-label="Form title"
              />
            ) : (
              <button
                onClick={startEditingTitle}
                className="text-sm font-semibold hover:underline cursor-text truncate max-w-[200px]"
                title="Click to edit title"
              >
                {formData.title}
                {updateMutation.isPending && (
                  <Spinner className="inline-block ml-1 size-3" />
                )}
              </button>
            )}
            <StatusBadge status={formData.status ?? "draft"} />
          </div>

          {/* Stepper — centered */}
          <div className="flex-1 flex justify-center">
            <nav className="flex items-center gap-1" aria-label="Form navigation">
              {activeSteps.map((step, index) => {
                const isActive = index === activeStepIndex;
                const isCompleted = index < activeStepIndex;
                return (
                  <React.Fragment key={step.id}>
                    {index > 0 && !isPublished && (
                      <div
                        className={cn(
                          "w-8 h-px mx-1",
                          index <= activeStepIndex ? "bg-foreground" : "bg-border",
                        )}
                      />
                    )}
                    <button
                      onClick={() => navigateToStep(index)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        isActive && "bg-foreground text-background",
                        isCompleted && !isPublished && "bg-tint-mint text-tint-mint-ink",
                        !isActive && (!isCompleted || isPublished) && "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      )}
                    >
                      {isCompleted && !isPublished ? (
                        <Check className="size-3" />
                      ) : (
                        <span className={cn(
                          "size-4 rounded-full flex items-center justify-center text-[10px] font-bold border",
                          isActive ? "border-background/50" : "border-current",
                        )}>
                          {isPublished ? <step.icon className="size-3" /> : index + 1}
                        </span>
                      )}
                      {step.label}
                    </button>
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Preview step shows Save Draft + Publish */}
            {isOnPreview && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Save as draft — just ensure status stays draft
                    updateMutation.mutate({ formId }, {
                      onSuccess: () => toast.success("Draft saved!"),
                    });
                  }}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving…" : "Save Draft"}
                </Button>
                {isDraft && (
                  <Button
                    variant="forest"
                    size="sm"
                    onClick={() => publishMutation.mutate({ formId })}
                    disabled={publishMutation.isPending}
                  >
                    {publishMutation.isPending ? "Publishing…" : "Publish"}
                  </Button>
                )}
              </>
            )}

            {isPublished && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => unpublishMutation.mutate({ formId })}
                disabled={unpublishMutation.isPending}
              >
                Unpublish
              </Button>
            )}

            {/* Non-preview steps don't show publish/draft — child pages handle Save & Continue */}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDraft}
                    onClick={() => {
                      if (!isDraft) setShowShareModal(true);
                    }}
                  >
                    <Share2 className="size-4 mr-1" />
                    Share
                  </Button>
                </TooltipTrigger>
                {isDraft && (
                  <TooltipContent>
                    Publish this form before sharing.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => cloneMutation.mutate({ formId })}
                >
                  Duplicate
                </DropdownMenuItem>
                {!isArchived && (
                  <DropdownMenuItem
                    onClick={() => archiveMutation.mutate({ formId })}
                  >
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</div>

        {/* Share modal */}
        <ShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          slug={formData.slug ?? ""}
          status={formData.status ?? "draft"}
          visibility={formData.visibility ?? "public"}
        />

        {/* Delete dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &ldquo;{formData.title}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All responses and analytics will be
                permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() => deleteMutation.mutate({ formId })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FormContext.Provider>
  );
}
