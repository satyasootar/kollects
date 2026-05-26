"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { EditorialCard } from "~/components/chrome";
import { Badge } from "~/components/ui/badge";
import {
  FormThemeProvider,
  loadTheme,
  getRegisteredThemeIds,
} from "~/components/form-themes";
import type { ThemeConfig } from "~/components/form-themes";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";

// Import registration side-effect
import "~/components/form-themes/themes/_register-all";

export default function ThemeTabPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const [themes, setThemes] = React.useState<ThemeConfig[]>([]);
  const [loading, setLoading] = React.useState(true);

  const { data: form } = trpc.form.getById.useQuery(
    { formId },
    { enabled: !!formId },
  );
  const utils = trpc.useUtils();

  const updateMutation = trpc.form.update.useMutation({
    onSuccess: () => {
      utils.form.getById.invalidate({ formId });
      toast.success("Theme applied!");
    },
    onError: (err) => handleTrpcError(err),
  });

  React.useEffect(() => {
    async function loadAll() {
      const ids = getRegisteredThemeIds();
      const loaded = await Promise.all(ids.map((id) => loadTheme(id)));
      setThemes(loaded);
      setLoading(false);
    }
    loadAll();
  }, []);

  const currentThemeId = (form as any)?.themeId ?? "default-light";

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Choose a theme</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={currentThemeId === theme.id}
            isPending={updateMutation.isPending}
            onSelect={() =>
              updateMutation.mutate({ formId, themeId: theme.id } as any)
            }
          />
        ))}
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  isPending,
  onSelect,
}: {
  theme: ThemeConfig;
  isActive: boolean;
  isPending: boolean;
  onSelect: () => void;
}) {
  return (
    <EditorialCard
      interactive
      className={isActive ? "ring-2 ring-foreground" : ""}
    >
      {/* Mini preview */}
      <div className="h-32 -mx-6 -mt-6 rounded-t-2xl mb-4 overflow-hidden">
        <FormThemeProvider theme={theme}>
          <div
            className="h-full p-4 flex flex-col justify-center"
            style={{ background: theme.colors.background }}
          >
            <p
              style={{
                color: theme.colors.foreground,
                fontFamily: theme.fonts.display,
                fontSize: "1.25rem",
                fontWeight: theme.fonts.weights.display,
              }}
            >
              Sample question?
            </p>
            <div
              className="mt-2 h-8 rounded"
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          </div>
        </FormThemeProvider>
      </div>
      {/* Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{theme.name}</h3>
          <Badge variant="outline" className="mt-1 text-xs capitalize">
            {theme.category}
          </Badge>
        </div>
        <Button
          variant="forest"
          size="sm"
          disabled={isActive || isPending}
          onClick={onSelect}
        >
          {isActive ? "Active" : "Use theme"}
        </Button>
      </div>
    </EditorialCard>
  );
}
