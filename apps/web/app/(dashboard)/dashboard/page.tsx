"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLAN_LIMITS } from "@repo/database";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  TintCard,
  NumberTicker,
  Doodle,
  EditorialCard,
  StatusBadge,
  EmptyState,
} from "~/components/chrome";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
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
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { toast } from "~/lib/toast";

type FormStatus = "all" | "draft" | "published" | "archived";

export default function DashboardPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<FormStatus>("all");
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);

  const { data: user } = trpc.auth.me.useQuery(undefined);
  const { data: forms, isLoading } = trpc.form.list.useQuery(undefined);
  const utils = trpc.useUtils();

  const publishMutation = trpc.form.publish.useMutation({
    onSuccess: () => {
      utils.form.list.invalidate();
      toast.success("Form published!");
    },
    onError: () => toast.error("Failed to publish form."),
  });

  const unpublishMutation = trpc.form.unpublish.useMutation({
    onSuccess: () => {
      utils.form.list.invalidate();
      toast.success("Form unpublished.");
    },
    onError: () => toast.error("Failed to unpublish form."),
  });

  const archiveMutation = trpc.form.archive.useMutation({
    onSuccess: () => {
      utils.form.list.invalidate();
      toast.success("Form archived.");
    },
    onError: () => toast.error("Failed to archive form."),
  });

  const deleteMutation = trpc.form.delete.useMutation({
    onSuccess: () => {
      utils.form.list.invalidate();
      toast.success("Form deleted.");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete form."),
  });

  const cloneMutation = trpc.form.clone.useMutation({
    onSuccess: (data: any) => {
      utils.form.list.invalidate();
      toast.success("Form cloned!");
      if (data?.id) router.push(`/dashboard/forms/${data.id}`);
    },
    onError: () => toast.error("Failed to clone form."),
  });

  const formList = forms ?? [];
  const filteredForms = statusFilter === "all"
    ? formList
    : formList.filter((f: any) => f.status === statusFilter);

  // Stats
  const totalForms = formList.length;
  const totalResponses = formList.reduce((sum: number, f: any) => sum + (f.submissionCount ?? f.responseCount ?? 0), 0);
  const avgCompletion = formList.length > 0
    ? Math.round(formList.reduce((sum: number, f: any) => sum + (f.completionRate ?? 0), 0) / formList.length)
    : 0;

  // Plan limit warning
  const plan = (user as any)?.plan ?? "free";
  const formLimit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.formLimit ?? 5;
  const showLimitWarning = formLimit > 0 && totalForms >= formLimit - 1 && plan !== "enterprise";

  return (
    <div className="p-6 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display-lg text-foreground">
            Your forms,
            <br />
            in{" "}
            <span className="text-tint-blush-ink relative inline-block">
              one
              <Doodle
                name="underline-wave"
                className="absolute left-0 -bottom-1 w-full h-2"
              />
            </span>{" "}
            place.
          </h1>
        </div>
        <Button variant="forest" asChild>
          <Link href="/dashboard/forms/new" className="flex items-center gap-2">
            <Doodle name="sparkle" className="size-4" />
            Create form
          </Link>
        </Button>
      </div>

      {/* Plan limit warning */}
      {showLimitWarning && (
        <TintCard tint="butter" className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Almost full — {totalForms} of {formLimit} forms used.
          </p>
          <Button variant="link-soft" asChild className="p-0 h-auto">
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </TintCard>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TintCard tint="mint">
          <TintCard.Number>
            <NumberTicker value={totalForms} />
            <Doodle name="swirl" className="inline-block size-4 ml-1" />
          </TintCard.Number>
          <TintCard.Caption>Forms</TintCard.Caption>
        </TintCard>
        <TintCard tint="peach">
          <TintCard.Number>
            <NumberTicker value={totalResponses} />
          </TintCard.Number>
          <TintCard.Caption>Total responses</TintCard.Caption>
        </TintCard>
        <TintCard tint="forest">
          <TintCard.Number>
            <NumberTicker value={avgCompletion} suffix="%" />
          </TintCard.Number>
          <TintCard.Caption>Avg completion</TintCard.Caption>
        </TintCard>
        <TintCard tint="butter">
          <TintCard.Number>
            <NumberTicker value={totalResponses > 0 ? Math.min(totalResponses, 99) : 0} />
          </TintCard.Number>
          <TintCard.Caption>This week</TintCard.Caption>
        </TintCard>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <ToggleGroup
          type="single"
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v as FormStatus)}
          className="gap-2"
        >
          {(["all", "draft", "published", "archived"] as const).map((s) => (
            <ToggleGroupItem
              key={s}
              value={s}
              className="rounded-full border border-border bg-card hover:bg-secondary text-foreground font-medium h-9 px-4 data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Form grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && filteredForms.length === 0 && (
        <EmptyState
          illustration="ship-form"
          headline="Nothing here yet."
          description="Create your first form to start collecting."
          action={
            <Button variant="forest" asChild>
              <Link href="/dashboard/forms/new">Create form</Link>
            </Button>
          }
        />
      )}

      {!isLoading && filteredForms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map((form: any) => (
            <ContextMenu key={form.id}>
              <ContextMenuTrigger asChild>
                <Link href={`/dashboard/forms/${form.id}`} className="block">
                  <EditorialCard interactive className="h-full flex flex-col">
                    {/* Cover strip */}
                    <div
                      className="h-10 -mx-6 -mt-6 rounded-t-2xl mb-4"
                      style={{
                        background: form.coverImageUrl
                          ? `url(${form.coverImageUrl}) center/cover`
                          : `linear-gradient(135deg, var(--tint-mint), var(--tint-peach))`,
                      }}
                    />
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                        {form.title}
                      </h3>
                      <StatusBadge status={form.status ?? "draft"} />
                    </div>
                    {/* Description */}
                    {form.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {form.description}
                      </p>
                    )}
                    {/* Stats */}
                    <div className="mt-auto pt-4 text-mono-sm text-muted-foreground">
                      {form.viewCount ?? 0} views · {form.startCount ?? 0} starts · {form.submissionCount ?? 0} subs
                    </div>
                  </EditorialCard>
                </Link>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}`)}>
                  Edit
                </ContextMenuItem>
                <ContextMenuItem onClick={() => cloneMutation.mutate({ formId: form.id })}>
                  Duplicate
                </ContextMenuItem>
                {form.status === "draft" && (
                  <ContextMenuItem onClick={() => publishMutation.mutate({ formId: form.id })}>
                    Publish
                  </ContextMenuItem>
                )}
                {form.status === "published" && (
                  <ContextMenuItem onClick={() => unpublishMutation.mutate({ formId: form.id })}>
                    Unpublish
                  </ContextMenuItem>
                )}
                {form.status !== "archived" && (
                  <ContextMenuItem onClick={() => archiveMutation.mutate({ formId: form.id })}>
                    Archive
                  </ContextMenuItem>
                )}
                <ContextMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteTarget({ id: form.id, title: form.title })}
                >
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All responses and analytics for this form will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate({ formId: deleteTarget.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
