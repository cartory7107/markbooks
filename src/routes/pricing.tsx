import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Sparkles, Rocket, Building2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const BASE_URL = "https://markbook.top";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "MarkBook Pricing — AI Directory Listings & Advertising" },
      {
        name: "description",
        content:
          "Explore MarkBook's pricing plans for AI tool directory listings and advertising. Get your AI tool in front of millions of AI enthusiasts with free and premium options.",
      },
      { property: "og:title", content: "MarkBook Pricing — AI Directory Listings & Advertising" },
      {
        property: "og:description",
        content:
          "Simple, transparent pricing for listing and advertising your AI tool on MarkBook. Free, Pro, and Enterprise plans available.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/pricing` },
      { property: "og:site_name", content: "MarkBook" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MarkBook Pricing — AI Directory Listings & Advertising" },
      {
        name: "twitter:description",
        content:
          "Simple, transparent pricing for listing and advertising your AI tool on MarkBook.",
      },
      { rel: "canonical", href: `${BASE_URL}/pricing` },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    name: "Free",
    icon: Sparkles,
    price: "$0",
    period: "forever",
    description: "Get your AI tool listed in our directory at no cost.",
    featured: false,
    badge: null,
    features: [
      "Basic directory listing",
      "Category & tag classification",
      "Appears in search results",
      "Manual review for quality",
      "Standard positioning in rankings",
    ],
  },
  {
    name: "Pro",
    icon: Rocket,
    price: "$",
    period: "coming soon",
    description: "Boost your visibility with premium placement and analytics.",
    featured: true,
    badge: "Coming Soon",
    features: [
      "Everything in Free",
      "Featured placement in categories",
      "Priority in search results",
      "Detailed analytics dashboard",
      "Custom badge on your listing",
      "Monthly performance reports",
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "$$",
    period: "coming soon",
    description: "Maximum exposure with custom solutions for growing brands.",
    featured: false,
    badge: "Coming Soon",
    features: [
      "Everything in Pro",
      "Homepage sponsored placement",
      "Dedicated account manager",
      "Custom branding & sponsorships",
      "API access for integrations",
      "White-label reports",
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: "Is listing my AI tool really free?",
    answer:
      "Yes! Our Free plan lets you submit your AI tool to be listed in the MarkBook directory at no cost. Every submission goes through manual review to ensure quality.",
  },
  {
    question: "What does the Pro plan include?",
    answer:
      "The Pro plan is designed to maximize your tool's visibility. It includes featured placement, priority search ranking, analytics, and more. Pricing details will be announced soon.",
  },
  {
    question: "Can I upgrade or downgrade my plan later?",
    answer:
      "Absolutely. Once our paid plans launch, you'll be able to switch between plans at any time. Changes take effect immediately and billing is prorated.",
  },
  {
    question: "Do you offer discounts for startups or open-source projects?",
    answer:
      "We plan to offer special pricing for qualifying startups and open-source AI projects. Contact us at support@markbook.top to discuss your situation.",
  },
];

function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: BASE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Pricing",
                item: `${BASE_URL}/pricing`,
              },
            ],
          }),
        }}
      />

      <div className="mx-auto max-w-5xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" /> Back to discovery
          </Link>
        </Button>

        {/* Breadcrumb nav */}
        <nav className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Pricing</span>
        </nav>

        {/* Hero */}
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Get your AI tool in front of millions of AI enthusiasts
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-6 shadow-lg sm:p-8 transition-all ${
                  plan.featured
                    ? "border-primary/40 bg-card ring-2 ring-primary/10 scale-[1.02]"
                    : "border-border bg-card"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    {plan.badge}
                  </span>
                )}
                <span
                  className={`grid size-11 place-items-center rounded-xl ${
                    plan.featured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 text-xl font-extrabold">{plan.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className="ml-2 text-sm text-muted-foreground">/{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.featured ? "brand" : "outline"}
                  className="mt-8 w-full"
                  disabled={plan.badge !== null}
                  asChild={!plan.badge ? true : undefined}
                >
                  {!plan.badge ? (
                    <Link to="/submit">Get Started</Link>
                  ) : (
                    "Coming Soon"
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-center text-white sm:p-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Ready to get your tool listed?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Submit your AI tool today for a free listing, or explore our advertising options for maximum reach.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="brand"
              size="lg"
              className="bg-white text-indigo-700 hover:bg-white/90"
              asChild
            >
              <Link to="/submit">
                <Sparkles className="size-4" /> Submit Your AI Tool
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link to="/advertise">Explore Advertising</Link>
            </Button>
          </div>
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <div className="text-center">
            <span className="inline-grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-muted-foreground">
              Everything you need to know about our pricing.
            </p>
          </div>

          <div className="mt-10 grid gap-3">
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6"
                >
                  <span className="font-semibold">{item.question}</span>
                  <span
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                      openFaq === index ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <p className="text-sm leading-7 text-muted-foreground">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 pb-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Cartory B.D. International. All rights reserved.
        </div>
      </div>
    </main>
  );
}