"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { EditorialCard } from "~/components/chrome";
import {
  FormThemeProvider,
  loadTheme,
  getRegisteredThemeIds,
} from "~/components/form-themes";
import type { ThemeConfig } from "~/components/form-themes";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { cn } from "~/lib/utils";
import {
  Palette,
  Type,
  Square,
  Sparkles,
  Image,
  Check,
  Upload,
} from "lucide-react";

// Import registration side-effect
import "~/components/form-themes/themes/_register-all";

// ─── Font options for custom theme ───
const DISPLAY_FONTS = [
  { label: "System Default", value: "system-ui, sans-serif" },
  { label: "Recoleta / Fraunces", value: "'Fraunces', serif" },
  { label: "Bangers (Comic)", value: "'Bangers', cursive" },
  { label: "Orbitron (Tech)", value: "'Orbitron', sans-serif" },
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Cormorant Garamond", value: "'Cormorant Garamond', serif" },
  { label: "Big Shoulders", value: "'Big Shoulders Display', sans-serif" },
];

const BODY_FONTS = [
  { label: "System Default", value: "system-ui, sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "Manrope", value: "'Manrope', sans-serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Comic Neue", value: "'Comic Neue', sans-serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Source Sans 3", value: "'Source Sans 3', sans-serif" },
];

// ─── Category filter chips ───
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
  const formId = params.formId;

  const [themes, setThemes] = React.useState<ThemeConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeCategory, setActiveCategory] = React.useState("all");
  const [designMode, setDesignMode] = React.useState<"presets" | "customize">("presets");

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

  const filteredThemes =
    activeCategory === "all"
      ? themes
      : themes.filter((t) => t.category === activeCategory);

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
    <div className="flex h-full">
      {/* Left panel — Theme selection / customization */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Mode toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant={designMode === "presets" ? "forest" : "outline"}
            size="sm"
            onClick={() => setDesignMode("presets")}
          >
            <Sparkles className="size-4 mr-1.5" />
            Preset Themes
          </Button>
          <Button
            variant={designMode === "customize" ? "forest" : "outline"}
            size="sm"
            onClick={() => setDesignMode("customize")}
          >
            <Palette className="size-4 mr-1.5" />
            Customize
          </Button>
        </div>

        {designMode === "presets" ? (
          <>
            {/* Category filter */}
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

            {/* Theme grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredThemes.map((theme) => (
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
          </>
        ) : (
          <ThemeCustomizer formId={formId} currentThemeId={currentThemeId} />
        )}
      </div>

      {/* Right panel — Live preview */}
      <div className="w-[400px] border-l border-border bg-secondary/30 p-6 overflow-y-auto hidden lg:block">
        <div className="sticky top-0">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Live Preview
          </h3>
          <ThemeLivePreview
            themes={themes}
            currentThemeId={currentThemeId}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Theme Card ───
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
    <div
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_oklch(0.22_0.04_180/0.15)]",
        isActive
          ? "ring-2 ring-foreground border-foreground"
          : "border-border hover:border-foreground/20",
      )}
      onClick={onSelect}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 right-3 z-10 size-6 rounded-full bg-foreground text-background flex items-center justify-center">
          <Check className="size-3.5" />
        </div>
      )}

      {/* Mini preview */}
      <div className="h-36 overflow-hidden">
        <FormThemeProvider theme={theme}>
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
                Next →
              </span>
            </div>
          </div>
        </FormThemeProvider>
      </div>

      {/* Info */}
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
          disabled={isActive || isPending}
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

