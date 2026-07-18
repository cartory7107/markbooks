import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Check, Info, Megaphone, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const DURATION_OPTIONS = [
  { days: 1, price: 1, perDay: 1, label: "1 day" },
  { days: 3, price: 2.5, perDay: 0.83, label: "3 days" },
  { days: 7, price: 5, perDay: 0.71, label: "7 days" },
  { days: 14, price: 8, perDay: 0.57, label: "14 days" },
  { days: 30, price: 15, perDay: 0.5, label: "30 days" },
] as const;

const PLACEMENT_OPTIONS = ["Sidebar", "Featured AI", "Homepage", "Category Spotlight"] as const;

export const Route = createFileRoute("/advertise")({
  head: () => ({
    meta: [
      { title: "Advertise on TavBook" },
      {
        name: "description",
        content:
          "Reach people actively researching and buying AI tools with premium TavBook placements.",
      },
      { property: "og:title", content: "Advertise on TavBook" },
      {
        property: "og:description",
        content: "Put your AI product in front of high-intent customers.",
      },
    ],
  }),
  component: AdvertisePage,
});

function AdvertisePage() {
  const [submitted, setSubmitted] = useState(false);
  const [durationIndex, setDurationIndex] = useState(0);
  const [dailyBudget, setDailyBudget] = useState("");

  if (submitted)
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BadgeCheck className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Campaign received.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Our team will verify your AI tool and contact you with payment details before anything goes live.
          </p>
          <Button variant="brand" className="mt-7" asChild>
            <Link to="/">Back to TavBook</Link>
          </Button>
        </div>
      </main>
    );

  const budgetNum = parseFloat(dailyBudget) || 0;
  const duration = DURATION_OPTIONS[durationIndex];
  const totalCost = (budgetNum * duration.days).toFixed(2);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/"><ArrowLeft className="size-4" /> Back to discovery</Link>
        </Button>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Left panel */}
          <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white sm:p-10">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <Megaphone className="size-6" />
            </span>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-white/55">
              Advertise on TavBook
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
              Meet users while they're choosing their next AI tool.
            </h1>
            <p className="mt-5 leading-7 text-white/65">
              Premium, context-aware placements built for trust — not interruption.
            </p>
            <div className="mt-10 space-y-4">
              {[
                "Sidebar sponsored placement",
                "Featured AI placement",
                "Homepage promotion",
                "Category page spotlight",
                "Manual review before launch",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="grid size-5 place-items-center rounded-full bg-white/20">
                    <Check className="size-3" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* Right form panel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10"
          >
            <h2 className="text-xl font-extrabold">Create your campaign</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us about your product. All campaigns are manually verified.
            </p>

            {/* Basic info fields */}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required />
              <Field label="Email address" type="email" required />
              <Field label="AI tool name" required />
              <Field label="AI website URL" type="url" required />
              <div className="sm:col-span-2">
                <Field label="Advertisement title" required />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold">
                  Advertisement description
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
              <Field label="WhatsApp number (optional)" />
              <Field label="Telegram username (optional)" />
            </div>

            {/* Placement type */}
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-semibold">Placement type</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PLACEMENT_OPTIONS.map((p) => (
                  <label
                    key={p}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border p-3 text-sm hover:bg-accent"
                  >
                    <input required type="radio" name="placement" value={p} className="accent-primary" />
                    {p}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Duration picker */}
            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-semibold">Campaign duration</label>
              <select
                value={durationIndex}
                onChange={(e) => setDurationIndex(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              >
                {DURATION_OPTIONS.map((opt, i) => (
                  <option key={opt.days} value={i}>
                    {opt.label} — ${opt.price.toFixed(2)} (${opt.perDay.toFixed(2)}/day)
                  </option>
                ))}
              </select>
            </div>

            {/* Daily budget */}
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-semibold">
                Daily budget <span className="text-muted-foreground font-normal">(Minimum $1/day)</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="1.00"
                  required
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background pl-8 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Total estimated cost */}
            <div className="mt-4 rounded-xl border border-border bg-muted/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total estimated cost</span>
                <span className="text-2xl font-extrabold tabular-nums">
                  ${budgetNum >= 1 ? totalCost : "—"}
                </span>
              </div>
              {budgetNum >= 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {duration.days} days × ${budgetNum.toFixed(2)}/day
                </p>
              )}
            </div>

            {/* Pricing info box */}
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                <b className="text-foreground">Minimum bid: $1/day.</b> Higher bids get priority placement.
              </p>
            </div>

            <Button type="submit" variant="brand" size="lg" className="mt-6 w-full">
              <Zap className="size-4" /> Submit Campaign for Review
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  required = false,
}: {
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <input
        type={type}
        required={required}
        className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
      />
    </label>
  );
}