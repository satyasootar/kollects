import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FIELD_TYPES } from "@repo/database/constants/field-types";
import {
  FieldTypePicker,
  FIELD_TYPE_LABELS,
} from "~/components/form-builder/field-type-picker";
import { FieldList, type FieldItem } from "~/components/form-builder/field-list";
import { FieldInspector } from "~/components/form-builder/field-inspector";

// Polyfill scrollIntoView for cmdk in jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock @dnd-kit to avoid complex DOM interactions in unit tests
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: "vertical",
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/modifiers", () => ({
  restrictToVerticalAxis: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

const mockFields: FieldItem[] = [
  { id: "f1", type: "short_text", label: "Full Name", required: true },
  { id: "f2", type: "email", label: "Work Email", required: true },
  { id: "f3", type: "number", label: "Age", required: false },
];

describe("FieldTypePicker", () => {
  it("renders all 11 field types when open", () => {
    render(
      <FieldTypePicker
        open={true}
        onOpenChange={() => {}}
        onSelect={() => {}}
      />,
    );

    for (const type of FIELD_TYPES) {
      expect(
        screen.getByTestId(`field-type-${type}`),
      ).toBeInTheDocument();
    }
  });

  it("calls onSelect with the chosen type", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <FieldTypePicker
        open={true}
        onOpenChange={() => {}}
        onSelect={onSelect}
      />,
    );

    const emailItem = screen.getByTestId("field-type-email");
    await user.click(emailItem);
    expect(onSelect).toHaveBeenCalledWith("email");
  });

  it("displays correct labels for field types", () => {
    render(
      <FieldTypePicker
        open={true}
        onOpenChange={() => {}}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("Short Text")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Rating")).toBeInTheDocument();
  });
});

describe("FieldList", () => {
  it("renders field items with labels", () => {
    render(
      <FieldList
        fields={mockFields}
        selectedFieldId={null}
        onSelect={() => {}}
        onReorder={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("Work Email")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
  });

  it("shows required indicator for required fields", () => {
    const { container } = render(
      <FieldList
        fields={mockFields}
        selectedFieldId={null}
        onSelect={() => {}}
        onReorder={() => {}}
        onDelete={() => {}}
      />,
    );

    const stars = container.querySelectorAll(".text-destructive");
    expect(stars.length).toBe(2); // Full Name and Work Email are required
  });

  it("shows empty state when no fields", () => {
    render(
      <FieldList
        fields={[]}
        selectedFieldId={null}
        onSelect={() => {}}
        onReorder={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByText(/No fields yet/)).toBeInTheDocument();
  });

  it("calls onSelect when a field is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <FieldList
        fields={mockFields}
        selectedFieldId={null}
        onSelect={onSelect}
        onReorder={() => {}}
        onDelete={() => {}}
      />,
    );

    await user.click(screen.getByText("Full Name"));
    expect(onSelect).toHaveBeenCalledWith("f1");
  });
});

describe("FieldInspector", () => {
  it("shows empty state when no field selected", () => {
    render(<FieldInspector field={null} onUpdate={() => {}} />);
    expect(
      screen.getByText(/Select a field to edit/),
    ).toBeInTheDocument();
  });

  it("renders field label input when field is selected", () => {
    const field = {
      id: "f1",
      type: "short_text" as const,
      label: "Full Name",
      required: true,
      placeholder: null,
      helpText: null,
      validations: null,
      settings: null,
      options: null,
    };

    render(<FieldInspector field={field} onUpdate={() => {}} />);
    const input = screen.getByDisplayValue("Full Name");
    expect(input).toBeInTheDocument();
  });
});
