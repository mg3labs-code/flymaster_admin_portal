import { FormEvent, useState } from "react";
import { Plane } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";

export default function Universities() {
  const store = useAdminStore();
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/universities", {
        method: "POST",
        body: {
          name: String(data.get("name")),
          country: String(data.get("country")),
          city: String(data.get("city")),
          ranking: Number(data.get("ranking") || 0),
          website_url: String(data.get("website") || ""),
          is_tie_up: Boolean(data.get("tieup")),
        },
      });
      e.currentTarget.reset();
      await refreshStore();
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string, is_active: boolean) => {
    await api(`/universities/${id}`, { method: "PATCH", body: { is_active } });
    await refreshStore();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remove this university from the catalog?")) return;
    await api(`/universities/${id}`, { method: "DELETE" });
    await refreshStore();
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Plane className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Universities</h1>
          <p className="text-slate-600">Catalog shown on the student website and used for counselor shortlists.</p>
        </div>
      </div>
      <Card className="mb-4 p-5">
        <p className="font-semibold">Add university</p>
        <form className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => void add(e)}>
          <div><Label>Name</Label><Input name="name" required /></div>
          <div><Label>Country</Label><Input name="country" required /></div>
          <div><Label>City</Label><Input name="city" /></div>
          <div><Label>Ranking</Label><Input name="ranking" type="number" /></div>
          <div><Label>Website</Label><Input name="website" /></div>
          <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" name="tieup" /> Tie-up</label>
          <div className="flex items-end"><Button type="submit" disabled={busy}>Add</Button></div>
        </form>
      </Card>
      <div className="grid gap-3">
        {store.universities.map((item) => (
          <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-slate-500">{item.city ? `${item.city}, ` : ""}{item.country}{item.ranking ? ` · rank ${item.ranking}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={item.is_active === false ? "cold" : "assigned"} />
              <Button size="sm" variant="secondary" onClick={() => void toggle(item.id, item.is_active === false)}>
                {item.is_active === false ? "Activate" : "Hide"}
              </Button>
              <Button size="sm" variant="danger" onClick={() => void remove(item.id)}>Delete</Button>
            </div>
          </Card>
        ))}
        {store.universities.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No universities in the catalog yet.</Card>}
      </div>
    </div>
  );
}
