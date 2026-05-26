"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/chrome";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      illustration="broken"
      headline="Something snapped."
      description="We logged the error. Try again or head home."
      action={
        <div className="flex gap-3">
          <Button variant="forest" onClick={reset}>
            Try again
          </Button>
          <Button variant="link-soft" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      }
    />
  );
}
