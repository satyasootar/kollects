"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function SubmissionSuccessPage() {
  const params = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="text-6xl">✓</div>
        <h1 className="text-2xl font-semibold">Thank you for your submission!</h1>
        <p className="text-muted-foreground">
          Your response has been recorded successfully.
        </p>
        <div className="pt-4">
          <Button variant="link-soft" asChild className="p-0 h-auto">
            <Link href="/">← back to kollects.tech</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
