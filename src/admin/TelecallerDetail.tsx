import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MessageSquare, PhoneCall } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { counselorLabel, displayName, initials, isConvertedStudent } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Lead } from "@/lib/types";

const STALE_DAYS = 2;
type Tab = "open" | "converted" | "calls";

function daysSince(value?: string | null) {
  if (!value) return null;
  const ms = Date.now() - new Date(value).getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / 86400000);
}

function whenLabel(value?: string | null) {
  const days = daysSince(value);
  if (days === null) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/**
 * Telecallers have no chat table. Every call they log is appended to the lead's notes
 * as `[date] outcome — what was said`, so the call history is parsed back out of there.
 */
interface CallEntry {
  lead: Lead;
  stamp: string;
  text: string;
  sortKey: string;
}

function parseCalls(lead: Lead): CallEntry[] {
  if (!lead.notes) return [];
  return lead.notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[(.+?)\]\s*(.*)$/);
      const stamp = match ? match[1] : "";
      const text = match ? match[2] : line;
      const parsed = stamp ? new Date(stamp) : null;
      return {
        lead,
        stamp: stamp || "Undated",
        text,
        sortKey: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "",
      };
    });
}

function waitLabel(lead: Lead) {
  const today = new Date().toISOString().slice(0, 10);
  if (lead.next_follow_up_date) {
    const due = lead.next_follow_up_date.slice(0, 10);
    if (due < today) return { text: `Follow-up overdue since ${due}`, late: true };
    if (due === today) return { text: "Follow-up due today", late: true };
    return { text: `Follow-up ${due}`, late: false };
  }
  if (!lead.last_contact_date) {
    const d = daysSince(lead.created_at);
    return { text: d === null ? "Never called" : `Never called · ${d}d old`, late: (d ?? 0) >= STALE_DAYS };
  }
  const d = daysSince(lead.last_contact_date) ?? 0;
  return { text: d === 0 ? "Called today" : `Last called ${d}d ago`, late: d >= STALE_DAYS };
}

