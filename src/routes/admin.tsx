import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  Plus,
  Search,
  Send,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — MarkBook" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

/* ---------- Types ---------- */
type Tool = {
  n: string;
  d: string;
  c: string;
  g: string;
  p: string;
  u: string;
  fl?: string;
  badges?: string[];
  pos?: number;
  posr?: number;
  posa?: number;
};

const PREMIUM_BADGES = [
  "Verified",
  "Exclusive",
  "Trending",
  "Underrated",
  "Super Valuable",
];


type CatalogData = {
  tools: Tool[];
  categories: Record<string, number>;
};

type AdminEditRow = {
  id: string;
  original_name: string | null;
  tool_data: Tool;
  action: string;
  created_at: string;
  updated_at: string;
};

type SubmissionRow = {
  id: string;
  tool_name: string;
  tool_url: string;
  description: string;
  full_description: string | null;
  category: string;
  pricing: string;
  submitter_name: string | null;
  submitter_email: string | null;
  logo_url: string | null;
  tags: string[];
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const PRICING_OPTIONS = [
  "Free",
  "Free Plan",
  "Free Trial",
  "Free Credits",
  "Daily Free",
  "Monthly Free",
  "Paid",
  "Paid Plans",
];

const ITEMS_PER_PAGE = 50;

/* ---------- Component ---------- */
function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.email !== "cartory7107@gmail.com") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Shield className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Access Denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            You are not authorized to access this page.
          </p>
          <Button variant="brand" className="mt-7" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" /> Back to MarkBook
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [catalog, setCatalog] = useState<CatalogData>({ tools: [], categories: {} });
  const [totalToolCount, setTotalToolCount] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [adminEdits, setAdminEdits] = useState<AdminEditRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Check if DB tables exist
  useEffect(() => {
    supabase
      .from("tool_submissions")
      .select("id", { count: "exact", head: true })
      .then(({ error }) => {
        setDbReady(!error);
      });
  }, []);

  // Load total tool count (lightweight - from tools-api.json ~10KB)
  useEffect(() => {
    fetch("/tools-api.json")
      .then((r) => r.json())
      .then((data: { totalTools: number }) => {
        setTotalToolCount(data.totalTools);
      })
      .catch(() => undefined);
  }, []);

  // Lazy-load catalog ONLY when Manage Tools tab is active
  useEffect(() => {
    if (activeTab !== "tools") return;
    if (catalog.tools.length > 0) return; // already loaded
    setCatalogLoading(true);
    // Fetch ALL tools (116K+) — admin needs the full catalog
    fetch(`/search-api.json?limit=50000`)
      .then((r) => r.json())
      .then((data: { results: Tool[]; total: number }) => {
        // Build categories map from the tools themselves
        const cats: Record<string, number> = {};
        for (const t of data.results) {
          cats[t.c] = (cats[t.c] || 0) + 1;
        }
        setCatalog({ tools: data.results, categories: cats });
        setCatalogLoading(false);
      })
      .catch(() => setCatalogLoading(false));
  }, [activeTab, catalog.tools.length]);

  // Load submissions and admin edits
  const refreshData = useCallback(() => {
    setStatsLoading(true);
    Promise.all([
      supabase.from("tool_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_tool_edits").select("*").order("created_at", { ascending: false }),
    ])
      .then(([subRes, editRes]) => {
        if (!subRes.error) setSubmissions(subRes.data as SubmissionRow[]);
        if (!editRes.error) setAdminEdits(editRes.data as AdminEditRow[]);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    if (dbReady) refreshData();
  }, [dbReady, refreshData]);

  const stats = useMemo(() => {
    const pendingCount = submissions.filter((s) => s.status === "pending").length;
    return {
      totalTools: totalToolCount || catalog.tools.length,
      pendingSubmissions: pendingCount,
      adminEditsCount: adminEdits.length,
      totalSubmissions: submissions.length,
    };
  }, [catalog.tools.length, submissions, adminEdits]);

  const categoryList = useMemo(() => {
    return Object.keys(catalog.categories).sort();
  }, [catalog.categories]);

  if (dbReady === null || dbReady === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/50">
            <Database className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold">Database Setup Required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The admin panel tables don&apos;t exist yet. Please run the migration SQL in your Supabase SQL Editor.
          </p>
          <div className="mt-4 rounded-lg bg-muted p-4 text-left">
            <p className="text-xs font-semibold text-muted-foreground">File:</p>
            <code className="mt-1 block text-xs text-foreground">
              supabase/migrations/admin_panel.sql
            </code>
          </div>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setDbReady(null)}
          >
            <Loader2 className="size-4" /> Re-check
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-border bg-card p-4 lg:w-64 lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 mb-6">
            <Link to="/" className="text-lg font-extrabold tracking-tight">
              Mark<span className="text-primary">Book</span>
            </Link>
            <Badge variant="secondary" className="text-[10px]">
              Admin
            </Badge>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "tools", label: "Manage Tools", icon: Edit3 },
              { id: "submissions", label: "Submissions", icon: Send },
              { id: "add", label: "Add Tool", icon: Plus },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {activeTab === "dashboard" && (
            <DashboardTab stats={stats} loading={statsLoading} adminEdits={adminEdits} submissions={submissions} />
          )}
          {activeTab === "tools" && (
            <ToolsTab
              catalog={catalog}
              loading={catalogLoading}
              categories={categoryList}
              adminEdits={adminEdits}
              onRefresh={refreshData}
            />
          )}
          {activeTab === "submissions" && (
            <SubmissionsTab
              submissions={submissions}
              loading={statsLoading}
              categories={categoryList}
              onRefresh={refreshData}
            />
          )}
          {activeTab === "add" && (
            <AddToolTab categories={categoryList} onRefresh={refreshData} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- Dashboard Tab ---------- */
function DashboardTab({
  stats,
  loading,
  adminEdits,
  submissions,
}: {
  stats: { totalTools: number; pendingSubmissions: number; adminEditsCount: number; totalSubmissions: number };
  loading: boolean;
  adminEdits: AdminEditRow[];
  submissions: SubmissionRow[];
}) {
  const recentActivity = useMemo(() => {
    const activity = [
      ...adminEdits.slice(0, 5).map((e) => ({
        type: e.action as string,
        name: e.action === "delete" ? e.original_name || "Unknown" : (e.tool_data as Tool)?.n || "Unknown",
        date: e.created_at,
      })),
      ...submissions.slice(0, 5).map((s) => ({
        type: `submission-${s.status}`,
        name: s.tool_name,
        date: s.created_at,
      })),
    ];
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return activity.slice(0, 10);
  }, [adminEdits, submissions]);

  const statCards = [
    { label: "Total Tools in Catalog", value: stats.totalTools, icon: BarChart3, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pending Submissions", value: stats.pendingSubmissions, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" },
    { label: "Admin Edits", value: stats.adminEditsCount, icon: Edit3, color: "text-violet-600 dark:text-violet-400" },
    { label: "Total Submissions", value: stats.totalSubmissions, icon: Send, color: "text-sky-600 dark:text-sky-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Overview of your AI tool catalog.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`size-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant={item.type === "add" ? "default" : item.type === "edit" ? "secondary" : item.type === "delete" ? "destructive" : "outline"}
                      className="shrink-0 text-[10px]"
                    >
                      {item.type}
                    </Badge>
                    <span className="truncate font-medium">{item.name}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground ml-2">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Manage Tools Tab ---------- */
function ToolsTab({
  catalog,
  loading,
  categories,
  adminEdits,
  onRefresh,
}: {
  catalog: CatalogData;
  loading: boolean;
  categories: string[];
  adminEdits: AdminEditRow[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [pricingFilter, setPricingFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [deleteTool, setDeleteTool] = useState<Tool | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tool>>({});
  const [saving, setSaving] = useState(false);

  // Build sorted category list from catalog
  const sortedCategories = useMemo(() => {
    return Object.keys(catalog.categories).sort((a, b) =>
      catalog.categories[b] - catalog.categories[a]
    );
  }, [catalog.categories]);

  // Apply admin edits to catalog for display
  const mergedTools = useMemo(() => {
    let tools = [...catalog.tools];

    // Apply deletes
    const deletes = new Set(adminEdits.filter((e) => e.action === "delete").map((e) => e.original_name));
    tools = tools.filter((t) => !deletes.has(t.n));

    // Apply edits
    const edits = adminEdits.filter((e) => e.action === "edit");
    const editMap = new Map(edits.map((e) => [e.original_name, e.tool_data as Tool]));
    tools = tools.map((t) => (editMap.has(t.n) ? { ...t, ...editMap.get(t.n) } : t));

    // Apply adds
    const adds = adminEdits.filter((e) => e.action === "add");
    for (const add of adds) {
      const toolData = add.tool_data as Tool;
      if (!tools.some((t) => t.n === toolData.n)) {
        tools.unshift(toolData);
      }
    }

    return tools;
  }, [catalog.tools, adminEdits]);

  const filtered = useMemo(() => {
    let result = mergedTools;
    if (categoryFilter !== "All") {
      result = result.filter((t) => t.c === categoryFilter);
    }
    if (pricingFilter !== "All") {
      if (pricingFilter === "Free") {
        result = result.filter((t) => ["Free", "Free Plan", "Free Trial", "Free Credits", "Daily Free", "Monthly Free", "Open Source", "open_source", "freemium"].includes(t.p));
      } else if (pricingFilter === "Paid") {
        result = result.filter((t) => ["Paid", "Paid Plans", "paid"].includes(t.p));
      } else {
        result = result.filter((t) => t.p === pricingFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.n.toLowerCase().includes(q) ||
          t.d.toLowerCase().includes(q) ||
          t.c.toLowerCase().includes(q)
      );
    }
    return result;
  }, [mergedTools, search, categoryFilter, pricingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTools = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, pricingFilter]);

  const openEdit = (tool: Tool) => {
    setEditTool(tool);
    setEditForm({ ...tool });
  };

  const handleSaveEdit = async () => {
    if (!editTool || !editForm.n || !editForm.u) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("admin_tool_edits").insert({
        original_name: editTool.n,
        tool_data: {
          n: editForm.n || editTool.n,
          d: editForm.d || editTool.d,
          c: editForm.c || editTool.c,
          g: editForm.g || editTool.g,
          p: editForm.p || editTool.p,
          u: editForm.u || editTool.u,
          fl: editForm.fl || editTool.fl,
          badges: editForm.badges || [],
          pos: typeof editForm.pos === "number" && Number.isFinite(editForm.pos) ? editForm.pos : undefined,
          posr: typeof editForm.posr === "number" && Number.isFinite(editForm.posr) ? editForm.posr : undefined,
          posa: typeof editForm.posa === "number" && Number.isFinite(editForm.posa) ? editForm.posa : undefined,
        },

        action: "edit",
      });
      if (error) throw error;
      toast.success(`Updated "${editForm.n}"`);
      setEditTool(null);
      onRefresh();
    } catch (err) {
      toast.error("Failed to save edit: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTool) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("admin_tool_edits").insert({
        original_name: deleteTool.n,
        tool_data: { n: deleteTool.n },
        action: "delete",
      });
      if (error) throw error;
      toast.success(`Deleted "${deleteTool.n}"`);
      setDeleteTool(null);
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Manage Tools</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse, edit, and remove tools from the catalog. {mergedTools.length.toLocaleString()} tools total.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tools by name, description, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-11 w-full sm:w-56">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="All">All Categories</SelectItem>
            {sortedCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat} ({catalog.categories[cat]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pricingFilter} onValueChange={setPricingFilter}>
          <SelectTrigger className="h-11 w-full sm:w-40">
            <SelectValue placeholder="All Pricing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Pricing</SelectItem>
            <SelectItem value="Free">Free</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="mt-8 flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading catalog...</span>
        </div>
      ) : (
        <>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filtered.length.toLocaleString()} results
          </div>

          <div className="mt-4 space-y-2">
            {paginatedTools.map((tool) => (
              <div
                key={tool.n + tool.u}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-sm">{tool.n}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {tool.c}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">{tool.d}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{tool.p}</span>
                    <span className="truncate text-[11px] text-muted-foreground max-w-xs">{tool.u}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={tool.u} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <ExternalLink className="size-3.5" />
                      <span className="hidden sm:inline">Visit</span>
                    </Button>
                  </a>
                  <Button size="sm" variant="outline" onClick={() => openEdit(tool)}>
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteTool(tool)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTool} onOpenChange={() => setEditTool(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tool: {editTool?.n}</DialogTitle>
            <DialogDescription>Changes will be applied to the live catalog after saving.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tool Name *</label>
              <Input value={editForm.n || ""} onChange={(e) => setEditForm({ ...editForm, n: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description *</label>
              <Input value={editForm.d || ""} onChange={(e) => setEditForm({ ...editForm, d: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <Select value={editForm.c || ""} onValueChange={(v) => setEditForm({ ...editForm, c: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {sortedCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Group</label>
                <Input value={editForm.g || ""} onChange={(e) => setEditForm({ ...editForm, g: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Pricing</label>
                <Select value={editForm.p || ""} onValueChange={(v) => setEditForm({ ...editForm, p: v })}>
                  <SelectTrigger><SelectValue placeholder="Select pricing" /></SelectTrigger>
                  <SelectContent>
                    {PRICING_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Logo URL</label>
                <Input value={editForm.fl || ""} onChange={(e) => setEditForm({ ...editForm, fl: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">URL *</label>
              <Input value={editForm.u || ""} onChange={(e) => setEditForm({ ...editForm, u: e.target.value })} />
            </div>

            {/* Premium badges — admin-only. Verified pushes to #1, Exclusive to #2, more badges = higher rank. */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <label className="mb-2 block text-sm font-semibold">Premium Badges</label>
              <p className="mb-2 text-[11px] text-muted-foreground">
                Verified = #1 rank · Exclusive = #2 (holographic BG) · more badges rank higher. Select up to 5.
              </p>
              <div className="flex flex-wrap gap-2">
                {PREMIUM_BADGES.map((b) => {
                  const active = (editForm.badges || []).includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        const cur = new Set(editForm.badges || []);
                        if (active) cur.delete(b);
                        else if (cur.size < 5) cur.add(b);
                        setEditForm({ ...editForm, badges: Array.from(cur) });
                      }}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                        active
                          ? b === "Verified" ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow"
                          : b === "Exclusive" ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow"
                          : b === "Trending" ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow"
                          : b === "Super Valuable" ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow"
                          : "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow"
                          : "border border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {active ? "✓ " : "+ "}{b}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Positioning (rank)</label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 1 — leave empty for automatic ranking"
                value={typeof editForm.pos === "number" ? editForm.pos : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setEditForm({ ...editForm, pos: v === "" ? undefined : Number(v) });
                }}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Lower number = higher rank across category, rankings, and All pages. Two tools with the same number appear side-by-side.
              </p>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTool(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTool} onOpenChange={() => setDeleteTool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleteTool?.n}&rdquo;?</DialogTitle>
            <DialogDescription>
              This will hide the tool from the catalog. This action can be undone later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTool(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Submissions Tab ---------- */
function SubmissionsTab({
  submissions,
  loading,
  categories,
  onRefresh,
}: {
  submissions: SubmissionRow[];
  loading: boolean;
  categories: string[];
  onRefresh: () => void;
}) {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  const handleApprove = async (sub: SubmissionRow) => {
    setSaving(true);
    try {
      // Create tool edit entry
      const toolData: Tool = {
        n: sub.tool_name,
        d: sub.description,
        c: sub.category,
        g: "",
        p: sub.pricing || "Free",
        u: sub.tool_url,
        fl: sub.logo_url || undefined,
      };
      const { error: editError } = await supabase.from("admin_tool_edits").insert({
        original_name: null,
        tool_data: toolData,
        action: "add",
      });
      if (editError) throw editError;

      // Update submission status
      const { error: subError } = await supabase
        .from("tool_submissions")
        .update({ status: "approved" })
        .eq("id", sub.id);
      if (subError) throw subError;

      toast.success(`Approved "${sub.tool_name}"`);
      onRefresh();
    } catch (err) {
      toast.error("Failed to approve: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tool_submissions")
        .update({ status: "rejected", admin_notes: rejectNotes || null })
        .eq("id", rejectId);
      if (error) throw error;
      toast.success("Submission rejected");
      setRejectId(null);
      setRejectNotes("");
      onRefresh();
    } catch (err) {
      toast.error("Failed to reject: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
      case "approved":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
      default:
        return "";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Submissions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review tool submissions from users.
      </p>

      <div className="mt-4 flex gap-2">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
            className="capitalize"
          >
            {s}
            {s !== "all" && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                {submissions.filter((sub) => sub.status === s).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading submissions...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center text-sm text-muted-foreground">
          No {statusFilter !== "all" ? statusFilter : ""} submissions found.
        </div>
      ) : (
        <div className="mt-6 max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto pr-1">
          {filtered.map((sub) => (
            <div key={sub.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{sub.tool_name}</span>
                    <Badge className={`text-[10px] ${statusColor(sub.status)}`}>
                      {sub.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sub.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <a href={sub.tool_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                      {sub.tool_url} <ExternalLink className="size-2.5" />
                    </a>
                    <span>Category: {sub.category}</span>
                    <span>Pricing: {sub.pricing}</span>
                  </div>
                  {sub.submitter_name && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      By {sub.submitter_name} {sub.submitter_email ? `(${sub.submitter_email})` : ""}
                    </div>
                  )}
                  {sub.admin_notes && (
                    <div className="mt-2 rounded bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
                      <strong>Admin notes:</strong> {sub.admin_notes}
                    </div>
                  )}
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    {new Date(sub.created_at).toLocaleString()}
                  </div>
                </div>
                {sub.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(sub)} disabled={saving}>
                      <Check className="size-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setRejectId(sub.id)}>
                      <X className="size-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>Optionally add a reason for rejection.</DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Reason for rejection (optional)..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectId(null); setRejectNotes(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Add Tool Tab ---------- */
function AddToolTab({
  categories,
  onRefresh,
}: {
  categories: string[];
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    category: "Other",
    group: "",
    pricing: "Free",
    logoUrl: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim() || !form.description.trim()) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("admin_tool_edits").insert({
        original_name: null,
        tool_data: {
          n: form.name,
          d: form.description,
          c: form.category,
          g: form.group,
          p: form.pricing,
          u: form.url,
          fl: form.logoUrl || undefined,
        },
        action: "add",
      });
      if (error) throw error;
      toast.success(`Added "${form.name}" to catalog`);
      setForm({ name: "", url: "", description: "", category: "Other", group: "", pricing: "Free", logoUrl: "" });
      onRefresh();
    } catch (err) {
      toast.error("Failed to add tool: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Add Tool</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a new AI tool directly to the catalog.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-border bg-card p-6">
        <div>
          <label className="mb-1 block text-sm font-semibold">Tool Name *</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. ChatGPT"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">URL *</label>
          <Input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Description *</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the tool..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Category</label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Group</label>
            <Input
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              placeholder="Optional group"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Pricing</label>
            <Select value={form.pricing} onValueChange={(v) => setForm({ ...form, pricing: v })}>
              <SelectTrigger><SelectValue placeholder="Select pricing" /></SelectTrigger>
              <SelectContent>
                {PRICING_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Logo URL</label>
            <Input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add Tool to Catalog
        </Button>
      </form>
    </div>
  );
}
