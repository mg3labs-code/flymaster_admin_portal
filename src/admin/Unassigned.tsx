import { useMemo, useState } from "react";
import { Globe } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { counselorLabel, displayName, isConvertedStudent, suggestCounselorForCountries, telecallerLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";

export default function Unassigned() {
  const store = useAdminStore();
  const [counselorId, setCounselorId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const students = useMemo(
    () => store.leads.filter((lead) => isConvertedStudent(lead) && !lead.assigned_counselor_id),
    [store.leads],
  );

  const assign = async (ids: string[], autoByCountry = false) => {
    if (!ids.length || (!autoByCountry && !counselorId)) return;
    setBusy(true);
    try {
      await api("/leads/bulk-assign", {
        method: "POST",
        body: { ids, counselorId: autoByCountry ? undefined : counselorId, autoByCountry },
      });
      setSelected([]);
      await refreshStore();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Globe className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Counselor assignment</h1>
          <p className="text-slate-600">
            Converted students waiting for a country counselor — assign manually or auto-match by preferred country.
          </p>
        </div>
      </div>

      <Card className="mt-2 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <p className="mb-1.5 text-sm font-medium text-slate-700">Counselor (manual)</p>
            <Select value={counselorId} onChange={(e) => setCounselorId(e.target.value)}>
              <option value="">Choose counselor</option>
              {store.counselors.map((item) => (
                <option key={item.id} value={item.id}>
                  {displayName(item.first_name, item.last_name, item.email)}
                  {item.specializations?.length ? ` · ${item.specializations.join(", ")}` : ""}
                </option>
              ))}
            </Select>
          </div>
          <Button disabled={busy || !counselorId || selected.length === 0} onClick={() => void assign(selected)}>
            Assign selected ({selected.length})
          </Button>
          <Button
            variant="secondary"
            disabled={busy || selected.length === 0}
            onClick={() => void assign(selected, true)}
          >
            Auto-assign by country ({selected.length})
          </Button>
          <Button
            variant="secondary"
            disabled={busy || students.length === 0}
            onClick={() => void assign(students.map((s) => s.id), true)}
          >
            Auto-assign all
          </Button>
        </div>
      </Card>

      <div className="mt-4 grid gap-3">
        {students.map((student) => {
          const checked = selected.includes(student.id);
          const suggested = suggestCounselorForCountries(store.counselors, student.preferred_countries || []);
          return (
            <Card key={student.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setSelected((current) => checked ? current.filter((id) => id !== student.id) : [...current, student.id])}
                />
                <span>
                  <span className="block font-medium">{displayName(student.first_name, student.last_name, student.email)}</span>
                  <span className="text-xs text-slate-500">
                    {(student.preferred_countries || []).join(", ") || "No country"} · {student.field_of_interest || "No field"}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    Converted by {telecallerLabel(store.telecallers, student.assigned_telecaller_id)}
                    {suggested && <> · Suggested: {counselorLabel(store.counselors, suggested.id)}</>}
                  </span>
                </span>
              </label>
              <div className="flex items-center gap-2">
                <Badge value="converted" />
                {suggested && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void api("/leads/bulk-assign", {
                      method: "POST",
                      body: { ids: [student.id], counselorId: suggested.id },
                    }).then(() => refreshStore())}
                  >
                    Assign {displayName(suggested.first_name, suggested.last_name, "counselor")}
                  </Button>
                )}
                <Button size="sm" variant="secondary" disabled={busy || !counselorId} onClick={() => void assign([student.id])}>
                  Assign
                </Button>
              </div>
            </Card>
          );
        })}
        {students.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-500">
            Every converted student already has a country counselor assigned.
          </Card>
        )}
      </div>
    </div>
  );
}
