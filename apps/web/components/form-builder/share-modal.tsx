"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TintCard, StatusBadge } from "~/components/chrome";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { toast } from "~/lib/toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  status: string;
  visibility: string;
}

export function ShareModal({
  open,
  onOpenChange,
  slug,
  status,
  visibility,
}: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/f/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.info("Link copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share your form</DialogTitle>
          <DialogDescription>
            Copy the link or scan the QR code to share this form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === "draft" && (
            <TintCard tint="butter" className="p-4">
              <p className="text-sm font-medium">
                Publish this form before sharing — it&apos;s currently a draft.
              </p>
            </TintCard>
          )}

          <div className="flex items-center gap-2">
            <StatusBadge status={visibility as any} />
          </div>

          <div className="flex gap-2">
            <Input
              value={url}
              readOnly
              className="font-mono text-xs h-10"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

          <div className="flex justify-center py-4">
            <QRCodeSVG value={url} size={160} level="M" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
