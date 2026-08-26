import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, FileText, MessageCircle, Users } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { displayName, initials, isConvertedStudent, studentOwns, telecallerLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DocumentRow, Lead } from "@/lib/types";

const SILENT_DAYS = 7;
type Tab = "students" | "conversations" | "documents";

function daysSince(value?: string | null) {
  if (!value) return null;
  const ms = Date.now() - new Date(value).getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / 86400000);
}

function whenLabel(value?: string | null) {
  const days = daysSince(value);
  if (days === null) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function docProgress(docs: DocumentRow[]) {
  if (!docs.length) return 0;
  return Math.round((docs.filter((doc) => doc.status === "approved").length / docs.length) * 100);
}

function docBadge(status: string) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "uploaded" || status === "pending") return "uploaded";
  return "requested";
}

export default function CounselorDetail() {
  const { id = "" } = useParams();
  const store = useAdminStore();
  const [tab, setTab] = useState<Tab>("students");
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const counselor = store.counselors.find((row) => row.id === id || row.auth_user_id === id) || null;

  const students = useMemo(
    () =>
      counselor
        ? store.leads
            .filter(
              (lead) =>
                isConvertedStudent(lead) &&
                (counselor.id === lead.assigned_counselor_id || counselor.auth_user_id === lead.assigned_counselor_id),
            )
            .sort((a, b) => String(b.conversion_date || "").localeCompare(String(a.conversion_date || "")))
        : [],
    [counselor, store.leads],
  );

  const docsFor = (student: Lead) =>
    store.documents.filter((doc) => !doc.archived && studentOwns(student, doc.user_id));

  const messagesFor = (student: Lead) => {
    const threads = store.conversations.filter((row) => studentOwns(student, row.student_id));
    const ids = new Set(threads.map((row) => row.id));
    return store.messages
      .filter((msg) => ids.has(msg.conversation_id))
      .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  };

  const lastMessageAt = (student: Lead) => {
    const all = messagesFor(student);
    return all.length ? all[all.length - 1].created_at : null;
  };

  const allDocs = students.flatMap(docsFor);
  const pendingDocs = allDocs.filter((doc) => doc.status === "uploaded" || doc.status === "pending");
  const withMessages = students.filter((student) => messagesFor(student).length);
  const longestSilence = students.reduce<number | null>((worst, student) => {
    const days = daysSince(lastMessageAt(student) || student.conversion_date);
    if (days === null) return worst;
    return worst === null || days > worst ? days : worst;
  }, null);

  if (!counselor) {
    return (
      <div>
        <Link to="/admin/counselors" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
          <ArrowLeft className="h-4 w-4" /> Back to counselors
        </Link>
        <Card className="p-8 text-center text-sm text-slate-500">
          No counselor found with this id. They may have been removed.
        </Card>
      </div>
    );
  }

  const openStudent = students.find((row) => row.id === openStudentId) || students[0] || null;

  const decide = async (docId: string, status: "approved" | "rejected") => {
    setBusyDocId(docId);
    setError("");
    try {
      await api(`/documents/${docId}`, { method: "PATCH", body: { status, comments: "" } });
      await refreshStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the document.");
    } finally {
      setBusyDocId(null);
    }
  };

  const openFile = async (docId: string) => {
    try {
      const file = await api<{ fileName: string; dataUrl: string }>(`/documents/${docId}/file`);
      const link = document.createElement("a");
      link.href = file.dataUrl;
      link.download = file.fileName || "document";
      link.target = "_blank";
      link.click();
    } catch {
      setError("Could not open this file.");
    }
  };

  const stats: Array<{ label: string; value: string | number; alert?: boolean }> = [
    { label: "Students", value: students.length },
    { label: "Documents to review", value: pendingDocs.length, alert: pendingDocs.length > 0 },
    { label: "Approved documents", value: allDocs.filter((doc) => doc.status === "approved").length },
    {
      label: "Longest silence",
      value: longestSilence === null ? "—" : `${longestSilence} days`,
      alert: longestSilence !== null && longestSilence >= SILENT_DAYS,
    },
  ];

  const tabs: Array<{ key: Tab; label: string; count: number; icon: typeof Users }> = [
    { key: "students", label: "Students", count: students.length, icon: Users },
    { key: "conversations", label: "Conversations", count: withMessages.length, icon: MessageCircle },
    { key: "documents", label: "Documents", count: allDocs.length, icon: FileText },
  ];

  return (
    <div>
      <Link to="/admin/counselors" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
        <ArrowLeft className="h-4 w-4" /> Back to counselors
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-xl font-bold text-white">
            {initials(counselor.first_name, counselor.last_name, counselor.email)}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">
                {displayName(counselor.first_name, counselor.last_name, counselor.email)}
              </h1>
              <Badge value={counselor.is_active ? "approved" : "rejected"} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {counselor.email} · {counselor.phone || "No phone on file"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {counselor.specializations?.length ? (
                counselor.specializations.map((country) => (
                  <span
                    key={country}
                    className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800"
                  >
                    {country}
                  </span>
                ))
              ) : (
                <Badge value="No country set" className="normal-case" />
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {counselor.created_at ? `Joined ${format(new Date(counselor.created_at), "PP")} · ` : ""}
              {students.length} student{students.length === 1 ? "" : "s"} · {withMessages.length} active conversation
              {withMessages.length === 1 ? "" : "s"}
            </p>
            {counselor.bio && <p className="mt-3 text-sm text-slate-600">{counselor.bio}</p>}
          </div>
          <Link to="/admin/unassigned">
            <Button size="sm">Assign students</Button>
          </Link>
        </div>
      </Card>

      {!counselor.specializations?.length && (
        <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          No country is set for this counselor, so they will never appear as a country match when you assign students.
        </Card>
      )}

      {error && <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</Card>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className={`h-4 w-4 rounded-md ${stat.alert ? "bg-rose-100" : "bg-sky-100"}`} />
            <p className={`mt-2 text-2xl font-bold ${stat.alert ? "text-rose-600" : ""}`}>{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
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
        {tab === "students" && (
          students.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              No students assigned yet. Assign them from Counselor assignment.
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-bold">Student</th>
                    <th className="px-4 py-3 font-bold">Countries</th>
                    <th className="px-4 py-3 font-bold">Documents</th>
                    <th className="px-4 py-3 font-bold">Last message</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const docs = docsFor(student);
                    const progress = docProgress(docs);
                    const last = lastMessageAt(student);
                    const silent = daysSince(last || student.conversion_date) ?? 0;
                    return (
                      <tr
                        key={student.id}
                        className="cursor-pointer border-b border-slate-100 text-sm last:border-b-0 hover:bg-slate-50"
                        onClick={() => {
                          setOpenStudentId(student.id);
                          setTab("conversations");
                        }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold">
                            {displayName(student.first_name, student.last_name, student.email)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.email} · Converted by {telecallerLabel(store.telecallers, student.assigned_telecaller_id)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {student.preferred_countries?.join(", ") || "No country"}
                          <p className="text-xs text-slate-500">{student.field_of_interest || "No field"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                              <span
                                className={`block h-full rounded-full ${
                                  progress < 40 ? "bg-rose-500" : progress < 80 ? "bg-gold-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </span>
                            <span className="text-xs text-slate-600">{progress}%</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {docs.filter((doc) => doc.status === "uploaded" || doc.status === "pending").length} awaiting review
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {last ? (
                            <span className={`text-xs ${silent >= SILENT_DAYS ? "font-semibold text-rose-600" : "text-slate-600"}`}>
                              {whenLabel(last)}
                            </span>
                          ) : (
                            <Badge value="Never" className="normal-case" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )
        )}

        {tab === "conversations" && (
          students.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">No students, so no conversations yet.</Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <Card className="max-h-[62vh] overflow-y-auto p-2">
                {students.map((student) => {
                  const all = messagesFor(student);
                  const last = all[all.length - 1];
                  const active = openStudent?.id === student.id;
                  return (
                    <button
                      key={student.id}
                      onClick={() => setOpenStudentId(student.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left ${active ? "bg-sky-50" : "hover:bg-slate-50"}`}
                    >
                      <p className="text-sm font-semibold">
                        {displayName(student.first_name, student.last_name, student.email)}
                      </p>
                      <p className="truncate text-xs text-slate-500">{last ? last.message : "No messages yet"}</p>
                      {last?.created_at && <p className="text-[11px] text-slate-400">{whenLabel(last.created_at)}</p>}
                    </button>
                  );
                })}
              </Card>

              <Card className="flex max-h-[62vh] flex-col overflow-hidden">
                {openStudent && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4">
                      <div>
                        <p className="font-semibold">
                          {displayName(openStudent.first_name, openStudent.last_name, openStudent.email)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {openStudent.preferred_countries?.join(", ") || "No country"} ·{" "}
                          {openStudent.field_of_interest || "No field"}
                        </p>
                      </div>
                      <Badge value={`${docProgress(docsFor(openStudent))}% documents`} className="normal-case" />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
                      {messagesFor(openStudent).length === 0 && (
                        <p className="py-10 text-center text-sm text-slate-500">No messages exchanged yet.</p>
                      )}
                      {messagesFor(openStudent).map((msg) => {
                        const fromStudent = studentOwns(openStudent, msg.sender_id);
                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm ${
                              fromStudent
                                ? "self-start rounded-bl-sm border border-slate-200 bg-white"
                                : "self-end rounded-br-sm bg-navy-900 text-white"
                            }`}
                          >
                            <p>{msg.message}</p>
                            {msg.created_at && (
                              <p className={`mt-1 text-[11px] ${fromStudent ? "text-slate-400" : "text-white/60"}`}>
                                {format(new Date(msg.created_at), "PP p")}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="border-t border-slate-200 bg-white p-3 text-xs text-slate-500">
                      Admin view is read-only. The counselor replies from the counselor portal.
                    </p>
                  </>
                )}
              </Card>
            </div>
          )
        )}

        {tab === "documents" && (
          allDocs.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              No documents uploaded by this counselor&apos;s students yet.
            </Card>
          ) : (
            <div className="grid gap-3">
              {students.map((student) => {
                const docs = docsFor(student);
                if (!docs.length) return null;
                return (
                  <Card key={student.id} className="overflow-hidden">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {displayName(student.first_name, student.last_name, student.email)} ·{" "}
                      {student.preferred_countries?.join(", ") || "No country"} · {docProgress(docs)}% approved
                    </div>
                    {docs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{doc.document_type}</p>
                          <p className="text-xs text-slate-500">
                            {doc.file_name || "Not uploaded yet"}
                            {doc.created_at ? ` · ${whenLabel(doc.created_at)}` : ""}
                          </p>
                          {doc.admin_comments && <p className="mt-0.5 text-xs text-rose-600">{doc.admin_comments}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge value={docBadge(doc.status)} />
                          <Button size="sm" variant="secondary" onClick={() => void openFile(doc.id)}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyDocId === doc.id || doc.status === "approved"}
                            onClick={() => void decide(doc.id, "approved")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyDocId === doc.id || doc.status === "rejected"}
                            onClick={() => void decide(doc.id, "rejected")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}