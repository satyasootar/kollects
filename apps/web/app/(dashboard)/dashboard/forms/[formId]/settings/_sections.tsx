"use client";

import { FORM_VISIBILITIES } from "@repo/database/constants/form-visibility";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { EditorialCard } from "~/components/chrome";

/* ─── General Section ─── */

export function GeneralSection({
  register,
  errors,
}: {
  register: any;
  errors: any;
}) {
  return (
    <EditorialCard>
      <h2 className="text-xl font-semibold mb-4">General</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} className="h-11" />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} rows={3} />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="coverImage">Cover image</Label>
          <Input id="coverImage" type="file" accept="image/*" className="h-11" />
          <p className="text-xs text-muted-foreground">
            Upload a cover image (max 5MB). JPG, PNG, WebP, or GIF.
          </p>
        </div>
      </div>
    </EditorialCard>
  );
}

/* ─── URL & SEO Section ─── */

export function SeoSection({
  register,
  slugValue,
  slugStatus,
  onSlugChange,
}: {
  register: any;
  slugValue: string;
  slugStatus: "idle" | "valid" | "invalid" | "reserved";
  onSlugChange: (value: string) => void;
}) {
  return (
    <EditorialCard>
      <h2 className="text-xl font-semibold mb-4">URL &amp; SEO</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="slug">Custom slug</Label>
          <Input
            id="slug"
            value={slugValue}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="my-form-slug"
            className="h-11 font-mono"
          />
          {slugStatus === "reserved" && (
            <p className="text-xs text-destructive">This slug is reserved.</p>
          )}
          {slugStatus === "invalid" && (
            <p className="text-xs text-destructive">
              Slug must be 3–80 chars, lowercase letters, numbers, and hyphens
              only.
            </p>
          )}
          {slugStatus === "valid" && (
            <p className="text-xs text-green-600">Available</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaTitle">
            Meta title{" "}
            <span className="text-muted-foreground">(max 60)</span>
          </Label>
          <Input
            id="metaTitle"
            {...register("metaTitle")}
            maxLength={60}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaDescription">
            Meta description{" "}
            <span className="text-muted-foreground">(max 160)</span>
          </Label>
          <Textarea
            id="metaDescription"
            {...register("metaDescription")}
            maxLength={160}
            rows={2}
          />
        </div>
      </div>
    </EditorialCard>
  );
}

/* ─── Access Control Section ─── */

export function AccessControlSection({
  visibility,
  onVisibilityChange,
}: {
  visibility: string | undefined;
  onVisibilityChange: (value: string) => void;
}) {
  return (
    <EditorialCard>
      <h2 className="text-xl font-semibold mb-4">Access Control</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Visibility</Label>
          <RadioGroup
            value={visibility ?? "public"}
            onValueChange={onVisibilityChange}
            className="space-y-2"
          >
            {FORM_VISIBILITIES.map((vis) => (
              <div key={vis} className="flex items-center gap-2">
                <RadioGroupItem value={vis} id={`vis-${vis}`} />
                <Label htmlFor={`vis-${vis}`} className="capitalize">
                  {vis}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </EditorialCard>
  );
}

/* ─── Behavior Section ─── */

export function BehaviorSection({
  register,
  showProgressBar,
  allowMultiple,
  onProgressBarChange,
  onAllowMultipleChange,
}: {
  register: any;
  showProgressBar: boolean | undefined;
  allowMultiple: boolean | undefined;
  onProgressBarChange: (value: boolean) => void;
  onAllowMultipleChange: (value: boolean) => void;
}) {
  return (
    <EditorialCard>
      <h2 className="text-xl font-semibold mb-4">Behavior</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="successMessage">Success message</Label>
          <Textarea
            id="successMessage"
            {...register("settings.successMessage")}
            maxLength={500}
            rows={2}
            placeholder="Thank you for your submission!"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="redirectUrl">Redirect URL</Label>
          <Input
            id="redirectUrl"
            {...register("settings.redirectUrl")}
            placeholder="https://example.com/thank-you"
            className="h-11"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="showProgressBar">Show progress bar</Label>
          <Switch
            id="showProgressBar"
            checked={showProgressBar ?? true}
            onCheckedChange={onProgressBarChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="allowMultiple">Allow multiple submissions</Label>
          <Switch
            id="allowMultiple"
            checked={allowMultiple ?? false}
            onCheckedChange={onAllowMultipleChange}
          />
        </div>
      </div>
    </EditorialCard>
  );
}

/* ─── Danger Zone Section ─── */

export function DangerZoneSection({ onDelete }: { onDelete: () => void }) {
  return (
    <EditorialCard className="border-destructive/30 bg-destructive/5">
      <h2 className="text-xl font-semibold text-destructive mb-4">
        Danger Zone
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Deleting this form is permanent. All responses and analytics will be
        lost.
      </p>
      <Button type="button" variant="destructive" onClick={onDelete}>
        Delete this form
      </Button>
    </EditorialCard>
  );
}
