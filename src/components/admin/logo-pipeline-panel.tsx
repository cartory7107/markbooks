import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLogoStats, retryLogo, processLogoBatch } from "@/lib/logos.functions";

type Failure = { domain: string; error: string | null; attempts: number; updated_at: string };

/** Admin panel: TavBook-hosted logo pipeline status, retries and batch migration. */
export function LogoPipelinePanel() {
  const loadStats = useServerFn(getLogoStats);
  const runRetry = useServerFn(retryLogo);
  const runBatch = useServerFn(processLogoBatch);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [batchInput, setBatchInput] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    loadStats()
      .then((res) => {
        setCounts(res.counts);
        setFailures(res.failures as Failure[]);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [loadStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRetry = async (domain: string) => {
    setBusy(domain);
    try {
      const res = await runRetry({ data: { domain } });
      toast[res.ok ? "success" : "error"](`${domain}: ${res.status}`);
      refresh();
    } catch {
      toast.error("Retry failed");
    } finally {
      setBusy(null);
    }
  };

  const handleBatch = async () => {
    const domains = batchInput
      .split(/[\s,]+/)
      .map((d) => d.trim())
      .filter(Boolean);
    if (domains.length === 0) return;
    setBusy("batch");
    try {
      const res = await runBatch({ data: { domains } });
      toast.success(`Processed ${res.processed} — ${res.ready} ready, ${res.failed} failed, ${res.skipped} skipped`);
      setBatchInput("");
      refresh();
    } catch {
      toast.error("Batch failed");
    } finally {
      setBusy(null);
    }
  };

  const handleQueue = async () => {
    setBusy("queue");
    try {
      const res = await runBatch({ data: { fromQueue: true, limit: 25 } });
      toast.success(`Queue: ${res.ready} hosted, ${res.failed} failed`);
      refresh();
    } catch {
      toast.error("Queue run failed");
    } finally {
      setBusy(null);
    }
  };

  const tiles: Array<{ key: string; label: string; className: string }> = [
    { key: "ready", label: "Hosted logos", className: "text-emerald-500" },
    { key: "pending", label: "Queued", className: "text-sky-500" },
    { key: "processing", label: "Processing", className: "text-amber-500" },
    { key: "failed", label: "No logo found", className: "text-rose-500" },
  ];

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ImageIcon className="size-4 text-primary" /> Logo pipeline (TavBook-hosted)
        </CardTitle>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.key} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{t.label}</p>
              <p className={`text-xl font-bold ${t.className}`}>{(counts[t.key] ?? 0).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Logos are discovered, validated and stored once, then served from TavBook for every visitor.
          Any tool viewed on the site is processed automatically — use the box below to pre-warm domains in batches of up to 100.
        </p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            rows={2}
            placeholder="openai.com, notion.so, canva.com"
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <Button onClick={handleBatch} disabled={busy === "batch" || !batchInput.trim()}>
              {busy === "batch" ? <Loader2 className="size-4 animate-spin" /> : null} Process batch
            </Button>
            <Button variant="outline" onClick={handleQueue} disabled={busy === "queue"}>
              {busy === "queue" ? <Loader2 className="size-4 animate-spin" /> : null} Process queue
            </Button>
          </div>
        </div>

        {failures.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-semibold">Recent failures</p>
            <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
              {failures.map((f) => (
                <div key={f.domain} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{f.domain}</p>
                    <p className="truncate text-xs text-muted-foreground">{f.error || "unknown error"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{f.attempts} tries</Badge>
                    <Button size="sm" variant="outline" disabled={busy === f.domain} onClick={() => handleRetry(f.domain)}>
                      {busy === f.domain ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
