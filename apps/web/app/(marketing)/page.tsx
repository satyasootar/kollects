import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  TintCard,
  DotField,
  Doodle,
  NumberTicker,
  EditorialCard,
  Illustration,
} from "~/components/chrome";

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <DotField />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-display-xl text-foreground">
            Build forms that{" "}
            <span className="text-tint-peach-ink relative inline-block">
              people love
              <Doodle name="underline-wave" className="absolute left-0 -bottom-3 w-full h-3" />
            </span>
            .
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto">
            Create dynamic forms with stunning themes, collect responses, and
            understand your audience — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button variant="forest" size="lg" asChild>
              <Link href="/signup">Get started — it&apos;s free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/explore">Explore forms</Link>
            </Button>
          </div>
          <Doodle
            name="arrow-loop"
            className="absolute -bottom-8 right-0 md:right-12 size-16 text-doodle-soft"
          />
        </div>
      </section>

      {/* By the numbers */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <TintCard tint="peach">
            <TintCard.Number>
              <NumberTicker value={60} suffix="s" />
              <Doodle name="arrow-curve" className="inline-block size-4 ml-1" />
            </TintCard.Number>
            <TintCard.Caption>to build a form</TintCard.Caption>
          </TintCard>
          <TintCard tint="mint">
            <TintCard.Number>
              <NumberTicker value={12} suffix="+" />
              <Doodle name="swirl" className="inline-block size-4 ml-1" />
            </TintCard.Number>
            <TintCard.Caption>stunning themes</TintCard.Caption>
          </TintCard>
          <TintCard tint="forest">
            <TintCard.Number>
              <NumberTicker value={99} suffix="%" />
            </TintCard.Number>
            <TintCard.Caption>uptime</TintCard.Caption>
          </TintCard>
          <TintCard tint="blush">
            <TintCard.Number>
              <NumberTicker value={11} />
            </TintCard.Number>
            <TintCard.Caption>field types</TintCard.Caption>
          </TintCard>
          <TintCard tint="sky">
            <TintCard.Number>
              <NumberTicker value={100} suffix="%" />
            </TintCard.Number>
            <TintCard.Caption>free to start</TintCard.Caption>
          </TintCard>
          <TintCard tint="butter">
            <TintCard.Number>∞</TintCard.Number>
            <TintCard.Caption>possibilities</TintCard.Caption>
          </TintCard>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-display-lg text-foreground text-center mb-12">
          Everything you need to{" "}
          <span className="text-tint-blush-ink">collect</span>.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EditorialCard className="text-center">
            <Illustration name="collect" className="mx-auto mb-4 max-w-[160px]" />
            <h3 className="text-lg font-semibold">Collect</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Build forms with 11 field types, validations, and multi-page flows.
            </p>
          </EditorialCard>
          <EditorialCard className="text-center">
            <Illustration name="analyze" className="mx-auto mb-4 max-w-[160px]" />
            <h3 className="text-lg font-semibold">Understand</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Analytics, drop-off charts, and field-level stats to see what works.
            </p>
          </EditorialCard>
          <EditorialCard className="text-center">
            <Illustration name="share" className="mx-auto mb-4 max-w-[160px]" />
            <h3 className="text-lg font-semibold">Share</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Publish with a custom slug, share via link or QR code.
            </p>
          </EditorialCard>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-display-md text-foreground">
          Ready to start{" "}
          <span className="text-tint-peach-ink relative inline-block">
            collecting
            <Doodle name="underline-wave" className="absolute left-0 -bottom-2 w-full h-2" />
          </span>
          ?
        </h2>
        <div className="mt-8">
          <Button variant="forest" size="lg" asChild>
            <Link href="/signup">Create your first form</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
