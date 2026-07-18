import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — TavBook" },
      {
        name: "description",
        content:
          "Read the Terms of Service for TavBook, the world's AI discovery and research platform by Cartory B.D. International.",
      },
      { property: "og:title", content: "Terms of Service — TavBook" },
      {
        property: "og:description",
        content:
          "Terms of Service for TavBook — the world's AI discovery and research platform.",
      },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using TavBook (the \"Platform\"), operated by Cartory B.D. International (\"Company,\" \"we,\" \"us,\" or \"our\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to these Terms, please do not use the Platform.",
      "We reserve the right to update or modify these Terms at any time. Continued use of the Platform after any changes constitutes your acceptance of the revised Terms. The \"Last updated\" date at the top of this page indicates when the most recent revisions were made.",
      "These Terms apply to all visitors, users, and others who access or use the Platform, including AI tool providers, researchers, developers, and general users.",
    ],
  },
  {
    id: "use-of-service",
    title: "2. Use of Service",
    content: [
      "TavBook provides an AI tools discovery and research platform that allows users to search, browse, compare, and review AI tools and services submitted by providers and indexed by our team.",
      "You may use the Platform for lawful purposes only. You agree not to use the Platform in any way that violates any applicable local, national, or international law or regulation.",
      "You agree not to attempt to gain unauthorized access to any portion of the Platform, other user accounts, or computer systems connected to the Platform through hacking, password mining, or any other means.",
      "You agree not to engage in any activity that interferes with or disrupts the Platform, servers, or networks connected to the Platform, including by submitting malware, spam, or other harmful content.",
      "We reserve the right to restrict or terminate your access to the Platform at any time, without notice, for any reason, including but not limited to a breach of these Terms.",
    ],
  },
  {
    id: "user-accounts",
    title: "3. User Accounts",
    content: [
      "Certain features of TavBook may require you to create a user account. When creating an account, you must provide accurate, current, and complete information and keep this information up to date.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.",
      "You must be at least 13 years of age (or the applicable age of consent in your jurisdiction) to create an account and use the Platform. If you are under 18, you represent that your parent or legal guardian has reviewed and agrees to these Terms on your behalf.",
      "We reserve the right to suspend or terminate accounts that violate these Terms or that have been inactive for an extended period, with or without notice.",
    ],
  },
  {
    id: "content",
    title: "4. Content",
    content: [
      "TavBook contains content including AI tool listings, descriptions, reviews, categories, and other materials provided by users, AI tool providers, and our editorial team (collectively, \"Content\").",
      "You are solely responsible for any Content you submit, post, or display on the Platform. By submitting Content, you represent and warrant that you have the right to do so and that the Content does not violate any third-party rights or applicable law.",
      "We do not claim ownership over Content you submit. However, by submitting Content to TavBook, you grant us a worldwide, non-exclusive, royalty-free, perpetual, irrevocable license to use, reproduce, modify, adapt, publish, translate, distribute, and display such Content in connection with the Platform.",
      "We reserve the right to remove, edit, or refuse to display any Content that, in our sole discretion, violates these Terms, is objectionable, or is otherwise inappropriate for the Platform.",
    ],
  },
  {
    id: "intellectual-property",
    title: "5. Intellectual Property",
    content: [
      "The Platform, including its design, layout, code, graphics, logos, and other original elements, is the property of Cartory B.D. International and is protected by applicable intellectual property laws.",
      "The TavBook name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Cartory B.D. International. You may not use these marks without our prior written permission.",
      "You may not copy, modify, distribute, sell, or lease any part of the Platform, nor may you reverse engineer, decompile, or disassemble any software contained on the Platform, unless permitted by applicable law.",
      "AI tool listings, descriptions, and metadata indexed on the Platform remain the intellectual property of their respective owners and providers.",
    ],
  },
  {
    id: "limitation-of-liability",
    title: "6. Limitation of Liability",
    content: [
      "To the fullest extent permitted by applicable law, Cartory B.D. International and its directors, employees, partners, agents, suppliers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of or inability to use the Platform.",
      "TavBook serves as an informational directory and does not guarantee the accuracy, completeness, reliability, or quality of any AI tool listing, description, review, or other Content on the Platform. Users are encouraged to independently evaluate any AI tool before use.",
      "We do not endorse, guarantee, or assume responsibility for the accuracy, legality, or quality of any third-party AI tools or services listed on the Platform. Your interactions with third-party tools are solely between you and the respective tool provider.",
      "In no event shall our total liability to you for all claims arising out of or relating to the use of the Platform exceed the amount you have paid to us in the twelve (12) months preceding the claim, or if no payment was made, one hundred US dollars ($100 USD).",
    ],
  },
  {
    id: "changes-to-terms",
    title: "7. Changes to These Terms",
    content: [
      "We reserve the right to revise and update these Terms at any time at our sole discretion. All changes are effective immediately when posted and apply to all access to and use of the Platform thereafter.",
      "We will make reasonable efforts to notify users of material changes to these Terms, such as by posting a notice on the Platform or updating the \"Last updated\" date. However, it is your responsibility to review these Terms periodically.",
      "Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. If you do not agree to the updated Terms, you must stop using the Platform.",
    ],
  },
  {
    id: "governing-law",
    title: "8. Governing Law",
    content: [
      "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Cartory B.D. International is incorporated, without regard to its conflict of law provisions.",
      "Any disputes arising out of or relating to these Terms or the Platform shall be resolved in the courts of the applicable jurisdiction. You consent to the exclusive jurisdiction and venue of such courts.",
      "If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions of these Terms will remain in full force and effect.",
    ],
  },
  {
    id: "contact",
    title: "9. Contact Us",
    content: [
      "If you have any questions, concerns, or feedback about these Terms of Service, please contact us at:",
    ],
  },
];

function TermsPage() {
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
            <FileText className="size-6" />
          </span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: June 2026
          </p>

          <p className="mt-6 leading-7 text-muted-foreground">
            Please read these Terms of Service (&quot;Terms&quot;) carefully before using{" "}
            <strong className="text-foreground">TavBook</strong>, operated by{" "}
            <strong className="text-foreground">Cartory B.D. International</strong> (the &quot;Company&quot;).
            These Terms govern your access to and use of the Platform and its services.
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