export default function TelecallerDetail() {
  const { id = "" } = useParams();
  const store = useAdminStore();
  const [tab, setTab] = useState<Tab>("open");

  const telecaller = store.telecallers.find((row) => row.id === id) || null;

  const mine = useMemo(
    () => (telecaller ? store.leads.filter((lead) => lead.assigned_telecaller_id === telecaller.id) : []),
    [telecaller, store.leads],
  );

  const open = mine
    .filter((lead) => !isConvertedStudent(lead))
    .sort((a, b) => (waitLabel(b).late ? 1 : 0) - (waitLabel(a).late ? 1 : 0));
  const converted = mine
    .filter((lead) => isConvertedStudent(lead))
    .sort((a, b) => String(b.conversion_date || "").localeCompare(String(a.conversion_date || "")));

  const calls = useMemo(
    () =>
      mine
        .flatMap(parseCalls)
        .sort((a, b) => b.sortKey.localeCompare(a.sortKey)),
    [mine],
  );

  if (!telecaller) {
    return (
      <div>
        <Link to="/admin/telecallers" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
          <ArrowLeft className="h-4 w-4" /> Back to telecallers
        </Link>
        <Card className="p-8 text-center text-sm text-slate-500">No telecaller found with this id.</Card>
      </div>
    );
  }

  const neverCalled = open.filter((lead) => !lead.last_contact_date).length;
  const overdue = open.filter((lead) => waitLabel(lead).late).length;
  const thisMonth = converted.filter(
    (lead) => (lead.conversion_date || "").slice(0, 7) === new Date().toISOString().slice(0, 7),
  ).length;

  const stats: Array<{ label: string; value: string | number; alert?: boolean }> = [
    { label: "Open leads", value: open.length },
    { label: "Needs a call", value: overdue, alert: overdue > 0 },
    { label: "Never called", value: neverCalled, alert: neverCalled > 0 },
    { label: "Converted this month", value: thisMonth },
  ];

  const tabs: Array<{ key: Tab; label: string; count: number; icon: typeof PhoneCall }> = [
    { key: "open", label: "Open leads", count: open.length, icon: PhoneCall },
    { key: "converted", label: "Converted students", count: converted.length, icon: CheckCircle2 },
    { key: "calls", label: "Call history", count: calls.length, icon: MessageSquare },
  ];

  return (
    <div>
      <Link to="/admin/telecallers" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
        <ArrowLeft className="h-4 w-4" /> Back to telecallers
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-xl font-bold text-white">
            {initials(telecaller.first_name, telecaller.last_name, telecaller.email)}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">
                {displayName(telecaller.first_name, telecaller.last_name, telecaller.email)}
              </h1>
              <Badge value={telecaller.is_active === false ? "rejected" : "telecaller"} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {telecaller.email} · {telecaller.phone || "No phone"}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {mine.length} lead{mine.length === 1 ? "" : "s"} handled · {converted.length} converted ·{" "}
              {calls.length} call{calls.length === 1 ? "" : "s"} logged
            </p>
          </div>
        </div>
      </Card>

      {overdue > 0 && (
        <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {overdue} of their leads need a call today.
        </Card>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className={`h-4 w-4 rounded-md ${stat.alert ? "bg-rose-100" : "bg-sky-100"}`} />
            <p className={`mt-2 text-2xl font-bold ${stat.alert ? "text-rose-600" : ""}`}>{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${
              tab === key ? "border-sky-500 text-navy-900" : "border-transparent text-slate-500 hover:text-navy-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                tab === key ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "open" &&
          (open.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              No open leads. Assign some from Telecaller Leads.
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {open.map((lead) => {
                const wait = waitLabel(lead);
                return (
                  <div
                    key={lead.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {displayName(lead.first_name, lead.last_name, lead.email)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {lead.phone || "No phone"} · {(lead.preferred_countries || []).join(", ") || "No country"}
                      </p>
                      <p className={`mt-1 text-xs ${wait.late ? "font-semibold text-rose-600" : "text-slate-400"}`}>
                        {wait.text} · {parseCalls(lead).length} call{parseCalls(lead).length === 1 ? "" : "s"} logged
                      </p>
                    </div>
                    <Badge value={lead.lead_status || "warm"} />
                  </div>
                );
              })}
            </Card>
          ))}

        {tab === "converted" &&
          (converted.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              They have not converted anyone yet.
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {converted.map((student) => (
                <Link
                  key={student.id}
                  to={`/admin/students/${student.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 transition last:border-b-0 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {displayName(student.first_name, student.last_name, student.email)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {(student.preferred_countries || []).join(", ") || "No country"} ·{" "}
                      {student.field_of_interest || "No field"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Converted {whenLabel(student.conversion_date)} · Counselor:{" "}
                      {counselorLabel(store.counselors, student.assigned_counselor_id)}
                    </p>
                  </div>
                  {!student.assigned_counselor_id && (
                    <Badge value="unassigned" className="normal-case">No counselor</Badge>
                  )}
                </Link>
              ))}
            </Card>
          ))}

        {tab === "calls" &&
          (calls.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              No calls logged yet. Entries appear here when they log a call from the telecaller site.
            </Card>
          ) : (
            <>
              <Card className="mb-4 border-sky-100 bg-sky-50 p-4 text-xs text-slate-700">
                Telecallers and students do not chat in the app. This is the call log — what the
                telecaller recorded after each phone call, newest first.
              </Card>
              <Card className="overflow-hidden">
                {calls.map((entry, index) => (
                  <div
                    key={`${entry.lead.id}-${index}`}
                    className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {displayName(entry.lead.first_name, entry.lead.last_name, entry.lead.email)}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">{entry.text}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{entry.stamp}</span>
                  </div>
                ))}
              </Card>
            </>
          ))}
      </div>
    </div>
  );
}