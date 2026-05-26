"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "~/lib/utils";

/**
 * Underline tabs with a sliding indicator.
 * DESIGN.md §3.11 — tab labels in caption weight, sliding 2px foreground indicator.
 */

const UnderlineTabs = TabsPrimitive.Root;

const UnderlineTabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
    left: 0,
    width: 0,
  });

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-state="active"]');
    if (!active) return;
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    setIndicatorStyle({
      left: activeRect.left - listRect.left,
      width: activeRect.width,
    });
  }, []);

  React.useEffect(() => {
    updateIndicator();
    const observer = new ResizeObserver(updateIndicator);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [updateIndicator]);

  // Re-compute on any child state change via MutationObserver
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const mo = new MutationObserver(updateIndicator);
    mo.observe(list, { attributes: true, subtree: true, attributeFilter: ["data-state"] });
    return () => mo.disconnect();
  }, [updateIndicator]);

  return (
    <TabsPrimitive.List
      ref={(node) => {
        (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn("relative flex gap-6 border-b border-border", className)}
      {...props}
    >
      {children}
      <span
        className="absolute bottom-0 h-[2px] bg-foreground transition-all duration-[220ms]"
        style={{
          ...indicatorStyle,
          transitionTimingFunction: "var(--ease-soft)",
        }}
      />
    </TabsPrimitive.List>
  );
});
UnderlineTabsList.displayName = "UnderlineTabsList";

const UnderlineTabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "text-xs leading-[1.5] font-medium text-muted-foreground hover:text-foreground transition-colors py-3 data-[state=active]:text-foreground cursor-pointer",
      className,
    )}
    {...props}
  />
));
UnderlineTabsTrigger.displayName = "UnderlineTabsTrigger";

const UnderlineTabsContent = TabsPrimitive.Content;

export { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger, UnderlineTabsContent };
