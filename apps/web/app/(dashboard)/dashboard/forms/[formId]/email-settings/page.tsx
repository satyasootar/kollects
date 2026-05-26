"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateEmailSettingsSchema } from "@repo/database/schemas/email-settings";
import type { z } from "zod";
import { trpc } from "~/trpc/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { Skeleton } from "~/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { EditorialCard } from "~/components/chrome";
import { toast } from "~/lib/toast";
import { handleTrpcError } from "~/lib/api-error";
import { ChevronDown } from "lucide-react";

type EmailSettingsInput = z.infer<typeof updateEmailSettingsSchema>;

export default function EmailSettingsPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const { data: settings, isLoading } = trpc.emailSettings.get.useQuery(
    { formId } as any,
    { enabled: !!formId },
  );
  const { data: form } = trpc.form.getById.useQuery({ formId }, { enabled: !!formId });
  const utils = trpc.useUtils();

  const settingsData = settings as any;
  const formData = form as any;
  const emailFields = (formData?.fields as any[])?.filter((f: any) => f.type === "email") ?? [];

  const { register, handleSubmit, watch, setValue, reset, formState: { isDirty } } =
    useForm<EmailSettingsInput>({
      resolver: zodResolver(updateEmailSettingsSchema),
      defaultValues: { formId },
    });

  React.useEffect(() => {
    if (settingsData) {
      reset({
        formId,
        creatorNotifyOnSubmission: settingsData.creatorNotifyOnSubmission ?? false,
        creatorNotifyEmail: settingsData.creatorNotifyEmail ?? null,
        creatorEmailSubject: settingsData.creatorEmailSubject ?? "",
        creatorEmailTemplate: settingsData.creatorEmailTemplate ?? "",
        respondentConfirmationEnabled: settingsData.respondentConfirmationEnabled ?? false,
        respondentEmailFieldId: settingsData.respondentEmailFieldId ?? null,
        respondentEmailSubject: settingsData.respondentEmailSubject ?? "",
        respondentEmailTemplate: settingsData.respondentEmailTemplate ?? "",
        weeklyDigestEnabled: settingsData.weeklyDigestEnabled ?? false,
      });
    }
  }, [settingsData, formId, reset]);

  const updateMutation = trpc.emailSettings.update.useMutation({
    onSuccess: () => {
      utils.emailSettings.get.invalidate();
      toast.success("Email settings saved.");
    },
    onError: (err) => handleTrpcError(err),
  });

  const onSubmit = (data: EmailSettingsInput) => {
    updateMutation.mutate({ formId, data });
  };

  const creatorNotify = watch("creatorNotifyOnSubmission");
  const respondentConfirm = watch("respondentConfirmationEnabled");

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 max-w-3xl">
      <div className="flex justify-end">
        <Button type="submit" variant="forest" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>

      {/* Creator notifications */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-4">Creator notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="creatorNotify">Notify me on new submission</Label>
            <Switch
              id="creatorNotify"
              checked={creatorNotify ?? false}
              onCheckedChange={(v) => setValue("creatorNotifyOnSubmission", v, { shouldDirty: true })}
            />
          </div>
          {creatorNotify && (
            <>
              <div className="space-y-2">
                <Label htmlFor="creatorEmail">Notification email</Label>
                <Input id="creatorEmail" type="email" {...register("creatorNotifyEmail")} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creatorSubject">Email subject</Label>
                <Input id="creatorSubject" {...register("creatorEmailSubject")} className="h-11" placeholder="New response on {{form.title}}" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creatorTemplate">Email template</Label>
                <Textarea id="creatorTemplate" {...register("creatorEmailTemplate")} rows={4} className="font-mono text-xs" placeholder="Hi! You received a new response..." />
              </div>
            </>
          )}
        </div>
      </EditorialCard>

      {/* Respondent confirmation */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-4">Respondent confirmation</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="respondentConfirm">Send confirmation to respondent</Label>
            <Switch
              id="respondentConfirm"
              checked={respondentConfirm ?? false}
              onCheckedChange={(v) => setValue("respondentConfirmationEnabled", v, { shouldDirty: true })}
            />
          </div>
          {respondentConfirm && (
            <>
              <div className="space-y-2">
                <Label>Email field</Label>
                <select
                  className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm"
                  {...register("respondentEmailFieldId")}
                >
                  <option value="">Select an email field</option>
                  {emailFields.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondentSubject">Subject</Label>
                <Input id="respondentSubject" {...register("respondentEmailSubject")} className="h-11" placeholder="Thanks for your submission!" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondentTemplate">Template</Label>
                <Textarea id="respondentTemplate" {...register("respondentEmailTemplate")} rows={4} className="font-mono text-xs" placeholder="Thank you for filling out {{form.title}}..." />
              </div>
            </>
          )}
        </div>
      </EditorialCard>

      {/* Weekly digest */}
      <EditorialCard>
        <h2 className="text-xl font-semibold mb-4">Weekly digest</h2>
        <div className="flex items-center justify-between">
          <Label htmlFor="weeklyDigest">Send weekly summary email</Label>
          <Switch
            id="weeklyDigest"
            checked={watch("weeklyDigestEnabled") ?? false}
            onCheckedChange={(v) => setValue("weeklyDigestEnabled", v, { shouldDirty: true })}
          />
        </div>
      </EditorialCard>

      {/* Variable reference */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronDown className="size-4" />
          Template variables reference
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 p-4 bg-secondary/50 rounded-lg text-xs font-mono space-y-1">
          <p>{"{{form.title}}"} — Form title</p>
          <p>{"{{form.slug}}"} — Form slug</p>
          <p>{"{{response.id}}"} — Response ID</p>
          <p>{"{{respondent.email}}"} — Respondent email</p>
          <p>{"{{respondent.name}}"} — Respondent name</p>
          <p>{"{{submission.date}}"} — Submission date</p>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}
