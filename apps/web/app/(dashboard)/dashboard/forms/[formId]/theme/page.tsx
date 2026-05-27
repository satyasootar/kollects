"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
  loadTheme,
  getRegisteredThemeIds,
} from "~/components/form-themes";
import type { ThemeConfig } from "~/components/form-themes";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { cn } from "~/lib/utils";
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  Check,
  Upload,
  ArrowRight,
  Save,
} from "lucide-react";
import { useFormEditorStore } from "~/lib/stores/form-editor-store";
import { useFormContext } from "../layout";
import { FormPreviewRenderer } from "~/components/form-builder/form-preview-renderer";
import { env } from "~/env.js";

import "~/components/form-themes/themes/_register-all";

const FONT_OPTIONS = [
  { value: "system-ui, sans-serif", label: "System Default" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Fira Code', monospace", label: "Fira Code" },
  { value: "'Comic Sans MS', cursive", label: "Comic Sans MS" },
];

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "marvel", label: "Marvel" },
  { id: "dc", label: "DC" },
  { id: "os", label: "OS" },
  { id: "nature", label: "Nature" },
  { id: "city", label: "City" },
  { id: "custom", label: "Custom" },
] as const;

export default function ThemeDesignPage() {
  const params = useParams<{ formId: string }>();
  const router = useRouter();
  const formId = params.formId;

  const { form, isLoading: isFormLoading, refetch } = useFormContext();
  const store = useFormEditorStore();

  const [themes, setThemes] = React.useState<ThemeConfig[]>([]);
  const [themesLoading, setThemesLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = (env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc").replace("/trpc", "/api/upload");
      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to upload image");
      const data = await res.json();
      store.setCoverImageUrl(data.url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload banner.");
    } finally {
      setIsUploading(false);
    }
  };

  const updateFormMutation = trpc.form.update.useMutation();

  // Load themes
  React.useEffect(() => {
    async function loadAll() {
      const ids = getRegisteredThemeIds();
      const loaded = await Promise.all(ids.map((id) => loadTheme(id)));
      setThemes(loaded);
      setThemesLoading(false);
    }
    loadAll();
  }, []);

  // Initialize store from API data
  React.useEffect(() => {
    if (form && store.formId !== formId) {
      const formData = form as any;
      store.setFormData({
        formId,
        title: formData.title ?? "",
        description: formData.description ?? "",
        fields: formData.fields ?? [],
        themeId: formData.themeId,
        coverImageUrl: formData.coverImageUrl,
        customTheme: formData.settings?.customTheme,
      });
    }
  }, [form, formId]);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const settings = (form as any)?.settings || {};
      if (store.themeId === "custom" && store.customTheme) {
        settings.customTheme = store.customTheme;
      }

      await updateFormMutation.mutateAsync({
        formId,
        themeId: store.themeId ?? undefined,
        coverImageUrl: store.coverImageUrl,
        settings,
      });
      store.markSaved();
      refetch();
      toast.success("Design saved!");
      router.push(`/dashboard/forms/${formId}/preview`);
    } catch (err) {
      handleTrpcError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!store.isDirty) return;
    setIsSaving(true);
    try {
      const settings = (form as any)?.settings || {};
      if (store.themeId === "custom" && store.customTheme) {
        settings.customTheme = store.customTheme;
      }

      await updateFormMutation.mutateAsync({
        formId,
        themeId: store.themeId ?? undefined,
        coverImageUrl: store.coverImageUrl,
        settings,
      });
      store.markSaved();
      refetch();
      toast.success("Draft saved.");
    } catch (err) {
      handleTrpcError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeThemeConfig = React.useMemo(() => {
    if (store.themeId === "custom" && store.customTheme) {
      const custom = store.customTheme;
      const base = themes.find((t) => t.id === "default-light") || themes[0];
      if (!base) return custom;
      return {
        ...base,
        ...custom,
        colors: { ...base.colors, ...(custom.colors || {}) },
        fonts: { ...base.fonts, ...(custom.fonts || {}) },
        shape: { ...base.shape, ...(custom.shape || {}) },
        motion: { ...base.motion, ...(custom.motion || {}) },
        chrome: { ...base.chrome, ...(custom.chrome || {}) },
      };
    }
    return themes.find((t) => t.id === store.themeId) ?? themes[0];
  }, [themes, store.themeId, store.customTheme]);

  if (isFormLoading || themesLoading) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  const filteredThemes =
    activeCategory === "all"
      ? themes
      : themes.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Save bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          {store.isDirty && (
            <span className="text-xs text-muted-foreground bg-tint-butter/60 px-2 py-0.5 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={!store.isDirty || isSaving}
          >
            <Save className="size-3.5 mr-1.5" />
            {isSaving ? "Saving…" : "Save Draft"}
          </Button>
          <Button
            variant="forest"
            size="sm"
            onClick={handleSaveAndContinue}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save & Continue"}
            <ArrowRight className="size-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Theme selection */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Tabs defaultValue="presets" className="space-y-4">
            <TabsList>
              <TabsTrigger value="presets" className="gap-1.5">
                <Sparkles className="size-4" />
                Themes
              </TabsTrigger>
              <TabsTrigger value="header" className="gap-1.5">
                <ImageIcon className="size-4" />
                Cover Image
              </TabsTrigger>
              <TabsTrigger value="customize" className="gap-1.5">
                <Palette className="size-4" />
                Customize
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      activeCategory === cat.id
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredThemes.map((theme) => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={store.themeId === theme.id || (!store.themeId && theme.id === themes[0]?.id)}
                    onSelect={() => store.setThemeId(theme.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-4">
              <div className="max-w-md space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Cover Image URL</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add a cover image that appears at the top of your form.
                  </p>
                  <Input 
                    placeholder="https://example.com/image.jpg" 
                    value={store.coverImageUrl || ""}
                    onChange={(e) => store.setCoverImageUrl(e.target.value)}
                  />
                </div>
                {store.coverImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={store.coverImageUrl} alt="Header" className="w-full h-40 object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => store.setCoverImageUrl(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Label className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-foreground/30 transition-colors cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="size-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">
                      {isUploading ? "Uploading..." : "Click to upload or paste a URL above"}
                    </p>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleUploadBanner} 
                      disabled={isUploading} 
                    />
                  </Label>
                )}
              </div>
            </TabsContent>

            <TabsContent value="customize" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Background</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        value={store.customTheme?.colors?.background || activeThemeConfig.colors.background}
                        onChange={(e) => store.updateCustomTheme({ colors: { background: e.target.value } })}
                      />
                      <Input
                        className="flex-1 font-mono text-xs h-8"
                        value={store.customTheme?.colors?.background || activeThemeConfig.colors.background}
                        onChange={(e) => store.updateCustomTheme({ colors: { background: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Foreground (Text)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        value={store.customTheme?.colors?.foreground || activeThemeConfig.colors.foreground}
                        onChange={(e) => store.updateCustomTheme({ colors: { foreground: e.target.value } })}
                      />
                      <Input
                        className="flex-1 font-mono text-xs h-8"
                        value={store.customTheme?.colors?.foreground || activeThemeConfig.colors.foreground}
                        onChange={(e) => store.updateCustomTheme({ colors: { foreground: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Surface (Cards)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        value={store.customTheme?.colors?.surface || activeThemeConfig.colors.surface}
                        onChange={(e) => store.updateCustomTheme({ colors: { surface: e.target.value } })}
                      />
                      <Input
                        className="flex-1 font-mono text-xs h-8"
                        value={store.customTheme?.colors?.surface || activeThemeConfig.colors.surface}
                        onChange={(e) => store.updateCustomTheme({ colors: { surface: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Accent (Buttons)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="color"
                        className="w-12 h-8 p-1"
                        value={store.customTheme?.colors?.accent || activeThemeConfig.colors.accent}
                        onChange={(e) => store.updateCustomTheme({ colors: { accent: e.target.value } })}
                      />
                      <Input
                        className="flex-1 font-mono text-xs h-8"
                        value={store.customTheme?.colors?.accent || activeThemeConfig.colors.accent}
                        onChange={(e) => store.updateCustomTheme({ colors: { accent: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Typography</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Display Font</Label>
                    <Select
                      value={store.customTheme?.fonts?.display || activeThemeConfig.fonts.display}
                      onValueChange={(val) => store.updateCustomTheme({ fonts: { display: val } })}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs font-mono">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value} className="text-xs" style={{ fontFamily: font.value }}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Body Font</Label>
                    <Select
                      value={store.customTheme?.fonts?.body || activeThemeConfig.fonts.body}
                      onValueChange={(val) => store.updateCustomTheme({ fonts: { body: val } })}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs font-mono">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value} className="text-xs" style={{ fontFamily: font.value }}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Shape</h3>
                <div>
                  <Label className="text-xs">Border Radius (px)</Label>
                  <Input
                    type="number"
                    className="mt-1 w-24 text-xs h-8"
                    value={store.customTheme?.shape?.radius ?? activeThemeConfig.shape.radius}
                    onChange={(e) => store.updateCustomTheme({ shape: { radius: Number(e.target.value) } })}
                  />
                </div>
              </div>
              {!store.customTheme && (
                <div className="p-4 bg-tint-butter/30 rounded-xl text-sm border border-tint-butter">
                  <p>Select a preset theme first, then customize it here to create your own unique look!</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3" 
                    onClick={() => {
                      const baseTheme = themes.find(t => t.id === (store.themeId || "default-light")) || themes[0];
                      store.updateCustomTheme(baseTheme);
                    }}
                  >
                    Start Customizing
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel — Live preview */}
        <div className="w-[450px] border-l border-border bg-[#fafafa] p-6 overflow-y-auto hidden lg:block">
          <div className="sticky top-0 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Live Preview
            </h3>
            <FormPreviewRenderer
              fields={store.fields}
              formTitle={store.title}
              formDescription={store.description}
              coverImageUrl={store.coverImageUrl}
              themeConfig={activeThemeConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
}: {
  theme: ThemeConfig;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_oklch(0.22_0.04_180/0.15)]",
        isActive
          ? "ring-2 ring-foreground border-foreground"
          : "border-border hover:border-foreground/20",
      )}
      onClick={onSelect}
    >
      {isActive && (
        <div className="absolute top-3 right-3 z-10 size-6 rounded-full bg-foreground text-background flex items-center justify-center">
          <Check className="size-3.5" />
        </div>
      )}

      <div className="h-36 overflow-hidden">
        <div
          className="h-full p-5 flex flex-col justify-center"
          style={{ background: theme.colors.background }}
        >
          <p
            style={{
              color: theme.colors.foreground,
              fontFamily: theme.fonts.display,
              fontSize: "1.1rem",
              fontWeight: theme.fonts.weights.display,
              letterSpacing: theme.fonts.letterSpacing?.hero,
              textTransform: theme.fonts.textTransform as any,
            }}
          >
            What&apos;s your name?
          </p>
          <div
            className="mt-3 h-9 rounded"
            style={{
              background: theme.colors.surface,
              border: `${theme.shape.border.width}px ${theme.shape.border.style} ${theme.colors.border}`,
              borderRadius: `${theme.shape.radius}px`,
            }}
          />
          <div
            className="mt-3 h-8 w-24 rounded flex items-center justify-center"
            style={{
              background: theme.colors.accent,
              borderRadius: `${theme.shape.radius}px`,
            }}
          >
            <span
              style={{
                color: theme.colors.accentForeground,
                fontSize: "0.75rem",
                fontFamily: theme.fonts.body,
                fontWeight: 600,
              }}
            >
              Submit
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center justify-between bg-card">
        <div>
          <h3 className="text-sm font-semibold">{theme.name}</h3>
          <Badge variant="outline" className="mt-1 text-[10px] capitalize">
            {theme.category}
          </Badge>
        </div>
        <Button
          variant={isActive ? "outline" : "forest"}
          size="sm"
          disabled={isActive}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isActive ? "Active" : "Use"}
        </Button>
      </div>
    </div>
  );
}
