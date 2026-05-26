"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFormSchema } from "@repo/database";
import type { z } from "zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { Doodle } from "~/components/chrome";
import { applyServerFieldErrors } from "~/lib/form-helpers";
import { handleTrpcError } from "~/lib/api-error";
import { toast } from "~/lib/toast";

type CreateFormInput = z.input<typeof createFormSchema>;

export default function CreateFormPage() {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormInput>({
    resolver: zodResolver(createFormSchema),
  });

  const { data: templates, isLoading: templatesLoading } =
    trpc.template.listSystem.useQuery(undefined);

  const createMutation = trpc.form.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Form created!");
      router.replace(`/dashboard/forms/${data.id}`);
    },
    onError: (err) => {
      if (!applyServerFieldErrors<CreateFormInput>(err, setError)) {
        handleTrpcError(err);
      }
    },
  });

  const onSubmit = (data: CreateFormInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display-md text-foreground">
          Start{" "}
          <span className="text-tint-peach-ink relative inline-block">
            something
            <Doodle
              name="sparkle"
              className="absolute -right-6 -top-2 size-5"
            />
          </span>
          .
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="My awesome form"
            className="h-12 text-lg"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? "title-error" : undefined}
            {...register("title")}
          />
          {errors.title && (
            <p id="title-error" className="text-xs text-destructive" aria-live="polite">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What's this form about? (optional)"
            rows={3}
            className="resize-none"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-destructive" aria-live="polite">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Templates horizontal scroller */}
        {templatesLoading && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-48 shrink-0 rounded-xl" />
            ))}
          </div>
        )}

        {templates && (templates as any[]).length > 0 && (
          <div className="space-y-2">
            <Label>Or start from a template</Label>
            <div className="flex gap-3 overflow-x-auto snap-x pb-2">
              {(templates as any[]).map((tpl: any) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() =>
                    setSelectedTemplateId(
                      selectedTemplateId === tpl.id ? null : tpl.id,
                    )
                  }
                  className={`shrink-0 w-48 h-32 rounded-xl border-2 p-4 text-left transition-all snap-start ${
                    selectedTemplateId === tpl.id
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <p className="text-sm font-semibold line-clamp-1">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            variant="forest"
            disabled={isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating…" : "Blank form"}
          </Button>
          {selectedTemplateId && (
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => {
                toast.info("Template creation coming soon.");
              }}
            >
              Use template
            </Button>
          )}
          <Button variant="link-soft" asChild className="ml-auto p-0 h-auto">
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
