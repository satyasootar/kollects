"use client";

import * as React from "react";
import Link from "next/link";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { DotField, Doodle, EditorialCard, EmptyState } from "~/components/chrome";
import { StatusBadge } from "~/components/chrome";

export default function ExplorePage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = trpc.publicExplore.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage: any) => lastPage?.nextCursor ?? undefined,
    },
  );

  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const forms = data?.pages.flatMap((page: any) => page.items ?? page.data ?? []) ?? [];

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-16 px-6 text-center overflow-hidden">
        <DotField />
        <h1 className="text-display-lg text-foreground relative z-10">
          Forms made by humans{" "}
          <span className="text-tint-peach-ink relative inline-block">
            worth filling
            <Doodle
              name="underline-wave"
              className="absolute left-0 -bottom-2 w-full h-2"
            />
          </span>
          .
        </h1>
      </section>

      {/* Filter chips (UI-only for now) */}
      <section className="px-6 pb-6 max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-2">
          {["All", "Tech", "Events", "Communities", "Education", "Fun"].map(
            (category, i) => (
              <Button
                key={category}
                variant={i === 0 ? "forest" : "chip"}
                size="chip"
              >
                {category}
              </Button>
            ),
          )}
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            illustration="broken"
            headline="Something went wrong."
            description="We couldn't load the forms. Please try again."
            action={
              <Button variant="forest" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        )}

        {!isLoading && !isError && forms.length === 0 && (
          <EmptyState
            illustration="collect"
            headline="No public forms yet — be the first."
            description="Create and publish a form to see it here."
            action={
              <Button variant="forest" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            }
          />
        )}

        {forms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form: any) => (
              <Link
                key={form.id}
                href={`/f/${form.slug}`}
                prefetch={false}
                className="block"
              >
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
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                    {form.title}
                  </h3>
                  {form.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {form.description}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <StatusBadge status={form.status ?? "published"} />
                    <span className="text-mono-sm text-muted-foreground ml-auto">
                      {form.submissionCount ?? 0} responses
                    </span>
                  </div>
                </EditorialCard>
              </Link>
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasNextPage && (
          <div ref={sentinelRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex gap-2">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
