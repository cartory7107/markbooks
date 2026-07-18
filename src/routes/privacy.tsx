import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TavBook" },
      {
        name: "description",
        content:
          "Read TavBook's privacy policy. Learn how Cartory B.D. International collects, uses, and protects your data.",
      },
      { property: "og:title", content: "Privacy Policy — TavBook" },
      {
        property: "og:description",
        content:
          "TavBook's privacy policy — how we handle your information and protect your privacy.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    id: "information-collection",
    title: "1. Information We Collect",
    content: [
      "We collect information you provide directly to TavBook, including your name, email address, and any other details you choose to share when creating an account, submitting an AI tool, contacting us, or using our services.",
      "We automatically collect certain technical information when you visit our platform, including your IP address, browser type, operating system, referring URLs, pages viewed, and the dates and times of your visits.",
      "We may use cookies, web beacons, and similar tracking technologies to collect information about your browsing activity on our platform.",
    ],
  },
  {
    id: "how-we-use",
    title: "2. How We Use Your Information",
    content: [
      "To provide, maintain, and improve the TavBook platform and its features, including our AI tools directory, search, and comparison functionalities.",
      "To personalize your experience, such as displaying AI tools and content relevant to your interests and previous interactions.",
      "To communicate with you about your account, submissions, updates to our platform, and respond to your inquiries or support requests.",
      "To analyze usage patterns and trends in order to improve our platform's performance, user experience, and content relevance.",
      "To detect, prevent, and address technical issues, security threats, and fraudulent or abusive activity.",
    ],
  },
  {
    id: "cookies",
    title: "3. Cookies and Tracking Technologies",
    content: [
      "TavBook uses cookies and similar technologies to enhance your browsing experience. Cookies are small data files stored on your device that help us remember your preferences and understand how you use our platform.",
      "We use both session cookies (which expire when you close your browser) and persistent cookies (which remain until they expire or are deleted).",
      "You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of TavBook.",
      "We may also use third-party analytics services that employ cookies and similar technologies to help us understand user engagement and platform performance.",
    ],
  },
  {
    id: "third-party",
    title: "4. Third-Party Services",
    content: [
      "TavBook may contain links to third-party websites, services, and AI tool providers. We are not responsible for the privacy practices or content of these external sites. We encourage you to review the privacy policies of any third-party services you visit.",
      "We may integrate with third-party services for analytics, authentication, or other functionality. These services may collect information about your use of our platform in accordance with their own privacy policies.",
      "We do not sell, trade, or otherwise transfer your personally identifiable information to third parties without your consent, except as described in this policy or as required by law.",
    ],
  },
  {
    id: "data-security",
    title: "5. Data Security",
    content: [
      "We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
      "These measures include encryption, access controls, secure server infrastructure, and regular security assessments. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security.",
      "In the event of a data breach that affects your personal information, we will notify affected users in accordance with applicable laws and take reasonable steps to mitigate any harm.",
    ],
  },
  {
    id: "childrens-privacy",
    title: "6. Children's Privacy",
    content: [
      "TavBook is not directed at children under the age of 13 (or the applicable age of consent in your jurisdiction). We do not knowingly collect personal information from children.",
      "If we become aware that we have inadvertently collected personal information from a child under the required age, we will take prompt steps to delete that information from our systems.",
      "If you believe that a child has provided us with personal information, please contact us immediately so we can take appropriate action.",
    ],
  },
  {
    id: "changes",
    title: "7. Changes to This Privacy Policy",
    content: [
      "We reserve the right to update or modify this Privacy Policy at any time. Any changes will be effective immediately upon posting the revised policy on this page with an updated \"Last updated\" date.",
      "We encourage you to review this Privacy Policy periodically to stay informed about how we collect, use, and protect your information.",
      "Your continued use of TavBook after any changes to this Privacy Policy constitutes your acceptance of the updated terms.",
    ],
  },
  {
    id: "contact",
    title: "8. Contact Us",
    content: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:",
    ],
  },
];

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="size-4" /> Back to discovery
          </Link>
        </Button>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: June 2026
          </p>

          <p className="mt-6 leading-7 text-muted-foreground">
            This Privacy Policy describes how <strong className="text-foreground">Cartory B.D. International</strong>{" "}
            (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, discloses, and protects your
            personal information when you use <strong className="text-foreground">TavBook</strong>{" "}
            (the &quot;Platform&quot;). By accessing or using TavBook, you agree to the practices described in this policy.
          </p>

          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-lg font-bold">{section.title}</h2>
                <ul className="mt-3 space-y-3">
                  {section.content.map((paragraph, i) => (
                    <li key={i} className="leading-7 text-muted-foreground">
                      {paragraph}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-muted/50 p-5">
            <h3 className="font-bold">Cartory B.D. International</h3>
            <p className="mt-1 text-sm text-muted-foreground">Operator of TavBook</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Email: contact@tavbook.ai
            </p>
          </div>
        </div>

        <div className="mt-10 pb-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Cartory B.D. International. All rights reserved.
        </div>
      </div>
    </main>
  );
}