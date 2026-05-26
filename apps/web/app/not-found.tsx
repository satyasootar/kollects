import Link from "next/link";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/chrome";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <EmptyState
        illustration="broken"
        headline="Lost in the margin notes."
        description="The page you're looking for doesn't exist or has been moved."
        action={
          <div className="flex gap-3">
            <Button variant="forest" asChild>
              <Link href="/">Go home</Link>
            </Button>
            <Button variant="link-soft" asChild>
              <Link href="/explore">Explore forms</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
