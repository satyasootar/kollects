"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { FileText, Plus, BookOpen } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Keyboard shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (value: string) => {
    setOpen(false);
    switch (value) {
      case "create-form":
        router.push("/dashboard/forms/new");
        break;
      case "dashboard":
        router.push("/dashboard");
        break;
      case "templates":
        router.push("/dashboard/templates");
        break;
      case "settings":
        router.push("/dashboard/settings");
        break;
      case "api-keys":
        router.push("/dashboard/settings/api-keys");
        break;
      case "docs":
        router.push("/docs");
        break;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search forms, actions, templates…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem value="create-form" onSelect={handleSelect}>
            <Plus className="size-4 mr-2" />
            Create form
          </CommandItem>
          <CommandItem value="dashboard" onSelect={handleSelect}>
            <FileText className="size-4 mr-2" />
            Go to Dashboard
          </CommandItem>
          <CommandItem value="templates" onSelect={handleSelect}>
            <FileText className="size-4 mr-2" />
            Templates
          </CommandItem>
          <CommandItem value="settings" onSelect={handleSelect}>
            <FileText className="size-4 mr-2" />
            Settings
          </CommandItem>
          <CommandItem value="api-keys" onSelect={handleSelect}>
            <FileText className="size-4 mr-2" />
            API Keys
          </CommandItem>
          <CommandItem value="docs" onSelect={handleSelect}>
            <BookOpen className="size-4 mr-2" />
            API Docs
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
