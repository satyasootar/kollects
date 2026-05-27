"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AVAILABLE_BLOCKS = [
  { id: "block-short-text", type: "Short Text", icon: "Aa" },
  { id: "block-rating", type: "Rating", icon: "★" },
  { id: "block-dropdown", type: "Dropdown", icon: "▾" },
];

function SourceBlock({
  id,
  type,
  icon,
  disabled,
}: {
  id: string;
  type: string;
  icon: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : disabled ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground shadow-sm select-none ${
        disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      <span className="text-muted-foreground text-sm">{icon}</span>
      {type}
    </div>
  );
}

function CanvasBlock({ id, type, icon }: { id: string; type: string; icon: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-secondary/50 border border-border rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
        {type}
      </span>
      <div className="h-6 bg-card border border-border rounded px-2 flex items-center">
        <span className="text-xs text-muted-foreground">
          {type === "Rating" ? "★★★★★" : type === "Dropdown" ? "Select..." : "Type here..."}
        </span>
      </div>
    </motion.div>
  );
}

export function DragDemo() {
  const [canvasItems, setCanvasItems] = React.useState<
    { id: string; type: string; icon: string }[]
  >([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const droppedIds = new Set(canvasItems.map((item) => item.type));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    // If source block dropped on canvas area
    const block = AVAILABLE_BLOCKS.find((b) => b.id === active.id);
    if (block && !droppedIds.has(block.type)) {
      const newItem = { id: `canvas-${block.type}`, type: block.type, icon: block.icon };
      setCanvasItems((prev) => [...prev, newItem]);

      // Show tooltip after first drop
      if (canvasItems.length === 0) {
        setTimeout(() => setShowTooltip(true), 500);
      }
    }
  };

  return (
    <div className="relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Source blocks */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Field palette
            </p>
            <SortableContext
              items={AVAILABLE_BLOCKS.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {AVAILABLE_BLOCKS.map((block) => (
                  <SourceBlock
                    key={block.id}
                    {...block}
                    disabled={droppedIds.has(block.type)}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Canvas */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Your form
            </p>
            <SortableContext
              items={canvasItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="min-h-[160px] rounded-xl border-2 border-dashed border-border p-3 space-y-2"
              >
                {canvasItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Drop fields here ←
                  </p>
                )}
                <AnimatePresence>
                  {canvasItems.map((item) => (
                    <CanvasBlock key={item.id} {...item} />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground shadow-lg opacity-80">
              {AVAILABLE_BLOCKS.find((b) => b.id === activeId)?.icon}{" "}
              {AVAILABLE_BLOCKS.find((b) => b.id === activeId)?.type}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-foreground text-background rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg"
            initial={{ opacity: 0, y: -5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            That&apos;s literally how it works. ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
