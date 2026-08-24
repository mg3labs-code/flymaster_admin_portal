import { useMemo, useState } from "react";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { personName } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";

function needsReview(status: string) {
  return status === "pending_counselor" || status === "submitted";
}

export default function Applications() {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("needs_review");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.applications
      .filter((app) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "needs_review") return needsReview(app.status);
        return app.status === statusFilter;
      })
      .filter((app) => `${personName(store.leads, app.user_id)} ${app.university_name} ${app.course_name}`.toLowerCase().includes(q))
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }, [store.applications, store.leads, query, statusFilter]);

  const reviewApp = store.applications.find((app) => app.id === reviewId) || null;

  const decide = async (status: "counselor_approved" | "returned") => {
    if (!reviewApp) return;
    setBusy(true);
    try {
      await api(`/applications/${reviewApp.id}`, { method: "PATCH", body: { status, comments: comments.trim() } });
      setReviewId(null);
      setComments("");
      await refreshStore();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-slate-600">University applications submitted from the student portal.</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-sm" placeholder="Search applications..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="needs_review">Needs review</option>
          <option value="counselor_approved">Approved</option>
          <option value="returned">Returned</option>
          <option value="all">All</option>
        </Select>
      </div>
      <div className="grid gap-3">
        {filtered.map((app) => (
          <Card key={app.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{app.university_name} — {app.course_name}</p>
                <p className="text-sm text-slate-500">{personName(store.leads, app.user_id)} · {app.country} {app.intake_term && `· ${app.intake_term}`}</p>
                {app.created_at && <p className="text-xs text-slate-400">{format(new Date(app.created_at), "PP p")}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge value={needsReview(app.status) ? "needs review" : app.status} />
                {needsReview(app.status) && <Button size="sm" onClick={() => { setReviewId(app.id); setComments(app.counselor_comments || ""); }}>Review</Button>}
              </div>
            </div>
            {reviewApp?.id === app.id && (
              <div className="mt-4 border-t pt-4">
                {app.notes && <p className="mb-3 text-sm text-slate-600">Student notes: {app.notes}</p>}
                <Label>Comments</Label>
                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
                <div className="mt-3 flex gap-2">
                  <Button disabled={busy} onClick={() => void decide("counselor_approved")}>Approve</Button>
                  <Button variant="danger" disabled={busy} onClick={() => void decide("returned")}>Return</Button>
                  <Button variant="ghost" onClick={() => setReviewId(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No applications in this view.</Card>}
      </div>
    </div>
  );
}
