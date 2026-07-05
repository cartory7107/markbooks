import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Twitter, Rocket, Send, HelpCircle, Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";

const BASE_URL = "https://markbook.top";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact MarkBook — Get in Touch" },
      {
        name: "description",
        content:
          "Contact the MarkBook team for support, partnerships, or feedback. Reach us via email, Twitter, or our contact form.",
      },
      { property: "og:title", content: "Contact MarkBook — Get in Touch" },
      {
        property: "og:description",
        content:
          "Have a question, partnership inquiry, or feedback about MarkBook? Get in touch with our team.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/contact` },
      { property: "og:site_name", content: "MarkBook" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Contact MarkBook — Get in Touch" },
      {
        name: "twitter:description",
        content:
          "Have a question, partnership inquiry, or feedback about MarkBook? Get in touch with our team.",
      },
      { rel: "canonical", href: `${BASE_URL}/contact` },
    ],
  }),
  component: ContactPage,
});

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "support@markbook.top",
    href: "mailto:support@markbook.top",
    description: "General support and inquiries",
  },
  {
    icon: Twitter,
    label: "Twitter / X",
    value: "@markbook_ai",
    href: "https://x.com/markbook_ai",
    description: "Follow us for updates and news",
  },
  {
    icon: Rocket,
    label: "Submit a Tool",
    value: "List your AI tool",
    href: "/submit",
    description: "Add your AI tool to the directory",
    link: true,
  },
];

const FAQ_ITEMS = [
  {
    question: "How long does it take for my AI tool to be listed?",
    answer:
      "Most submissions are reviewed within 1-2 business days. You'll receive an email notification once your tool is approved and live on the platform.",
  },
  {
    question: "Can I request a correction to an existing listing?",
    answer:
      "Absolutely! Use the contact form below or email us at support@markbook.top with the tool name and the details that need updating.",
  },
  {
    question: "I'm interested in a partnership or sponsorship. Who should I contact?",
    answer:
      "For partnerships, advertising, and sponsorship inquiries, please reach out via the contact form with 'Partnership' as the subject, or email us directly.",
  },
];

function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending — no backend yet
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  };

  if (sent) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BadgeCheck className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Message sent!</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Thank you for reaching out. We'll get back to you as soon as possible — usually within 24 hours.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <Button variant="brand" className="w-full sm:w-auto" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
              Send Another Message
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Back to MarkBook</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "MarkBook",
            url: BASE_URL,
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer support",
                email: "support@markbook.top",
                availableLanguage: ["English"],
              },
            ],
          }),
        }}
      />

      <div className="mx-auto max-w-4xl">
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
          <span className="text-foreground font-medium">Contact</span>
        </nav>

        {/* Hero */}
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Have a question, partnership inquiry, or feedback? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact channels */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {CONTACT_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const content = (
              <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{channel.label}</p>
                  <p className="text-sm font-semibold truncate">{channel.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{channel.description}</p>
                </div>
              </div>
            );
            if (channel.link) {
              return (
                <Link key={channel.label} to={channel.href as any}>
                  {content}
                </Link>
              );
            }
            return (
              <a key={channel.label} href={channel.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            );
          })}
        </div>

        {/* Contact form */}
        <section className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Send className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold">Send us a message</h2>
              <p className="text-sm text-muted-foreground">
                Fill out the form below and we&apos;ll respond as soon as possible.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold">Subject</span>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="e.g. Partnership inquiry, Bug report, General feedback"
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold">Message</span>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Tell us how we can help..."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="brand" size="lg" className="w-full sm:w-auto" disabled={sending}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <div className="text-center">
            <span className="inline-grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="size-6" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-muted-foreground">
              Quick answers to common questions.
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
                    className={`shrink-0 text-lg text-muted-foreground transition-transform duration-200 ${
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