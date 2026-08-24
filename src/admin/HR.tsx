import { FormEvent, useState } from "react";
import { Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { displayName } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";

function counselorName(
  counselors: Array<{ id: string; auth_user_id?: string | null; first_name?: string; last_name?: string; email?: string }>,
  id: string,
) {
  const found = counselors.find((row) => row.id === id || row.auth_user_id === id);
  return found ? displayName(found.first_name, found.last_name, found.email || "Counselor") : "Counselor";
}

export default function HR() {
  const store = useAdminStore();
  const [tab, setTab] = useState<"leave" | "attendance" | "salary">("leave");
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState("");

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusy(true);
    try {
      await api(`/leave/${id}`, { method: "PATCH", body: { status, comments } });
      setComments("");
      await refreshStore();
    } finally {
      setBusy(false);
    }
  };

  const postSalary = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/salary", {
        method: "POST",
        body: {
          counselorId: String(data.get("counselorId")),
          month: String(data.get("month")),
          year: Number(data.get("year")),
          netSalary: Number(data.get("netSalary")),
          notes: String(data.get("notes") || ""),
        },
      });
      e.currentTarget.reset();
      await refreshStore();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not post salary");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Wallet className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">HR</h1>
          <p className="text-slate-600">Leave approval, attendance, and salary for counselors.</p>
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        {(["leave", "attendance", "salary"] as const).map((item) => (
          <Button key={item} size="sm" variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>
            {item}
          </Button>
        ))}
      </div>

      {tab === "leave" && (
        <div className="grid gap-3">
          <Textarea placeholder="Optional comment to the counselor" value={comments} onChange={(e) => setComments(e.target.value)} />
          {store.leave.map((row) => (
            <Card key={row.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{counselorName(store.counselors, row.counselor_id)}</p>
                  <p className="text-sm text-slate-500">{row.leave_type} · {row.start_date} to {row.end_date} · {row.total_days} days</p>
                  {row.reason && <p className="mt-2 text-sm">{row.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={row.status} />
                  {row.status === "pending" && (
                    <>
                      <Button size="sm" disabled={busy} onClick={() => void decide(row.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="danger" disabled={busy} onClick={() => void decide(row.id, "rejected")}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {store.leave.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No leave requests.</Card>}
        </div>
      )}

      {tab === "attendance" && (
        <div className="grid gap-3">
          {store.attendance.map((row) => (
            <Card key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{counselorName(store.counselors, row.counselor_id)}</p>
                <p className="text-sm text-slate-500">
                  {row.date} · in {row.clock_in || "—"} · out {row.clock_out || "—"} · {row.total_hours == null ? "—" : `${Number(row.total_hours).toFixed(2)} hrs`}
                </p>
              </div>
              <Badge value={row.clock_out ? "approved" : row.clock_in ? "assigned" : "pending"} />
            </Card>
          ))}
          {store.attendance.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No attendance records.</Card>}
        </div>
      )}

      {tab === "salary" && (
        <div>
          <Card className="mb-4 p-5">
            <p className="font-semibold">Post salary</p>
            <form className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => void postSalary(e)}>
              <div>
                <Label>Counselor</Label>
                <Select name="counselorId" required defaultValue="">
                  <option value="" disabled>Choose</option>
                  {store.counselors.map((item) => (
                    <option key={item.id} value={item.id}>{displayName(item.first_name, item.last_name, item.email)}</option>
                  ))}
                </Select>
              </div>
              <div><Label>Month</Label><Input name="month" placeholder="August" required /></div>
              <div><Label>Year</Label><Input name="year" type="number" defaultValue={new Date().getFullYear()} required /></div>
              <div><Label>Net salary</Label><Input name="netSalary" type="number" required /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><Input name="notes" /></div>
              <div className="flex items-end"><Button type="submit" disabled={busy}>Post</Button></div>
            </form>
          </Card>
          <div className="grid gap-3">
            {store.salary.map((row) => (
              <Card key={row.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{counselorName(store.counselors, row.counselor_id)}</p>
                  <p className="text-sm text-slate-500">{row.month} {row.year}{row.notes ? ` · ${row.notes}` : ""}</p>
                </div>
                <p className="font-semibold">₹{Number(row.net_salary).toLocaleString()}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
