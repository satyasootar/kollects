"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { EmptyState } from "~/components/chrome";
import { FormThemeProvider, loadTheme, DEFAULT_LIGHT_THEME } from "~/components/form-themes";
import type { ThemeConfig } from "~/components/form-themes";
import { useCompletionTimer } from "~/hooks/use-completion-timer";
import { toast } from "~/lib/toast";
import { FieldInput } from "./_field-input";

import "~/components/form-themes/themes/_register-all";

export default function FormFillPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [theme, setTheme] = React.useState<ThemeConfig>(DEFAULT_LIGHT_THEME);
  const [answers, setAnswers] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { seconds, start, stop } = useCompletionTimer();
  const startedRef = React.useRef(false);

  const { data: form, isLoading, error } = trpc.publicForm.getBySlug.useQuery(
    { slug } as any,
    { enabled: !!slug, retry: false },
  );

  const recordStartMutation = trpc.publicSubmit.recordStart.useMutation();
  const submitMutation = trpc.publicSubmit.submit.useMutation({
    onSuccess: () => {
      stop();
      router.push(`/f/${slug}/success`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit. Please try again.");
    },
  });

  const formData = form as any;
  const fields: any[] = formData?.fields ?? [];

  // Load theme
  React.useEffect(() => {
    if (formData?.themeId) {
      loadTheme(formData.themeId).then(setTheme);
    }
  }, [formData?.themeId]);

  const handleFocus = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      start();
      recordStartMutation.mutate({ slug } as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !answers[field.id]) {
        newErrors[field.id] = "This field is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorId = Object.keys(newErrors)[0];
      document.getElementById(`field-${firstErrorId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    const completionTime = stop();
    submitMutation.mutate({
      slug,
      answers,
      metadata: { completionTimeSeconds: completionTime },
    } as any);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (error || !formData) {
    const errCode = (error as any)?.data?.code;
    if (errCode === "NOT_FOUND") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <EmptyState
            illustration="broken"
            headline="Form not found."
            description="This form may have been deleted or the link is incorrect."
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <EmptyState
          illustration="broken"
          headline="This form is not accepting responses."
          description={(error as any)?.message ?? "Please try again later."}
        />
      </div>
    );
  }

  return (
    <FormThemeProvider theme={theme}>
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: theme.colors.background, color: theme.colors.foreground }}
      >
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg space-y-6"
          onFocus={handleFocus}
        >
          {formData.coverImageUrl && (
            <div className="w-full h-48 rounded-xl overflow-hidden mb-6">
              <img src={formData.coverImageUrl} alt="Form Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: theme.fonts.weights.display,
                fontSize: `${theme.fonts.scale.hero}rem`,
              }}
            >
              {formData.title}
            </h1>
            {formData.description && (
              <p className="mt-2 opacity-70" style={{ fontSize: `${theme.fonts.scale.body}rem` }}>
                {formData.description}
              </p>
            )}
          </div>

          {fields.map((field: any) => (
            <div key={field.id} id={`field-${field.id}`} className="space-y-2">
              <label
                htmlFor={`input-${field.id}`}
                style={{ fontSize: `${theme.fonts.scale.question}rem`, fontWeight: 500 }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: theme.colors.danger }}> *</span>
                )}
              </label>
              {field.helpText && (
                <p style={{ color: theme.colors.foregroundSoft, fontSize: `${theme.fonts.scale.helper}rem` }}>
                  {field.helpText}
                </p>
              )}
              <FieldInput
                field={field}
                answers={answers}
                setAnswers={setAnswers}
                errors={errors}
                theme={theme}
              />
              {errors[field.id] && (
                <p style={{ color: theme.colors.danger, fontSize: "0.75rem" }} aria-live="polite">
                  {errors[field.id]}
                </p>
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full h-12"
            style={{
              background: theme.colors.accent,
              color: theme.colors.accentForeground,
              borderRadius: `${theme.shape.radius}px`,
            }}
          >
            {submitMutation.isPending ? "Submitting…" : "Submit"}
          </Button>
        </form>
      </div>
    </FormThemeProvider>
  );
}
