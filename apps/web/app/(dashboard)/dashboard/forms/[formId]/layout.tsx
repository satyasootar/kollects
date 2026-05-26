"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import {
  StatusBadge,
  UnderlineTabs,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from "~/components/chrome";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
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
import { MoreHorizontal, Share2, Eye } from "lucide-react";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { ShareModal } from "~/components/form-builder/share-modal";

const TABS = [
  { value: "fields", label: "Fields", path: "" },
  { value: "settings", label: "Settings", path: "/settings" },
  { value: "theme", label: "Theme", path: "/theme" },
  { value: "responses", label: "Responses", path: "/responses" },
  { value: "analytics", label: "Analytics", path: "/analytics" },
  { value: "emails", label: "Emails", path: "/email-settings" },
  { value: "preview", label: "Preview", path: "/preview" },
] as const;

export default function FormEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ formId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const formId = params.formId;

  const { data: form, isLoading } = trpc.form.getById.useQuery(
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
      utils.form.getById.invalidate({ formId });
      utils.form.list.invalidate();
    },
    onError: (err) => handleTrpcError(err),
  });

  const publishMutation = trpc.form.publish.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId });
      utils.form.list.invalidate();
      toast.success("Form published!");
    },
    onError: (err) => handleTrpcError(err),
  });

  const unpublishMutation = trpc.form.unpublish.useMutation({
    onSuccess: () => {
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

  // Determine active tab from pathname
  const basePath = `/dashboard/forms/${formId}`;
  const activeTab =
    TABS.find((t) => {
      if (t.path === "")
        return pathname === basePath || pathname.startsWith(`${basePath}/fields`);
      return pathname.startsWith(`${basePath}${t.path}`);
    })?.value ?? "fields";

  const handleTabChange = (value: string) => {
    const tab = TABS.find((t) => t.value === value);
    if (tab) {
      const path = tab.path === "" ? `${basePath}/fields` : `${basePath}${tab.path}`;
      router.push(path);
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
  const isPublished = formData.status === "published";
  const isArchived = formData.status === "archived";

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-40 h-14 flex items-center gap-4 px-6 border-b border-border bg-background/95 backdrop-blur">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
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
                    className="bg-transparent border-b border-foreground outline-none text-sm font-medium w-48"
                    aria-label="Form title"
                  />
                ) : (
                  <button
                    onClick={startEditingTitle}
                    className="text-sm font-medium hover:underline cursor-text"
                    title="Click to edit title"
                  >
                    {formData.title}
                    {updateMutation.isPending && (
                      <Spinner className="inline-block ml-1 size-3" />
                    )}
                  </button>
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Status badges */}
        <div className="flex items-center gap-2 ml-2">
          <StatusBadge status={formData.status ?? "draft"} />
          {formData.visibility && <StatusBadge status={formData.visibility} />}
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 ml-auto">
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
          {isPublished && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unpublishMutation.mutate({ formId })}
              disabled={unpublishMutation.isPending}
            >
              Unpublish
            </Button>
          )}

          <Button variant="outline" size="sm" asChild>
            <Link href={`${basePath}/preview`}>
              <Eye className="size-4 mr-1" />
              Preview
            </Link>
          </Button>

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

      {/* Tabs */}
      <div className="px-6">
        <UnderlineTabs value={activeTab} onValueChange={handleTabChange}>
          <UnderlineTabsList>
            {TABS.map((tab) => (
              <UnderlineTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </UnderlineTabsTrigger>
            ))}
          </UnderlineTabsList>
        </UnderlineTabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>

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
  );
}
