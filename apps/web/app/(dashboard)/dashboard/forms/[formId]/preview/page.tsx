"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Skeleton } from "~/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Monitor, Tablet, Smartphone } from "lucide-react";

const DEVICES = [
  { value: "desktop", label: "Desktop", icon: Monitor, width: 1280 },
  { value: "tablet", label: "Tablet", icon: Tablet, width: 768 },
  { value: "mobile", label: "Mobile", icon: Smartphone, width: 375 },
] as const;

export default function PreviewPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const [device, setDevice] = React.useState<string>("desktop");

  const { data: form, isLoading } = trpc.form.getById.useQuery(
    { formId },
    { enabled: !!formId },
  );

  const formData = form as any;
  const slug = formData?.slug;
  const selectedDevice = DEVICES.find((d) => d.value === device) ?? DEVICES[0];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-[600px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Banner */}
      <div className="flex items-center justify-between">
        <p className="text-mono-sm text-muted-foreground">
          Preview mode — submissions disabled
        </p>
        <ToggleGroup
          type="single"
          value={device}
          onValueChange={(v) => v && setDevice(v)}
          className="gap-1"
        >
          {DEVICES.map((d) => (
            <ToggleGroupItem
              key={d.value}
              value={d.value}
              className="rounded-full border border-border bg-card hover:bg-secondary h-8 w-8 p-0 data-[state=on]:bg-foreground data-[state=on]:text-background"
              aria-label={d.label}
            >
              <d.icon className="size-3.5" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Preview frame */}
      <div className="bg-secondary rounded-2xl p-4 flex justify-center">
        {slug ? (
          <iframe
            src={`/f/${slug}?preview=true`}
            title="Form preview"
            className="bg-background rounded-xl border border-border shadow-sm transition-all duration-300"
            style={{
              width: `${selectedDevice.width}px`,
              maxWidth: "100%",
              height: "600px",
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-[600px] text-muted-foreground text-sm">
            Set a slug in Settings to enable preview.
          </div>
        )}
      </div>
    </div>
  );
}
