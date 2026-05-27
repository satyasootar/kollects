"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { API_SCOPES } from "@repo/database/constants/api-scopes";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "~/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { TintCard, Doodle, EmptyState } from "~/components/chrome";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { Copy, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
});

export default function ApiKeysPage() {
  const { data: keys, isLoading } = trpc.apiKey.list.useQuery(undefined);
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = React.useState(false);
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null);
  const [revokeId, setRevokeId] = React.useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateApiKeyInput>({
    resolver: zodResolver(createApiKeySchema),
  });

  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: (data: any) => {
      utils.apiKey.list.invalidate();
      setShowCreate(false);
      reset();
      setRevealedKey(data?.key ?? data?.fullKey ?? "sk_live_...");
      toast.success("API key created!");
    },
    onError: (err) => handleTrpcError(err),
  });

  const revokeMutation = trpc.apiKey.revoke.useMutation({
    onSuccess: () => {
      utils.apiKey.list.invalidate();
      setRevokeId(null);
      toast.success("API key revoked.");
    },
    onError: (err) => handleTrpcError(err),
  });

  const keyList = (keys as any[]) ?? [];

  const handleCopyKey = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      toast.info("Key copied to clipboard.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">API Keys</h1>
        <Button variant="forest" onClick={() => setShowCreate(true)}>Create API Key</Button>
      </div>

      {revealedKey && (
        <TintCard tint="butter" className="relative">
          <Doodle name="arrow-down-right" className="absolute top-3 right-3 size-5" />
          <p className="text-xs font-medium mb-2">Your new API key (shown only once):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-background/50 rounded px-3 py-2 break-all">
              {revealedKey}
            </code>
            <Button variant="outline" size="icon-sm" onClick={handleCopyKey}>
              <Copy className="size-3.5" />
            </Button>
          </div>
          <Button variant="link-soft" className="mt-3 p-0 h-auto text-xs" onClick={() => setRevealedKey(null)}>
            Done — I&apos;ve copied it
          </Button>
        </TintCard>
      )}

      {keyList.length === 0 && !revealedKey && (
        <EmptyState
          illustration="locked"
          headline="No API keys yet."
          description="Create one to integrate Kollects with your stack."
          action={<Button variant="forest" onClick={() => setShowCreate(true)}>Create API key</Button>}
        />
      )}

      {keyList.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Key</TableHead>
                <TableHead className="text-xs">Scopes</TableHead>
                <TableHead className="text-xs">Created</TableHead>
                <TableHead className="text-xs w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keyList.map((k: any) => (
                <TableRow key={k.id}>
                  <TableCell className="text-sm font-medium">{k.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {k.prefix ?? "sk_live_…"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(k.scopes ?? []).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {k.createdAt ? formatDistanceToNow(new Date(k.createdAt), { addSuffix: true }) : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => setRevokeId(k.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create API Key</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Name</Label>
              <Input id="keyName" {...register("name")} placeholder="My integration" className="h-11" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="flex flex-wrap gap-3">
                {API_SCOPES.map((scope) => (
                  <label key={scope} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" value={scope} {...register("scopes")} /> {scope}
                  </label>
                ))}
              </div>
              {errors.scopes && <p className="text-xs text-destructive">{errors.scopes.message}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" variant="forest" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeId} onOpenChange={(o) => !o && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
            <AlertDialogDescription>This action is immediate and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => revokeId && revokeMutation.mutate({ id: revokeId })}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
