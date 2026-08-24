import { FormEvent, useState } from "react";
import { ClipboardList } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Field";

export default function Checklists() {
  const store = useAdminStore();
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/checklists", {
        method: "POST",
        body: {
          document_type: String(data.get("document_type")),
          description: String(data.get("description") || ""),
          allowed_file_types: String(data.get("types") || "pdf"),
          max_file_size_mb: Number(data.get("size") || 20),
          is_required: Boolean(data.get("required")),
        },
      });
      e.currentTarget.reset();
      await refreshStore();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string, is_active: boolean) => {
    await api(`/checklists/${id}`, { method: "PATCH", body: { is_active } });
    await refreshStore();
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Document checklists</h1>
          <p className="text-slate-600">Required files students see when they upload documents.</p>
        </div>
      </div>
      <Card className="mb-4 p-5">
        <p className="font-semibold">Add document type</p>
        <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => void add(e)}>
          <div><Label>Document type</Label><Input name="document_type" required /></div>
          <div><Label>Allowed types</Label><Input name="types" defaultValue="pdf,jpg,png" /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea name="description" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="required" defaultChecked /> Required</label>
          <div className="flex items-end"><Button type="submit" disabled={busy}>Add</Button></div>
        </form>
      </Card>
      <div className="grid gap-3">
        {store.checklists.map((item) => (
          <Card key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{item.document_type}</p>
              <p className="text-sm text-slate-500">{item.description}</p>
              <p className="mt-1 text-xs text-slate-400">{(item.allowed_file_types || []).join(", ")} · max {item.max_file_size_mb || 20} MB</p>
            </div>
            <div className="flex items-center gap-2">
              {item.is_required && <Badge value="hot" />}
              <Badge value={item.is_active === false ? "cold" : "assigned"} />
              <Button size="sm" variant="secondary" onClick={() => void toggle(item.id, item.is_active === false)}>
                {item.is_active === false ? "Activate" : "Hide"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
