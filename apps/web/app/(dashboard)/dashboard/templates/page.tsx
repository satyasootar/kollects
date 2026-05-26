"use client";

import * as React from "react";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { EditorialCard, EmptyState } from "~/components/chrome";
import { Badge } from "~/components/ui/badge";
import { toast } from "~/lib/toast";

export default function TemplatesPage() {
  const { data: templates, isLoading } = trpc.template.listSystem.useQuery(undefined);

  const templateList = (templates as any[]) ?? [];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display-lg text-foreground">Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Start with a pre-built form and customize it to your needs.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && templateList.length === 0 && (
        <EmptyState
          illustration="share"
          headline="No templates available."
          description="Templates will appear here once they're created by the system."
        />
      )}

      {/* Template grid */}
      {!isLoading && templateList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateList.map((tpl: any) => (
            <EditorialCard key={tpl.id} interactive className="flex flex-col">
              {/* Preview placeholder */}
              <div className="h-40 -mx-6 -mt-6 rounded-t-2xl mb-4 bg-gradient-to-br from-tint-mint to-tint-peach flex items-center justify-center">
                <span className="text-sm font-medium text-tint-mint-ink opacity-60">
                  Preview
                </span>
              </div>
              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground">{tpl.name}</h3>
              {tpl.category && (
                <Badge variant="outline" className="mt-2 w-fit">
                  {tpl.category}
                </Badge>
              )}
              {tpl.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {tpl.description}
                </p>
              )}
              <div className="mt-auto pt-4 flex items-center justify-between">
                <span className="text-mono-sm text-muted-foreground">
                  {tpl.useCount ?? 0} uses
                </span>
                <Button
                  variant="forest"
                  size="sm"
                  onClick={() => toast.info("Template creation coming soon.")}
                >
                  Use template
                </Button>
              </div>
            </EditorialCard>
          ))}
        </div>
      )}
    </div>
  );
}
