import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Loader2,
  Minus,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type BlogStatus =
  | "draft"
  | "pending_review"
  | "scheduled"
  | "published"
  | "archived"
  | "rejected";

interface BlogCategory {
  slug: string;
  name: string;
  emoji: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface BlogArticle {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: BlogStatus;
  category_slug: string;
  category_name?: string;
  category_emoji?: string;
  is_featured: boolean;
  is_trending: boolean;
  ai_generated: boolean;
  author: string;
  reading_minutes: number;
  scheduled_at: string | null;
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  keywords: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  featured_image_url: string;
  featured_image_alt: string;
  twitter_card: "summary_large_image" | "summary";
  related_tool_slugs: string;
  related_post_slugs: string;
  tags: string;
  faq: FAQItem[];
  created_at?: string;
  updated_at?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  BlogStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },
  pending_review: {
    label: "Pending Review",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  published: {
    label: "Published",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
  archived: {
    label: "Archived",
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  },
};

const STATUS_TABS: { value: string; label: string; filter: BlogStatus | null }[] = [
  { value: "all", label: "All Articles", filter: null },
  { value: "draft", label: "Drafts", filter: "draft" },
  { value: "pending_review", label: "Pending Review", filter: "pending_review" },
  { value: "published", label: "Published", filter: "published" },
  { value: "scheduled", label: "Scheduled", filter: "scheduled" },
  { value: "archived", label: "Archived", filter: "archived" },
];

const EMPTY_FORM: BlogArticle = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  status: "draft",
  category_slug: "",
  is_featured: false,
  is_trending: false,
  ai_generated: false,
  author: "",
  reading_minutes: 1,
  scheduled_at: null,
  meta_title: "",
  meta_description: "",
  canonical_url: "",
  keywords: "",
  og_title: "",
  og_description: "",
  og_image_url: "",
  featured_image_url: "",
  featured_image_alt: "",
  twitter_card: "summary_large_image",
  related_tool_slugs: "",
  related_post_slugs: "",
  tags: "",
  faq: [],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calcReadingMinutes(content: string): number {
  if (!content.trim()) return 1;
  return Math.max(1, Math.round(content.split(/\s+/).length / 200));
}

function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  API helpers                                                        */
/* ------------------------------------------------------------------ */

async function apiCall<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("/blog-admin-api.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BlogManagement() {
  /* ---- state ---- */
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<BlogArticle>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BlogArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle publish
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // AI Generate
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiTargetWords, setAiTargetWords] = useState("1500");

  /* ---- categories map ---- */
  const categoryMap = useMemo(() => {
    const m = new Map<string, BlogCategory>();
    for (const c of categories) m.set(c.slug, c);
    return m;
  }, [categories]);

  /* ---- fetch categories ---- */
  useEffect(() => {
    fetch("/blog-categories-api.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: BlogCategory[] | { categories?: BlogCategory[] }) => {
        const list = Array.isArray(data) ? data : data.categories ?? [];
        setCategories(list);
      })
      .catch(() => {
        // categories are optional – show nothing
      });
  }, []);