// ─── Theme Customizer ───
function ThemeCustomizer({
  formId,
  currentThemeId,
}: {
  formId: string;
  currentThemeId: string;
}) {
  const [colors, setColors] = React.useState({
    background: "#ffffff",
    surface: "#f9fafb",
    foreground: "#111827",
    accent: "#0d2e2a",
    accentForeground: "#ffffff",
    border: "#e5e7eb",
  });
  const [fonts, setFonts] = React.useState({
    display: "system-ui, sans-serif",
    body: "system-ui, sans-serif",
  });
  const [shape, setShape] = React.useState({
    radius: 10,
    borderWidth: 1,
  });
  const [headerImage, setHeaderImage] = React.useState<string | null>(null);

  return (
    <Tabs defaultValue="colors" className="space-y-4">
      <TabsList className="grid grid-cols-4 w-full max-w-md">
        <TabsTrigger value="colors" className="gap-1.5">
          <Palette className="size-3.5" />
          Colors
        </TabsTrigger>
        <TabsTrigger value="typography" className="gap-1.5">
          <Type className="size-3.5" />
          Fonts
        </TabsTrigger>
        <TabsTrigger value="shape" className="gap-1.5">
          <Square className="size-3.5" />
          Shape
        </TabsTrigger>
        <TabsTrigger value="header" className="gap-1.5">
          <Image className="size-3.5" />
          Header
        </TabsTrigger>
      </TabsList>

      {/* Colors tab */}
      <TabsContent value="colors" className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            label="Background"
            value={colors.background}
            onChange={(v) => setColors((c) => ({ ...c, background: v }))}
          />
          <ColorPicker
            label="Surface"
            value={colors.surface}
            onChange={(v) => setColors((c) => ({ ...c, surface: v }))}
          />
          <ColorPicker
            label="Text"
            value={colors.foreground}
            onChange={(v) => setColors((c) => ({ ...c, foreground: v }))}
          />
          <ColorPicker
            label="Accent"
            value={colors.accent}
            onChange={(v) => setColors((c) => ({ ...c, accent: v }))}
          />
          <ColorPicker
            label="Accent Text"
            value={colors.accentForeground}
            onChange={(v) => setColors((c) => ({ ...c, accentForeground: v }))}
          />
          <ColorPicker
            label="Border"
            value={colors.border}
            onChange={(v) => setColors((c) => ({ ...c, border: v }))}
          />
        </div>

        {/* Quick presets */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setColors(preset.colors)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-foreground/30 transition-colors"
                title={preset.name}
              >
                <div className="flex -space-x-1">
                  <div className="size-4 rounded-full border border-white" style={{ background: preset.colors.background }} />
                  <div className="size-4 rounded-full border border-white" style={{ background: preset.colors.accent }} />
                  <div className="size-4 rounded-full border border-white" style={{ background: preset.colors.foreground }} />
                </div>
                <span className="text-xs font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Typography tab */}
      <TabsContent value="typography" className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Display Font</Label>
            <Select value={fonts.display} onValueChange={(v) => setFonts((f) => ({ ...f, display: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: f.value }}>{f.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Body Font</Label>
            <Select value={fonts.body} onValueChange={(v) => setFonts((f) => ({ ...f, body: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BODY_FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: f.value }}>{f.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Font preview */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <p style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: "1.5rem" }}>
            The quick brown fox
          </p>
          <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: fonts.body }}>
            jumps over the lazy dog. This is how your form text will look.
          </p>
        </div>
      </TabsContent>

      {/* Shape tab */}
      <TabsContent value="shape" className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Border Radius</Label>
              <span className="text-xs font-mono text-muted-foreground">{shape.radius}px</span>
            </div>
            <Slider
              value={[shape.radius]}
              onValueChange={([v]) => setShape((s) => ({ ...s, radius: v ?? 0 }))}
              min={0}
              max={32}
              step={1}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Border Width</Label>
              <span className="text-xs font-mono text-muted-foreground">{shape.borderWidth}px</span>
            </div>
            <Slider
              value={[shape.borderWidth]}
              onValueChange={([v]) => setShape((s) => ({ ...s, borderWidth: v ?? 1 }))}
              min={0}
              max={4}
              step={0.5}
            />
          </div>
        </div>

        {/* Shape preview */}
        <div className="p-4 rounded-xl border border-border bg-card">
          <div
            className="h-10 w-full"
            style={{
              background: colors.surface,
              border: `${shape.borderWidth}px solid ${colors.border}`,
              borderRadius: `${shape.radius}px`,
            }}
          />
          <div
            className="mt-3 h-9 w-28"
            style={{
              background: colors.accent,
              borderRadius: `${shape.radius}px`,
            }}
          />
        </div>
      </TabsContent>

      {/* Header image tab */}
      <TabsContent value="header" className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Header Image</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Add a cover image that appears at the top of your form.
            </p>
            {headerImage ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={headerImage} alt="Header" className="w-full h-40 object-cover" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setHeaderImage(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-foreground/30 transition-colors cursor-pointer">
                <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click or drag to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB. Recommended: 1200×400
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Apply button */}
      <div className="pt-4 border-t border-border">
        <Button variant="forest" className="w-full">
          Apply Custom Theme
        </Button>
      </div>
    </Tabs>
  );
}

// ─── Color Picker ───
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div
            className="size-8 rounded-lg border border-border shadow-sm cursor-pointer"
            style={{ background: value }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// ─── Live Preview ───
function ThemeLivePreview({
  themes,
  currentThemeId,
}: {
  themes: ThemeConfig[];
  currentThemeId: string;
}) {
  const activeTheme = themes.find((t) => t.id === currentThemeId) ?? themes[0];
  if (!activeTheme) return null;

  return (
    <FormThemeProvider theme={activeTheme}>
      <div
        className="rounded-2xl overflow-hidden border border-border shadow-sm"
        style={{ background: activeTheme.colors.background }}
      >
        <div className="p-6 space-y-5">
          {/* Form title */}
          <div>
            <h2
              style={{
                color: activeTheme.colors.foreground,
                fontFamily: activeTheme.fonts.display,
                fontWeight: activeTheme.fonts.weights.display,
                fontSize: `${activeTheme.fonts.scale.hero * 0.7}rem`,
              }}
            >
              Contact Form
            </h2>
            <p
              className="mt-1"
              style={{
                color: activeTheme.colors.foregroundSoft,
                fontFamily: activeTheme.fonts.body,
                fontSize: `${activeTheme.fonts.scale.helper}rem`,
              }}
            >
              We&apos;d love to hear from you
            </p>
          </div>

          {/* Sample fields */}
          <div className="space-y-4">
            <PreviewField
              theme={activeTheme}
              label="Your name"
              placeholder="John Doe"
            />
            <PreviewField
              theme={activeTheme}
              label="Email address"
              placeholder="john@example.com"
            />
            <PreviewField
              theme={activeTheme}
              label="Message"
              placeholder="Tell us more..."
              isTextarea
            />
          </div>

          {/* Submit button */}
          <button
            className="px-5 py-2.5 font-medium text-sm"
            style={{
              background: activeTheme.colors.accent,
              color: activeTheme.colors.accentForeground,
              borderRadius: `${activeTheme.shape.radius}px`,
              fontFamily: activeTheme.fonts.body,
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </FormThemeProvider>
  );
}

function PreviewField({
  theme,
  label,
  placeholder,
  isTextarea,
}: {
  theme: ThemeConfig;
  label: string;
  placeholder: string;
  isTextarea?: boolean;
}) {
  return (
    <div>
      <label
        className="block mb-1.5"
        style={{
          color: theme.colors.foreground,
          fontFamily: theme.fonts.body,
          fontSize: `${theme.fonts.scale.body * 0.85}rem`,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div
        style={{
          background: theme.colors.surface,
          border: `${theme.shape.border.width}px ${theme.shape.border.style} ${theme.colors.border}`,
          borderRadius: `${theme.shape.radius}px`,
          height: isTextarea ? "80px" : "40px",
          padding: "8px 12px",
          fontFamily: theme.fonts.body,
          fontSize: `${theme.fonts.scale.body * 0.8}rem`,
          color: theme.colors.foregroundSoft,
        }}
      >
        {placeholder}
      </div>
    </div>
  );
}

// ─── Color presets ───
const COLOR_PRESETS = [
  {
    name: "Clean",
    colors: {
      background: "#ffffff",
      surface: "#f9fafb",
      foreground: "#111827",
      accent: "#0d2e2a",
      accentForeground: "#ffffff",
      border: "#e5e7eb",
    },
  },
  {
    name: "Dark",
    colors: {
      background: "#0a0a0a",
      surface: "#171717",
      foreground: "#fafafa",
      accent: "#3b82f6",
      accentForeground: "#ffffff",
      border: "#262626",
    },
  },
  {
    name: "Ocean",
    colors: {
      background: "#0f172a",
      surface: "#1e293b",
      foreground: "#f1f5f9",
      accent: "#38bdf8",
      accentForeground: "#0f172a",
      border: "#334155",
    },
  },
  {
    name: "Warm",
    colors: {
      background: "#fffbeb",
      surface: "#ffffff",
      foreground: "#1c1917",
      accent: "#d97706",
      accentForeground: "#ffffff",
      border: "#fde68a",
    },
  },
  {
    name: "Rose",
    colors: {
      background: "#fff1f2",
      surface: "#ffffff",
      foreground: "#1f2937",
      accent: "#e11d48",
      accentForeground: "#ffffff",
      border: "#fecdd3",
    },
  },
  {
    name: "Forest",
    colors: {
      background: "#0f1a14",
      surface: "#15241b",
      foreground: "#e8f0e2",
      accent: "#82c272",
      accentForeground: "#0f1a14",
      border: "#2d4a35",
    },
  },
];
