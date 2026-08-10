import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Globe, Mail, MessageCircle, Shield, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TavBook — AI Discovery Platform" },
      {
        name: "description",
        content:
          "TavBook is the world's AI discovery and research platform, built by Cartory B.D. International. Founded by Al Amin Zisan, we index 80,000+ AI tools updated daily.",
      },
      { property: "og:title", content: "About TavBook" },
      {
        property: "og:description",
        content:
          "Learn about TavBook — the world's AI discovery and research platform making AI accessible to everyone.",
      },
      { property: "og:url", content: "https://tavbook.top/about" },
    ],
    links: [{ rel: "canonical", href: "https://tavbook.top/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" /> Back to discovery
          </Link>
        </Button>

        <h1 className="mt-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
          About TavBook
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          The world&apos;s AI discovery and research platform.
        </p>

        {/* Company Intro */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Globe className="size-6" />
          </span>
          <h2 className="mt-6 text-xl font-extrabold">Who We Are</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            TavBook is a product of <strong className="text-foreground">Cartory B.D. International</strong>,
            a company dedicated to making artificial intelligence accessible, discoverable, and
            understandable for everyone — from researchers and developers to students and business
            professionals.
          </p>
          <p className="mt-3 leading-7 text-muted-foreground">
            Founded by <strong className="text-foreground">Al Amin Zisan</strong>, TavBook was born
            from a simple vision: the AI landscape is growing at an unprecedented pace, and people
            need a trusted, organized place to discover, compare, and research the right tools for
            their needs.
          </p>
        </section>

        {/* Mission */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </span>
          <h2 className="mt-6 text-xl font-extrabold">Our Mission</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Making AI discovery accessible to everyone. We believe that the power of AI should not
            be locked behind complexity or information overload. TavBook exists to bridge the gap
            between people and the AI tools that can transform their work, learning, and daily life.
          </p>
        </section>

        {/* What We Do */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="size-6" />
          </span>
          <h2 className="mt-6 text-xl font-extrabold">What We Do</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "80,000+ AI Tools",
                description:
                  "The most comprehensive directory of AI tools on the web, organized by category, use case, and pricing.",
              },
              {
                title: "Daily Updates",
                description:
                  "Our team continuously adds and verifies new AI tools so you always have access to the latest innovations.",
              },
              {
                title: "Free to Use",
                description:
                  "TavBook is and will remain free for all users. Discover, compare, and research AI tools at no cost.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-background p-5"
              >
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </span>
          <h2 className="mt-6 text-xl font-extrabold">Our Team</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Meet the people behind TavBook.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-1">
            <div className="flex items-center gap-5 rounded-xl border border-border bg-background p-5">
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                AZ
              </div>
              <div>
                <h3 className="font-bold">Al Amin Zisan</h3>
                <p className="mt-0.5 text-sm font-medium text-primary">
                  Founder &amp; CEO
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Visionary behind TavBook and Cartory B.D. International. Passionate about
                  democratizing AI discovery and building tools that empower people worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="size-6" />
          </span>
          <h2 className="mt-6 text-xl font-extrabold">Contact Us</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Have questions, feedback, or partnership inquiries? We&apos;d love to hear from you.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <Mail className="size-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold">contact@tavbook.ai</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <MessageCircle className="size-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Company</p>
                <p className="text-sm font-semibold">Cartory B.D. International</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 pb-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Cartory B.D. International. All rights reserved.
        </div>
      </div>
    </main>
  );
}