  /* ---- fetch articles ---- */
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall<BlogArticle[] | { posts?: BlogArticle[] }>("list", { limit: 100 });
      const list = Array.isArray(data) ? data : data.posts ?? [];
      setArticles(list);

    } catch (err) {
      toast.error("Failed to load articles: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  /* ---- filtered articles ---- */
  const filtered = useMemo(() => {
    let result = articles;
    const tabDef = STATUS_TABS.find((t) => t.value === activeTab);
    if (tabDef?.filter) {
      result = result.filter((a) => a.status === tabDef.filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }
    return result;
  }, [articles, activeTab, search]);

  /* ---- tab counts ---- */
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: articles.length };
    for (const a of articles) {
      counts[a.status] = (counts[a.status] || 0) + 1;
    }
    return counts;
  }, [articles]);

  /* ---- form helpers ---- */
  const updateField = <K extends keyof BlogArticle>(key: K, value: BlogArticle[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title") {
        next.slug = generateSlug(value as string);
        next.reading_minutes = calcReadingMinutes(next.content);
      }
      if (key === "content") {
        next.reading_minutes = calcReadingMinutes(value as string);
      }
      return next;
    });
  };

  const openNewArticle = () => {
    setIsNew(true);
    setEditingArticle(null);
    setForm({ ...EMPTY_FORM });
    setEditorOpen(true);
  };

  const openEditArticle = (article: BlogArticle) => {
    setIsNew(false);
    setEditingArticle(article);
    setForm({
      ...article,
      faq: Array.isArray(article.faq) ? [...article.faq.map((f) => ({ ...f }))] : [],
    });
    setEditorOpen(true);
  };

  /* ---- save ---- */
  const handleSave = async (targetStatus: BlogStatus) => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        status: targetStatus,
        reading_minutes: calcReadingMinutes(form.content),
      };
      if (isNew) {
        await apiCall("create", { post: payload });
        toast.success("Article created successfully");
      } else {
        await apiCall("update", { id: editingArticle?.id, post: payload });
        toast.success("Article updated successfully");
      }
      setEditorOpen(false);
      await fetchArticles();
    } catch (err) {
      toast.error("Save failed: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /* ---- toggle publish ---- */
  const handleTogglePublish = async (article: BlogArticle) => {
    const newStatus: BlogStatus =
      article.status === "published" ? "draft" : "published";
    setTogglingId(article.id ?? null);
    try {
      await apiCall("update", {
        id: article.id,
        post: { ...article, status: newStatus },
      });
      toast.success(
        newStatus === "published"
          ? `"${article.title}" published`
          : `"${article.title}" unpublished`,
      );
      await fetchArticles();
    } catch (err) {
      toast.error("Failed to toggle publish: " + (err as Error).message);
    } finally {
      setTogglingId(null);
    }
  };

  /* ---- delete ---- */
  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await apiCall("delete", { id: deleteTarget.id });
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      await fetchArticles();
    } catch (err) {
      toast.error("Delete failed: " + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  /* ---- FAQ helpers ---- */
  const addFaq = () => {
    setForm((prev) => ({
      ...prev,
      faq: [...prev.faq, { question: "", answer: "" }],
    }));
  };

  const removeFaq = (index: number) => {
    setForm((prev) => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index),
    }));
  };

  const updateFaq = (index: number, field: keyof FAQItem, value: string) => {
    setForm((prev) => {
      const faq = prev.faq.map((f, i) =>
        i === index ? { ...f, [field]: value } : f,
      );
      return { ...prev, faq };
    });
  };

  /* ---- AI Generate ---- */
  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    setAiGenerating(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Your session expired — please sign in again.");
      const res = await fetch("/blog-ai-generate-api.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          topic: aiTopic,
          category: aiCategory || undefined,
          tone: aiTone,
          targetWords: Number(aiTargetWords) || 1500,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const post = data.post;
      setIsNew(true);
      setEditingArticle(null);
      setForm({
        ...EMPTY_FORM,
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content_md || "",
        faq: Array.isArray(post.faq) ? post.faq : [],
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || "",
        tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
        keywords: Array.isArray(post.keywords) ? post.keywords.join(", ") : "",
        category_slug: aiCategory || "",
        ai_generated: true,
        reading_minutes: post.reading_minutes || 5,
        status: "draft",
      });
      setAiDialogOpen(false);
      setEditorOpen(true);
      setAiTopic("");
      toast.success("Article generated! Review and edit before saving.");
    } catch (err) {
      toast.error("AI generation failed: " + (err as Error).message);
    } finally {
      setAiGenerating(false);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Blog Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and manage blog articles.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiDialogOpen(true)} className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/50">
            <Sparkles className="size-4" /> AI Generate
          </Button>
          <Button onClick={openNewArticle}>
            <Plus className="size-4" /> New Article
          </Button>
        </div>
      </div>

      {/* ---- Sub-tabs ---- */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.value
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] tabular-nums ${
                activeTab === tab.value
                  ? "text-foreground/70"
                  : "text-muted-foreground/60"
              }`}
            >
              {tabCounts[tab.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ---- Search ---- */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* ---- Articles list ---- */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              {search
                ? "No articles match your search."
                : "No articles in this category yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((article) => {
            const cat = categoryMap.get(article.category_slug);
            const statusConf = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.draft;
            const isPublished = article.status === "published";

            return (
              <Card
                key={article.id ?? article.slug}
                className="group cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => openEditArticle(article)}
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {article.title}
                      </h3>
                      {article.is_featured && (
                        <Badge
                          variant="outline"
                          className="gap-1 text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700"
                        >
                          <Star className="size-3" /> Featured
                        </Badge>
                      )}
                      {article.is_trending && (
                        <Badge
                          variant="outline"
                          className="gap-1 text-[10px] text-sky-600 border-sky-300 dark:text-sky-400 dark:border-sky-700"
                        >
                          <TrendingUp className="size-3" /> Trending
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {cat && (
                        <span className="inline-flex items-center gap-1">
                          <span>{cat.emoji}</span>
                          <span>{cat.name}</span>
                        </span>
                      )}
                      <span className="text-border">|</span>
                      <span>{article.author || "Unknown"}</span>
                      <span className="text-border">|</span>
                      <span>{formatDate(article.created_at)}</span>
                      <span className="text-border">|</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {article.reading_minutes} min read
                      </span>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge variant="outline" className={statusConf.className}>
                      {statusConf.label}
                    </Badge>

                    {/* Publish / Unpublish */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title={isPublished ? "Unpublish" : "Publish"}
                      disabled={togglingId === article.id}
                      onClick={() => handleTogglePublish(article)}
                    >
                      {togglingId === article.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isPublished ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      title="Delete"
                      onClick={() => setDeleteTarget(article)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---- Delete confirmation ---- */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{deleteTarget?.title}&rdquo;
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---- AI Generate Dialog ---- */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-purple-500" /> Generate Article with AI
            </DialogTitle>
            <DialogDescription>
              Describe the topic and the AI will create a full blog post draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ai-topic">Topic *</Label>
              <Textarea
                id="ai-topic"
                placeholder="e.g. Best AI code assistants for developers in 2026, How to use AI for content marketing, Comparison of ChatGPT vs Claude vs Gemini..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-category">Category</Label>
              <Select value={aiCategory} onValueChange={setAiCategory}>
                <SelectTrigger id="ai-category">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ai-tone">Tone</Label>
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger id="ai-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Friendly</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-length">Length</Label>
                <Select value={aiTargetWords} onValueChange={setAiTargetWords}>
                  <SelectTrigger id="ai-length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="800">Short (~800 words)</SelectItem>
                    <SelectItem value="1500">Medium (~1,500 words)</SelectItem>
                    <SelectItem value="3000">Long (~3,000 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)} disabled={aiGenerating}>
              Cancel
            </Button>
            <Button onClick={handleAiGenerate} disabled={aiGenerating || !aiTopic.trim()} className="gap-1.5 bg-purple-600 hover:bg-purple-700">
              {aiGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {aiGenerating ? "Generating..." : "Generate Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Article Editor Dialog ---- */}
      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setEditorOpen(false);
          }
        }}
      >
        <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0 sm:rounded-xl">
          {/* Editor header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-lg font-semibold">
                {isNew ? "New Article" : "Edit Article"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isNew
                  ? "Create a new blog article."
                  : `Editing "${editingArticle?.title}"`}
              </DialogDescription>
            </DialogHeader>
            {!saving && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setEditorOpen(false)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {/* Editor body — scrollable */}
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-6">
              {/* ========= Basic Info ========= */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="blog-title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="blog-title"
                    placeholder="Article title"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <Label htmlFor="blog-slug">Slug</Label>
                  <Input
                    id="blog-slug"
                    placeholder="auto-generated-from-title"
                    value={form.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-1.5">
                  <Label htmlFor="blog-excerpt">Excerpt</Label>
                  <Textarea
                    id="blog-excerpt"
                    placeholder="A short summary of the article..."
                    value={form.excerpt}
                    onChange={(e) => updateField("excerpt", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <Label htmlFor="blog-content">Content (Markdown)</Label>
                  <Textarea
                    id="blog-content"
                    placeholder="Write your article in Markdown..."
                    value={form.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    rows={16}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.content.trim()
                      ? `${form.content.split(/\s+/).length} words · ~${calcReadingMinutes(form.content)} min read`
                      : "0 words"}
                  </p>
                </div>

                {/* Status + Category */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        updateField("status", v as BlogStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_review">
                          Pending Review
                        </SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={form.category_slug}
                      onValueChange={(v) => updateField("category_slug", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.slug} value={cat.slug}>
                            {cat.emoji} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <Label htmlFor="blog-author">Author</Label>
                  <Input
                    id="blog-author"
                    placeholder="Author name"
                    value={form.author}
                    onChange={(e) => updateField("author", e.target.value)}
                  />
                </div>

                {/* Toggles */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label
                      htmlFor="blog-featured"
                      className="cursor-pointer text-sm"
                    >
                      <Star className="mr-1.5 inline size-3.5 text-amber-500" />
                      Featured
                    </Label>
                    <Switch
                      id="blog-featured"
                      checked={form.is_featured}
                      onCheckedChange={(v) => updateField("is_featured", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label
                      htmlFor="blog-trending"
                      className="cursor-pointer text-sm"
                    >
                      <TrendingUp className="mr-1.5 inline size-3.5 text-sky-500" />
                      Trending
                    </Label>
                    <Switch
                      id="blog-trending"
                      checked={form.is_trending}
                      onCheckedChange={(v) => updateField("is_trending", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label
                      htmlFor="blog-ai-gen"
                      className="cursor-pointer text-sm"
                    >
                      <Sparkles className="mr-1.5 inline size-3.5 text-violet-500" />
                      AI Generated
                    </Label>
                    <Switch
                      id="blog-ai-gen"
                      checked={form.ai_generated}
                      onCheckedChange={(v) => updateField("ai_generated", v)}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              {/* ========= SEO Section ========= */}
              <section>
                <Accordion type="single" collapsible>
                  <AccordionItem value="seo" className="border-b-0">
                    <AccordionTrigger className="py-0">
                      <h3 className="text-sm font-semibold text-foreground">
                        SEO &amp; Open Graph
                      </h3>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pb-0">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="seo-meta-title">Meta Title</Label>
                          <Input
                            id="seo-meta-title"
                            placeholder="SEO meta title"
                            value={form.meta_title}
                            onChange={(e) =>
                              updateField("meta_title", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="seo-meta-desc">
                            Meta Description
                          </Label>
                          <Input
                            id="seo-meta-desc"
                            placeholder="SEO meta description"
                            value={form.meta_description}
                            onChange={(e) =>
                              updateField("meta_description", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="seo-canonical">Canonical URL</Label>
                        <Input
                          id="seo-canonical"
                          placeholder="https://..."
                          value={form.canonical_url}
                          onChange={(e) =>
                            updateField("canonical_url", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="seo-keywords">
                          Keywords{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            (comma-separated)
                          </span>
                        </Label>
                        <Input
                          id="seo-keywords"
                          placeholder="keyword1, keyword2, keyword3"
                          value={form.keywords}
                          onChange={(e) =>
                            updateField("keywords", e.target.value)
                          }
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="seo-og-title">OG Title</Label>
                          <Input
                            id="seo-og-title"
                            placeholder="Open Graph title"
                            value={form.og_title}
                            onChange={(e) =>
                              updateField("og_title", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="seo-og-desc">OG Description</Label>
                          <Input
                            id="seo-og-desc"
                            placeholder="Open Graph description"
                            value={form.og_description}
                            onChange={(e) =>
                              updateField("og_description", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="seo-og-image">OG Image URL</Label>
                          <Input
                            id="seo-og-image"
                            placeholder="https://..."
                            value={form.og_image_url}
                            onChange={(e) =>
                              updateField("og_image_url", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="seo-featured-image">
                            Featured Image URL
                          </Label>
                          <Input
                            id="seo-featured-image"
                            placeholder="https://..."
                            value={form.featured_image_url}
                            onChange={(e) =>
                              updateField("featured_image_url", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="seo-feat-alt">
                            Featured Image Alt Text
                          </Label>
                          <Input
                            id="seo-feat-alt"
                            placeholder="Descriptive alt text"
                            value={form.featured_image_alt}
                            onChange={(e) =>
                              updateField("featured_image_alt", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Twitter Card</Label>
                          <Select
                            value={form.twitter_card}
                            onValueChange={(v) =>
                              updateField(
                                "twitter_card",
                                v as "summary_large_image" | "summary",
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="summary_large_image">
                                summary_large_image
                              </SelectItem>
                              <SelectItem value="summary">summary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>

              <Separator />

              {/* ========= Relations ========= */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Relations &amp; Tags
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rel-tools">
                      Related Tool Slugs{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (comma-separated)
                      </span>
                    </Label>
                    <Input
                      id="rel-tools"
                      placeholder="chatgpt, claude, midjourney"
                      value={form.related_tool_slugs}
                      onChange={(e) =>
                        updateField("related_tool_slugs", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rel-posts">
                      Related Post Slugs{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (comma-separated)
                      </span>
                    </Label>
                    <Input
                      id="rel-posts"
                      placeholder="best-ai-tools-2026, ..."
                      value={form.related_post_slugs}
                      onChange={(e) =>
                        updateField("related_post_slugs", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rel-tags">
                    Tags{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (comma-separated)
                    </span>
                  </Label>
                  <Input
                    id="rel-tags"
                    placeholder="ai-tools, productivity, automation"
                    value={form.tags}
                    onChange={(e) => updateField("tags", e.target.value)}
                  />
                </div>
              </section>

              <Separator />

              {/* ========= FAQ Section ========= */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">FAQ</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addFaq}
                    className="h-7 text-xs"
                  >
                    <Plus className="size-3" /> Add FAQ
                  </Button>
                </div>

                {form.faq.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                    No FAQ items yet. Click &quot;Add FAQ&quot; to add one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.faq.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg border border-border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Q&amp;A #{idx + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-destructive hover:text-destructive"
                            onClick={() => removeFaq(idx)}
                          >
                            <Minus className="size-3" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Question"
                          value={item.question}
                          onChange={(e) =>
                            updateFaq(idx, "question", e.target.value)
                          }
                        />
                        <Textarea
                          placeholder="Answer"
                          value={item.answer}
                          onChange={(e) =>
                            updateFaq(idx, "answer", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* ========= Scheduling ========= */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  <CalendarDays className="mr-1.5 inline size-4" />
                  Scheduling
                </h3>
                <div className="space-y-1.5">
                  <Label htmlFor="schedule-at">Scheduled At</Label>
                  <Input
                    id="schedule-at"
                    type="datetime-local"
                    value={form.scheduled_at ?? ""}
                    onChange={(e) =>
                      updateField(
                        "scheduled_at",
                        e.target.value || null,
                      )
                    }
                    className="max-w-xs"
                  />
                </div>
              </section>
            </div>
          </ScrollArea>

          {/* Editor footer */}
          <div className="flex flex-col-reverse items-center gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => !saving && setEditorOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave("draft")}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              Save as Draft
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave("pending_review")}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              Submit for Review
            </Button>
            <Button
              onClick={() => handleSave("published")}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Globe className="size-4" />
              )}
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}