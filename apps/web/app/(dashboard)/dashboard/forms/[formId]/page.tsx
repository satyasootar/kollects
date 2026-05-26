import { redirect } from "next/navigation";

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  redirect(`/dashboard/forms/${formId}/fields`);
}
