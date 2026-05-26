"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { EditorialCard, SurfaceCard } from "~/components/chrome";
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
import { Badge } from "~/components/ui/badge";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { Star, Link2 } from "lucide-react";

export default function ResponseDetailPage() {
  const params = useParams<{ formId: string; responseId: string }>();
  const router = useRouter();
  const { formId, responseId } = params;
  const [showDelete, setShowDelete] = React.useState(false);

  const { data: response, isLoading } = trpc.response.getById.useQuery(
    { responseId } as any,
    { enabled: !!responseId },
  );
  const utils = trpc.useUtils();

  const deleteMutation = trpc.response.delete.useMutation({
    onSuccess: () => {
      utils.response.list.invalidate();
      toast.success("Response deleted.");
      router.push(`/dashboard/forms/${formId}/responses`);
    },
    onError: (err) => handleTrpcError(err),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const r = response as any;
  if (!r) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Response not found.</p>
        <Button variant="link-soft" asChild className="mt-2 p-0 h-auto">
          <Link href={`/dashboard/forms/${formId}/responses`}>← Back to responses</Link>
        </Button>
      </div>
    );
  }

  const answers: any[] = r.answers ?? [];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back link */}
      <Button variant="link-soft" asChild className="p-0 h-auto">
        <Link href={`/dashboard/forms/${formId}/responses`}>← Back to responses</Link>
      </Button>

      {/* Metadata */}
      <EditorialCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Submitted</p>
            <p className="font-medium">
              {r.createdAt ? format(new Date(r.createdAt), "PPP p") : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Completion time</p>
            <p className="font-mono">
              {r.completionTimeSeconds ? `${r.completionTimeSeconds}s` : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-mono truncate">{r.respondentEmail ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">IP hash</p>
            <p className="font-mono">{r.ipHash ? `${r.ipHash.slice(0, 8)}…` : "—"}</p>
          </div>
        </div>
      </EditorialCard>

      {/* Answers */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Answers</h3>
        {answers.length === 0 && (
          <p className="text-sm text-muted-foreground">No answers recorded.</p>
        )}
        {answers.map((a: any, i: number) => (
          <SurfaceCard key={i}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {a.fieldLabel ?? `Field ${i + 1}`}
                </p>
                <div className="mt-1">
                  <AnswerValue answer={a} />
                </div>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {/* Delete */}
      <div className="pt-4">
        <Button variant="destructive" onClick={() => setShowDelete(true)}>
          Delete response
        </Button>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this response?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate({ responseId } as any)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Answer renderer ─── */
function AnswerValue({ answer }: { answer: any }) {
  const value = answer.value;
  const type = answer.fieldType;

  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (type === "checkbox") {
    return <span className="font-mono text-sm">{value ? "Yes" : "No"}</span>;
  }

  if (type === "rating") {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: Number(value) }).map((_, i) => (
          <Star key={i} className="size-4 fill-current text-amber-500" />
        ))}
      </div>
    );
  }

  if (type === "multi_select" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v: string) => (
          <Badge key={v} variant="outline">{v}</Badge>
        ))}
      </div>
    );
  }

  if (type === "url" && typeof value === "string") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-foreground underline flex items-center gap-1"
      >
        <Link2 className="size-3.5" />
        {value}
      </a>
    );
  }

  return <p className="text-sm">{String(value)}</p>;
}
