"use client";

import * as React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { trpc } from "~/trpc/client";
import { useParams } from "next/navigation";
import { FormPreviewRenderer } from "~/components/form-builder/form-preview-renderer";
import { loadTheme, type ThemeConfig } from "~/components/form-themes";
import "~/components/form-themes/themes/_register-all";
import { useFormEditorStore } from "~/lib/stores/form-editor-store";

const DEVICES = [
  { value: "desktop", label: "Desktop", icon: Monitor, width: 1280 },
  { value: "tablet", label: "Tablet", icon: Tablet, width: 768 },
  { value: "mobile", label: "Mobile", icon: Smartphone, width: 375 },
] as const;

export default function PreviewPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const { data: form, isLoading } = trpc.form.getByIdWithFields.useQuery(
    { formId },
    { enabled: !!formId }
  );
  const store = useFormEditorStore();
  const [device, setDevice] = React.useState<string>("desktop");
  const [themeConfig, setThemeConfig] = React.useState<ThemeConfig | null>(null);

  const selectedDevice = DEVICES.find((d) => d.value === device) ?? DEVICES[0];

  // Initialize store from API data on first load or when form data changes
  React.useEffect(() => {
    if (form && store.formId !== form.id) {
      const formData = form as any;
      store.setFormData({
        formId: form.id,
        title: formData.title ?? "",
        description: formData.description ?? "",
        fields: formData.fields ?? [],
        themeId: formData.themeId,
        coverImageUrl: formData.coverImageUrl,
        customTheme: formData.settings?.customTheme,
      });
    }
  }, [form, store]);

  React.useEffect(() => {
    async function fetchTheme() {
      if (store.themeId) {
        const t = await loadTheme(store.themeId);
        setThemeConfig(t);
      } else {
        const defaultTheme = await loadTheme("default-light");
        setThemeConfig(defaultTheme);
      }
    }
    // Only fetch theme if the store has been hydrated for this form (or if it's explicitly null)
    if (store.formId) {
      fetchTheme();
    }
  }, [store.themeId, store.formId]);

  const activeThemeConfig = React.useMemo(() => {
    if (!themeConfig) return null;
    if (store.customTheme) {
      const custom = store.customTheme;
      return {
        ...themeConfig,
        ...custom,
        colors: { ...themeConfig.colors, ...(custom.colors || {}) },
        fonts: { ...themeConfig.fonts, ...(custom.fonts || {}) },
        shape: { ...themeConfig.shape, ...(custom.shape || {}) },
        motion: { ...themeConfig.motion, ...(custom.motion || {}) },
        chrome: { ...themeConfig.chrome, ...(custom.chrome || {}) },
      };
    }
    return themeConfig;
  }, [themeConfig, store.customTheme]);

  if (isLoading || !activeThemeConfig) {
    return (
      <div className="p-6 h-screen">
        <Skeleton className="h-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col h-screen">
      {/* Banner */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground font-medium">
            Preview mode
          </p>
          {store.isDirty && (
            <span className="text-xs text-muted-foreground bg-tint-butter/60 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        <ToggleGroup
          type="single"
          value={device}
          onValueChange={(v) => v && setDevice(v)}
          className="gap-1 bg-background border border-border p-1 rounded-full"
        >
          {DEVICES.map((d) => (
            <ToggleGroupItem
              key={d.value}
              value={d.value}
              className="rounded-full h-8 w-8 p-0 data-[state=on]:bg-foreground data-[state=on]:text-background text-muted-foreground hover:text-foreground"
              aria-label={d.label}
            >
              <d.icon className="size-3.5" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Preview container */}
      <div 
        className="rounded-2xl p-8 flex-1 overflow-auto flex justify-center border border-border/50 transition-colors duration-300"
        style={{ backgroundColor: activeThemeConfig.colors.background }}
      >
        <div
          className="transition-all duration-300 ease-in-out"
          style={{ width: `${selectedDevice.width}px`, maxWidth: "100%" }}
        >
          <FormPreviewRenderer
            fields={store.fields ?? []}
            formTitle={store.title ?? ""}
            formDescription={store.description ?? ""}
            coverImageUrl={store.coverImageUrl}
            themeConfig={activeThemeConfig}
            className="min-h-[600px] shadow-sm max-w-2xl mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
