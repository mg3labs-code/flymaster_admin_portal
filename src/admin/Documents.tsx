import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { personName } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";

function isPending(status: string) {
  return status === "uploaded" || status === "pending";
}

export default function Documents() {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("uploaded");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  const docs = store.documents.filter((doc) => !doc.archived);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs
      .filter((doc) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "uploaded") return isPending(doc.status);
        return doc.status === statusFilter;
      })
      .filter((doc) => `${personName(store.leads, doc.user_id)} ${doc.document_type} ${doc.file_name}`.toLowerCase().includes(q))
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }, [docs, statusFilter, query, store.leads]);

  const reviewDoc = docs.find((doc) => doc.id === reviewId) || null;

  const openFile = async (id: string) => {
    try {
      const file = await api<{ fileName: string; dataUrl: string }>(`/documents/${id}/file`);
      const link = document.createElement("a");
      link.href = file.dataUrl;
      link.download = file.fileName || "document";
      link.target = "_blank";
      link.click();
    } catch {
      window.alert("Could not open this file.");
    }
  };

  const decide = async (status: "approved" | "rejected") => {
    if (!reviewDoc) return;
    setBusy(true);
    try {
      await api(`/documents/${reviewDoc.id}`, { method: "PATCH", body: { status, comments: comments.trim() } });
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
        <FileText className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Document review</h1>
          <p className="text-slate-600">Approve or reject uploads from the student portal.</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-sm" placeholder="Search documents..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select className="w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="uploaded">Needs review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </Select>
      </div>
      <div className="grid gap-3">
        {filtered.map((doc) => (
          <Card key={doc.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{doc.document_type || "Document"}</p>
                <p className="text-sm text-slate-500">{personName(store.leads, doc.user_id)} · {doc.file_name}</p>
                {doc.created_at && <p className="text-xs text-slate-400">{format(new Date(doc.created_at), "PP p")}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge value={isPending(doc.status) ? "needs review" : doc.status} />
                <Button size="sm" variant="secondary" onClick={() => void openFile(doc.id)}><Download className="h-4 w-4" /> File</Button>
                {isPending(doc.status) && <Button size="sm" onClick={() => { setReviewId(doc.id); setComments(doc.admin_comments || ""); }}>Review</Button>}
              </div>
            </div>
            {reviewDoc?.id === doc.id && (
              <div className="mt-4 border-t pt-4">
                <Label>Comments to student</Label>
                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
                <div className="mt-3 flex gap-2">
                  <Button disabled={busy} onClick={() => void decide("approved")}>Approve</Button>
                  <Button variant="danger" disabled={busy} onClick={() => void decide("rejected")}>Reject</Button>
                  <Button variant="ghost" onClick={() => setReviewId(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No documents in this view.</Card>}
      </div>
    </div>
  );
}
