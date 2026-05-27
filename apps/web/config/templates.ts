export interface FormTemplateConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  fields: Array<{
    type: string;
    label: string;
    required: boolean;
    helpText?: string;
    placeholder?: string;
    options?: any[];
    settings?: Record<string, any>;
  }>;
}

export const formTemplates: FormTemplateConfig[] = [
  {
    id: "contact-us",
    title: "Contact Us",
    description: "A simple, clean contact form to capture inquiries from your website visitors.",
    icon: "Mail",
    color: "bg-tint-mint",
    fields: [
      {
        type: "short_text",
        label: "What's your name?",
        required: true,
        placeholder: "Jane Doe",
      },
      {
        type: "email",
        label: "What's your email address?",
        required: true,
        placeholder: "jane@example.com",
      },
      {
        type: "long_text",
        label: "How can we help you?",
        required: true,
        placeholder: "Type your message here...",
      },
    ],
  },
  {
    id: "customer-feedback",
    title: "Customer Feedback",
    description: "Gather valuable insights from your customers to improve your product or service.",
    icon: "MessageSquareHeart",
    color: "bg-tint-peach",
    fields: [
      {
        type: "rating",
        label: "How would you rate your experience with us?",
        required: true,
        settings: { ratingMax: 5, shape: "star" },
      },
      {
        type: "long_text",
        label: "What did you like the most?",
        required: false,
      },
      {
        type: "long_text",
        label: "What can we improve?",
        required: false,
      },
      {
        type: "email",
        label: "Email address (optional)",
        required: false,
        helpText: "Leave your email if you'd like us to follow up with you.",
      },
    ],
  },
  {
    id: "event-registration",
    title: "Event Registration",
    description: "Collect RSVPs, dietary requirements, and attendee details for your next event.",
    icon: "Ticket",
    color: "bg-tint-butter",
    fields: [
      {
        type: "short_text",
        label: "Full Name",
        required: true,
      },
      {
        type: "email",
        label: "Email Address",
        required: true,
      },
      {
        type: "multi_select",
        label: "Which days will you be attending?",
        required: true,
        options: [
          { label: "Day 1 (Friday)", value: "day_1" },
          { label: "Day 2 (Saturday)", value: "day_2" },
          { label: "Both Days", value: "both" },
        ],
      },
      {
        type: "short_text",
        label: "Any dietary requirements?",
        required: false,
        placeholder: "e.g., Vegan, Gluten-free",
      },
    ],
  },
  {
    id: "lead-generation",
    title: "Lead Generation",
    description: "Capture qualified leads with this high-converting contact form for sales teams.",
    icon: "Target",
    color: "bg-tint-sky",
    fields: [
      {
        type: "short_text",
        label: "Company Name",
        required: true,
      },
      {
        type: "short_text",
        label: "Your Name",
        required: true,
      },
      {
        type: "email",
        label: "Work Email",
        required: true,
      },
      {
        type: "single_select",
        label: "What is your estimated budget?",
        required: true,
        options: [
          { label: "Under $10k", value: "under_10k" },
          { label: "$10k - $50k", value: "10k_50k" },
          { label: "$50k+", value: "50k_plus" },
        ],
      },
    ],
  },
];
