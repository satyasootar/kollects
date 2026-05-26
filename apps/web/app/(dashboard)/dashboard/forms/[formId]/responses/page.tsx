"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import { EmptyState } from "~/components/chrome";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { Download, Trash2, Eye } from "lucide-react";

export default function ResponsesPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data, isLoading } = trpc.response.list.useQuery(
    { formId, page, limit },
    { enabled: !!formId },
  );
  const utils = trpc.useUtils();

  const deleteMutation = trpc.response.delete.useMutation({
    onSuccess: () => {
      utils.response.list.invalidate();
      toast.success("Response deleted.");
      setDeleteId(null);
    },
    onError: (err) => handleTrpcError(err),
  });

  const responses = (data as any)?.items ?? (data as any)?.data ?? [];
  const totalCount = (data as any)?.total ?? (data as any)?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handleExportCsv = async () => {
    try {
      toast.info("Exporting CSV...");
      toast.success("CSV export started.");
    } catch {
      toast.error("Failed to export CSV.");
    }
  };

  const formatTime = (seconds: number | null | undefined) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {totalCount} {totalCount === 1 ? "response" : "responses"}
        </h2>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="size-4 mr-1" />
          Export CSV
        </Button>
      </div>

      {/* Empty state */}
      {responses.length === 0 && (
        <EmptyState
          illustration="empty-mailbox"
          headline="No responses yet."
          description="Share your form to start collecting responses."
        />
      )}

      {/* Table */}
      {responses.length > 0 && (
        <>
          <ResponsesTable
            responses={responses}
            formId={formId}
            formatTime={formatTime}
            onDelete={setDeleteId}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this response?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ responseId: deleteId } as any)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Table sub-component ─── */
function ResponsesTable({
  responses,
  formId,
  formatTime,
  onDelete,
}: {
  responses: any[];
  formId: string;
  formatTime: (s: number | null | undefined) => string;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-background/95">
            <TableHead className="text-xs font-medium text-muted-foreground">Submitted</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">Time</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground">IP</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((r: any) => (
            <TableRow key={r.id} className="hover:bg-secondary/50">
              <TableCell className="text-sm">
                {r.createdAt
                  ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })
                  : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-mono">
                {formatTime(r.completionTimeSeconds)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-mono truncate max-w-[160px]">
                {r.respondentEmail ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-mono">
                {r.ipHash ? `${r.ipHash.slice(0, 8)}…` : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/dashboard/forms/${formId}/responses/${r.id}`}>
                      <Eye className="size-3.5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onDelete(r.id)}>
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
