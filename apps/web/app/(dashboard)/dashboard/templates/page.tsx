"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formTemplates } from "~/config/templates";
import { trpc } from "~/trpc/client";
import { toast } from "~/lib/toast";
import { Mail, MessageSquareHeart, Ticket, Target, Loader2 } from "lucide-react";
import { Doodle } from "~/components/chrome";
import { Button } from "~/components/ui/button";

const iconMap: Record<string, React.ElementType> = {
  Mail,
  MessageSquareHeart,
  Ticket,
  Target,
};

export default function TemplatesPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);

  const createMutation = trpc.form.createFromTemplate.useMutation({
    onSuccess: (data: any) => {
      utils.form.list.invalidate();
      if (data?.id) {
        toast.success("Template applied!");
        router.push(`/dashboard/forms/${data.id}/fields`);
      }
    },
    onError: () => {
      toast.error("Failed to create form from template.");
      setSelectedTemplate(null);
    },
  });

  const handleCreate = (template: typeof formTemplates[0]) => {
    setSelectedTemplate(template.id);
    createMutation.mutate({
      title: template.title,
      description: template.description,
      fields: template.fields,
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-display-lg text-foreground">
          Start from a{" "}
          <span className="text-tint-peach-ink relative inline-block">
            template
            <Doodle
              name="underline-wave"
              className="absolute left-0 -bottom-1 w-full h-2"
            />
          </span>.
        </h1>
        <p className="text-muted-foreground text-lg">
          Choose a pre-configured form below to hit the ground running.
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {formTemplates.map((template) => {
          const Icon = iconMap[template.icon] || Mail;
          const isCreating = selectedTemplate === template.id;

          return (
            <div 
              key={template.id} 
              className="group relative bg-white border border-[#e5e5e5] rounded-3xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`size-12 rounded-2xl flex items-center justify-center ${template.color}`}>
                  <Icon className="size-6 text-[#1a1a1a]" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-mono font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {template.fields.length} Fields
                </div>
              </div>
              
              <h3 className="text-2xl font-display font-semibold text-foreground mb-3 group-hover:text-tint-peach-ink transition-colors">
                {template.title}
              </h3>
              
              <p className="text-muted-foreground text-sm flex-1 leading-relaxed mb-8">
                {template.description}
              </p>

              <Button 
                variant="forest" 
                className="w-full justify-center h-12"
                onClick={() => handleCreate(template)}
                disabled={isCreating || (createMutation.isPending && selectedTemplate !== null)}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Use this template"
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
