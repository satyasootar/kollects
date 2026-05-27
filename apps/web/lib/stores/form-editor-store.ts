"use client";

import { create } from "zustand";
import type { FieldType } from "@repo/database/constants/field-types";

export interface EditorField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  pageNumber?: number;
  options?: { label: string; value: string }[];
  validations?: Record<string, any>;
  settings?: Record<string, any>;
}

interface FormEditorState {
  // Form metadata
  formId: string | null;
  title: string;
  description: string;

  // Fields
  fields: EditorField[];
  selectedFieldId: string | null;

  // Dirty tracking
  isDirty: boolean;
  lastSavedAt: number | null;

  // Auto-save
  autoSaveEnabled: boolean;

  // Actions
  setFormData: (formId: string, title: string, description: string, fields: EditorField[]) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;

  // Field actions (all local, no API calls)
  addField: (type: FieldType) => void;
  updateField: (fieldId: string, data: Partial<EditorField>) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (fieldIds: string[]) => void;
  selectField: (fieldId: string | null) => void;

  // Save state
  markSaved: () => void;
  markDirty: () => void;
  toggleAutoSave: () => void;

  // Reset
  reset: () => void;
}

let fieldCounter = 0;

function generateTempId(): string {
  fieldCounter += 1;
  return `temp_${Date.now()}_${fieldCounter}`;
}

export const useFormEditorStore = create<FormEditorState>((set, get) => ({
  formId: null,
  title: "",
  description: "",
  fields: [],
  selectedFieldId: null,
  isDirty: false,
  lastSavedAt: null,
  autoSaveEnabled: false,

  setFormData: (formId, title, description, fields) =>
    set({ formId, title, description, fields, isDirty: false, selectedFieldId: null }),

  setTitle: (title) => set({ title, isDirty: true }),
  setDescription: (description) => set({ description, isDirty: true }),

  addField: (type) => {
    const newField: EditorField = {
      id: generateTempId(),
      type,
      label: `New ${type.replace(/_/g, " ")} field`,
      required: false,
    };
    set((state) => ({
      fields: [...state.fields, newField],
      selectedFieldId: newField.id,
      isDirty: true,
    }));
  },

  updateField: (fieldId, data) =>
    set((state) => ({
      fields: state.fields.map((f) => (f.id === fieldId ? { ...f, ...data } : f)),
      isDirty: true,
    })),

  deleteField: (fieldId) =>
    set((state) => ({
      fields: state.fields.filter((f) => f.id !== fieldId),
      selectedFieldId: state.selectedFieldId === fieldId ? null : state.selectedFieldId,
      isDirty: true,
    })),

  reorderFields: (fieldIds) =>
    set((state) => {
      const fieldMap = new Map(state.fields.map((f) => [f.id, f]));
      const reordered = fieldIds.map((id) => fieldMap.get(id)).filter(Boolean) as EditorField[];
      return { fields: reordered, isDirty: true };
    }),

  selectField: (fieldId) => set({ selectedFieldId: fieldId }),

  markSaved: () => set({ isDirty: false, lastSavedAt: Date.now() }),
  markDirty: () => set({ isDirty: true }),
  toggleAutoSave: () => set((state) => ({ autoSaveEnabled: !state.autoSaveEnabled })),

  reset: () =>
    set({
      formId: null,
      title: "",
      description: "",
      fields: [],
      selectedFieldId: null,
      isDirty: false,
      lastSavedAt: null,
    }),
}));
