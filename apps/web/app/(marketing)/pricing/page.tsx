import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_LIMITS } from "@repo/database/constants/user-plan";
import { Button } from "~/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { TintCard, DotField, Doodle, EditorialCard } from "~/components/chrome";

const PLANS = [
  {
    name: "Free",
    tint: "blush" as const,
    price: "$0",
    period: "forever",
    description: "Perfect for trying things out",
    features: [
      `${PLAN_LIMITS.free.formLimit} forms`,
      `${PLAN_LIMITS.free.responseLimit} responses per form`,
      "All field types",
      "Basic analytics",
      "Community themes",
    ],
    cta: { label: "Start free", href: "/signup", variant: "forest" as const },
    doodle: "sparkle" as const,
  },
  {
    name: "Pro",
    tint: "forest" as const,
    price: "$12",
    period: "/ month",
    description: "For creators who ship regularly",
    features: [
      `${PLAN_LIMITS.pro.formLimit} forms`,
      `${PLAN_LIMITS.pro.responseLimit.toLocaleString()} responses per form`,
      "All field types",
      "Advanced analytics",
      "All themes",
      "Custom branding",
      "Email notifications",
      "CSV export",
    ],
    cta: {
      label: "Upgrade to Pro",
      href: "/signup",
      variant: "outline" as const,
    },
    doodle: "arrow-curve" as const,
  },
  {
    name: "Enterprise",
    tint: "mint" as const,
    price: "Contact us",
    period: "",
    description: "For teams that need everything",
    features: [
      "Unlimited forms",
      "Unlimited responses",
      "All field types",
      "Advanced analytics",
      "All themes",
      "Custom branding",
      "Priority support",
      "API access",
      "SSO (coming soon)",
    ],
    cta: {
      label: "Talk to us",
      href: "mailto:hello@kollects.tech",
      variant: "link-soft" as const,
    },
    doodle: "swirl" as const,
  },
];

const FAQ_ITEMS = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Changes take effect immediately.",
  },
  {
    q: "What counts as a response?",
    a: "A response is a completed form submission. Partial saves (progress) don't count toward your limit.",
  },
  {
    q: "Is there a refund policy?",
    a: "We offer a 14-day money-back guarantee on Pro plans. No questions asked.",
  },
  {
    q: "What happens when I hit my form limit?",
    a: "You won't be able to create new forms until you upgrade or archive existing ones. Existing forms continue to collect responses.",
  },
  {
    q: "Do you offer discounts for nonprofits or students?",
    a: "Yes! Reach out to hello@kollects.tech with proof of status and we'll set you up with a free Pro plan.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel from your dashboard settings. You'll keep Pro features until the end of your billing period.",
  },
];

export default function PricingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <DotField />
        <h1 className="text-display-xl text-foreground relative z-10">
          Start{" "}
          <span className="text-tint-peach-ink relative inline-block">
            free
            <Doodle
              name="underline-wave"
              className="absolute left-0 -bottom-3 w-full h-3"
            />
          </span>
          .
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto relative z-10">
          Pay when you outgrow it. Cancel any time.
        </p>
      </section>

      {/* Plans grid */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
          {PLANS.map((plan) => (
            <TintCard
              key={plan.name}
              tint={plan.tint}
              className={
                plan.tint === "forest"
                  ? "md:scale-[1.05] md:-my-2 relative"
                  : "relative"
              }
            >
              <Doodle
                name={plan.doodle}
                className="absolute top-4 right-4 size-5 opacity-60"
              />
              <p className="text-sm font-medium opacity-70">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-display-md">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm opacity-70">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm opacity-80">{plan.description}</p>
              <ul className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.cta.variant === "link-soft" ? (
                  <Button variant="link-soft" asChild className="p-0 h-auto">
                    <a href={plan.cta.href}>{plan.cta.label}</a>
                  </Button>
                ) : (
                  <Button
                    variant={plan.cta.variant}
                    className="w-full"
                    asChild
                  >
                    <Link href={plan.cta.href}>{plan.cta.label}</Link>
                  </Button>
                )}
              </div>
            </TintCard>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Frequently asked questions
        </h2>
        <EditorialCard>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </EditorialCard>
      </section>
    </div>
  );
}
