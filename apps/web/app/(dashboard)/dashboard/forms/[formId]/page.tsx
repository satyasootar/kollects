"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "./layout";

export default function FormBasePage() {
  const { form, isLoading } = useFormContext();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && form) {
      if ((form as any).status === "published") {
        router.replace(`/dashboard/forms/${(form as any).id}/analytics`);
      } else {
        router.replace(`/dashboard/forms/${(form as any).id}/fields`);
      }
    }
  }, [form, isLoading, router]);

  return null;
}
