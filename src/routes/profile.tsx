import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Flag, Send, ThumbsUp, ThumbsDown, Megaphone, ListPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — TavBook" },
      { name: "description", content: "Your TavBook profile — view saved AI tools, reports, recommendations, and ad campaigns." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [user, setUser] = useState<{ email: string; name?: string; id?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email ?? "",
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split("@")[0],
          id: data.user.id,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSignIn = async () => {
    const { lovable } = await import("@/integrations/lovable/index");
    await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/profile" });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <LogIn className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Sign In Required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to view your profile, saved tools, and activity on TavBook.
          </p>
          <Button variant="brand" className="mt-7 gap-2" onClick={handleSignIn}>
            <LogIn className="size-4" /> Sign Up & Login
          </Button>
          <div className="mt-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/"><ArrowLeft className="size-4" /> Back to TavBook</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const stats = [
    { icon: Bookmark, label: "Saved AIs", value: "0", color: "text-primary" },
    { icon: Flag, label: "Reports", value: "0", color: "text-red-500" },
    { icon: Send, label: "Recommendations", value: "0", color: "text-emerald-500" },
    { icon: ThumbsUp, label: "Reactions", value: "0", color: "text-amber-500" },
  ];

  const sections = [
    { icon: ListPlus, title: "My Listings", empty: "You haven't listed any tools yet", action: "/submit", actionLabel: "Submit a Tool" },
    { icon: Megaphone, title: "Ad Campaigns", empty: "No ad campaigns yet", action: "/advertise", actionLabel: "Start Advertising" },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Cover */}
      <div className="h-40 sm:h-48 bg-gradient-to-br from-primary via-violet-600 to-purple-700 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-4 left-6 sm:left-10">
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10" asChild>
            <Link to="/"><ArrowLeft className="size-4" /> Back</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-8">
        {/* Profile header */}
        <div className="relative -mt-14 mb-6 flex items-end gap-4 sm:gap-5">
          <div className="grid size-24 shrink-0 place-items-center rounded-full border-4 border-background bg-gradient-to-br from-primary to-violet-600 text-2xl font-extrabold text-white shadow-lg sm:size-28 sm:text-3xl">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="pb-1 min-w-0">
            <h1 className="text-xl font-extrabold sm:text-2xl truncate">{user.name}</h1>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <s.icon className={`mx-auto size-5 ${s.color}`} />
              <p className="mt-2 text-xl font-extrabold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-4 pb-12">
          {sections.map((sec) => (
            <div key={sec.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <sec.icon className="size-5 text-primary" />
                  <h2 className="text-base font-bold">{sec.title}</h2>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={sec.action}>{sec.actionLabel}</Link>
                </Button>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-muted">
                  <sec.icon className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{sec.empty}</p>
              </div>
            </div>
          ))}

          {/* Ad spend */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">💰</span>
              <h2 className="text-base font-bold">Ad Spend</h2>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-muted">
                <Megaphone className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No ad spend yet</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}