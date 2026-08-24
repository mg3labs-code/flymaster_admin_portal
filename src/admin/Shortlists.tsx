import { useMemo, useState } from "react";
import { University } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { counselorLabel, personName } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";

export default function Shortlists() {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.shortlists.filter((item) =>
      `${personName(store.leads, item.student_id)} ${item.university_name} ${item.course_name}`.toLowerCase().includes(q),
    );
  }, [store.shortlists, store.leads, query]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <University className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">University shortlists</h1>
          <p className="text-slate-600">Recommendations counselors sent to students.</p>
        </div>
      </div>
      <Input className="mb-4 max-w-sm" placeholder="Search shortlists..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="grid gap-3">
        {rows.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.university_name}</p>
                <p className="text-sm text-slate-500">{item.course_name} · {item.location}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {personName(store.leads, item.student_id)} · {counselorLabel(store.counselors, item.counselor_id)}
                </p>
                {item.counselor_notes && <p className="mt-2 text-sm">{item.counselor_notes}</p>}
              </div>
              <Badge value={item.status || "recommended"} />
            </div>
          </Card>
        ))}
        {rows.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No shortlists yet.</Card>}
      </div>
    </div>
  );
}
