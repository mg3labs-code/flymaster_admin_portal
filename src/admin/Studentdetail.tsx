// import { useMemo, useState } from "react";
// import { Link, useParams } from "react-router-dom";
// import { format } from "date-fns";
// import { ArrowLeft, BookOpen, FileText, MessageCircle, MessagesSquare, University, User } from "lucide-react";
// import { api } from "@/lib/api";
// import { refreshStore, useAdminStore } from "@/lib/store";
// import { counselorLabel, displayName, initials, studentOwns, telecallerLabel } from "@/lib/utils";
// import { Badge } from "@/components/ui/Badge";
// import { Button } from "@/components/ui/Button";
// import { Card } from "@/components/ui/Card";
// import type { DocumentRow } from "@/lib/types";

// const SILENT_DAYS = 7;
// type Tab = "overview" | "documents" | "applications" | "shortlists" | "chat" | "ai";

// function daysSince(value?: string | null) {
//   if (!value) return null;
//   const ms = Date.now() - new Date(value).getTime();
//   if (Number.isNaN(ms) || ms < 0) return 0;
//   return Math.floor(ms / 86400000);
// }

// function whenLabel(value?: string | null) {
//   const days = daysSince(value);
//   if (days === null) return "—";
//   if (days === 0) return "Today";
//   if (days === 1) return "Yesterday";
//   return `${days} days ago`;
// }

// function docProgress(docs: DocumentRow[]) {
//   if (!docs.length) return 0;
//   return Math.round((docs.filter((doc) => doc.status === "approved").length / docs.length) * 100);
// }

// function isPendingDoc(status: string) {
//   return status === "uploaded" || status === "pending";
// }

// function isPendingApp(status: string) {
//   return status === "pending_counselor" || status === "submitted";
// }

// function docBadge(status: string) {
//   if (status === "approved") return "approved";
//   if (status === "rejected") return "rejected";
//   if (isPendingDoc(status)) return "uploaded";
//   return "requested";
// }

// export default function StudentDetail() {
//   const { id = "" } = useParams();
//   const store = useAdminStore();
//   const [tab, setTab] = useState<Tab>("overview");
//   const [busyId, setBusyId] = useState<string | null>(null);
//   const [error, setError] = useState("");

//   const student = store.leads.find((lead) => lead.id === id || lead.user_id === id) || null;

//   const docs = useMemo(
//     () => (student ? store.documents.filter((doc) => !doc.archived && studentOwns(student, doc.user_id)) : []),
//     [student, store.documents],
//   );
//   const apps = useMemo(
//     () => (student ? store.applications.filter((app) => studentOwns(student, app.user_id)) : []),
//     [student, store.applications],
//   );
//   const shortlists = useMemo(
//     () => (student ? store.shortlists.filter((row) => studentOwns(student, row.student_id)) : []),
//     [student, store.shortlists],
//   );
//   const messages = useMemo(() => {
//     if (!student) return [];
//     const threadIds = new Set(
//       store.conversations.filter((row) => studentOwns(student, row.student_id)).map((row) => row.id),
//     );
//     return store.messages
//       .filter((msg) => threadIds.has(msg.conversation_id))
//       .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
//   }, [student, store.conversations, store.messages]);
//   const aiMessages = useMemo(() => {
//     if (!student) return [];
//     const sessionIds = new Set(
//       store.chatSessions.filter((row) => studentOwns(student, row.user_id)).map((row) => row.id),
//     );
//     return store.chatMessages
//       .filter((msg) => msg.session_id && sessionIds.has(msg.session_id))
//       .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
//   }, [student, store.chatSessions, store.chatMessages]);

//   if (!student) {
//     return (
//       <div>
//         <Link to="/admin/students" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
//           <ArrowLeft className="h-4 w-4" /> Back to students
//         </Link>
//         <Card className="p-8 text-center text-sm text-slate-500">No student found with this id.</Card>
//       </div>
//     );
//   }

//   const lastMessage = messages.length ? messages[messages.length - 1] : null;
//   const silence = daysSince(lastMessage?.created_at || student.conversion_date);
//   const progress = docProgress(docs);
//   const pendingDocs = docs.filter((doc) => isPendingDoc(doc.status));
//   const hasOffer = apps.some((app) => app.status === "offer");

//   const decideDoc = async (docId: string, status: "approved" | "rejected") => {
//     setBusyId(docId);
//     setError("");
//     try {
//       await api(`/documents/${docId}`, { method: "PATCH", body: { status, comments: "" } });
//       await refreshStore();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Could not update the document.");
//     } finally {
//       setBusyId(null);
//     }
//   };

//   const decideApp = async (appId: string, status: "counselor_approved" | "returned") => {
//     setBusyId(appId);
//     setError("");
//     try {
//       await api(`/applications/${appId}`, { method: "PATCH", body: { status, comments: "" } });
//       await refreshStore();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Could not update the application.");
//     } finally {
//       setBusyId(null);
//     }
//   };

//   const openFile = async (docId: string) => {
//     try {
//       const file = await api<{ fileName: string; dataUrl: string }>(`/documents/${docId}/file`);
//       const link = document.createElement("a");
//       link.href = file.dataUrl;
//       link.download = file.fileName || "document";
//       link.target = "_blank";
//       link.click();
//     } catch {
//       setError("Could not open this file.");
//     }
//   };

//   const stats: Array<{ label: string; value: string | number; alert?: boolean }> = [
//     { label: "Documents approved", value: `${docs.filter((d) => d.status === "approved").length}/${docs.length}` },
//     { label: "Awaiting review", value: pendingDocs.length, alert: pendingDocs.length > 0 },
//     { label: "Applications", value: apps.length },
//     {
//       label: "Days since contact",
//       value: silence === null ? "—" : silence,
//       alert: silence !== null && silence >= SILENT_DAYS,
//     },
//   ];

//   const tabs: Array<{ key: Tab; label: string; count: number | null; icon: typeof User }> = [
//     { key: "overview", label: "Overview", count: null, icon: User },
//     { key: "documents", label: "Documents", count: docs.length, icon: FileText },
//     { key: "applications", label: "Applications", count: apps.length, icon: BookOpen },
//     { key: "shortlists", label: "Shortlists", count: shortlists.length, icon: University },
//     { key: "chat", label: "Counselor chat", count: messages.length, icon: MessageCircle },
//     { key: "ai", label: "AI chat", count: aiMessages.length, icon: MessagesSquare },
//   ];

//   const journey: Array<[string, string, boolean]> = [
//     ["Lead created", `${whenLabel(student.created_at)} · source ${(student.lead_source || "manual").replace(/_/g, " ")}`, true],
//     [
//       "Telecaller engaged",
//       student.assigned_telecaller_id
//         ? `${telecallerLabel(store.telecallers, student.assigned_telecaller_id)} captured preferences`
//         : "No telecaller recorded",
//       Boolean(student.assigned_telecaller_id),
//     ],
//     ["Converted to student", whenLabel(student.conversion_date), true],
//     [
//       "Counselor assigned",
//       student.assigned_counselor_id
//         ? counselorLabel(store.counselors, student.assigned_counselor_id)
//         : "Waiting for admin to assign",
//       Boolean(student.assigned_counselor_id),
//     ],
//     [
//       "Documents submitted",
//       `${progress}% approved · ${docs.filter((d) => !isPendingDoc(d.status) && d.status !== "approved" && d.status !== "rejected").length} not uploaded`,
//       progress > 0,
//     ],
//     ["Applications sent", apps.length ? `${apps.length} submitted` : "None yet", apps.length > 0],
//     ["Outcome", hasOffer ? "Offer received" : "No decision yet", hasOffer],
//   ];

//   return (
//     <div>
//       <Link to="/admin/students" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
//         <ArrowLeft className="h-4 w-4" /> Back to students
//       </Link>

//       <Card className="p-5">
//         <div className="flex flex-wrap items-start gap-4">
//           <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-xl font-bold text-white">
//             {initials(student.first_name, student.last_name, student.email)}
//           </div>
//           <div className="min-w-[240px] flex-1">
//             <div className="flex flex-wrap items-center gap-3">
//               <h1 className="text-2xl font-bold">
//                 {displayName(student.first_name, student.last_name, student.email)}
//               </h1>
//               <Badge value="converted" />
//               {!student.assigned_counselor_id && (
//                 <Badge value="unassigned" className="normal-case">No counselor</Badge>
//               )}
//             </div>
//             <p className="mt-1 text-sm text-slate-600">
//               {student.email} · {student.phone || "No phone"}
//             </p>
//             <div className="mt-3 flex flex-wrap gap-2">
//               {(student.preferred_countries || []).length ? (
//                 student.preferred_countries.map((country) => (
//                   <span
//                     key={country}
//                     className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800"
//                   >
//                     {country}
//                   </span>
//                 ))
//               ) : (
//                 <Badge value="pending" className="normal-case">No country</Badge>
//               )}
//             </div>
//             <p className="mt-3 text-xs text-slate-400">
//               {student.field_of_interest || "No field"} · {student.academic_score || "No score"} · source{" "}
//               {(student.lead_source || "manual").replace(/_/g, " ")}
//             </p>
//           </div>
//           {!student.assigned_counselor_id && (
//             <Link to="/admin/unassigned">
//               <Button size="sm">Assign counselor</Button>
//             </Link>
//           )}
//         </div>
//       </Card>

//       {!student.assigned_counselor_id && (
//         <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
//           This student has no counselor. Nobody owns their documents, applications or messages.
//         </Card>
//       )}
//       {silence !== null && silence >= SILENT_DAYS && (
//         <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
//           No message exchanged for {silence} days.
//         </Card>
//       )}
//       {error && <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</Card>}

//       <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//         {stats.map((stat) => (
//           <Card key={stat.label} className="p-4">
//             <div className={`h-4 w-4 rounded-md ${stat.alert ? "bg-rose-100" : "bg-sky-100"}`} />
//             <p className={`mt-2 text-2xl font-bold ${stat.alert ? "text-rose-600" : ""}`}>{stat.value}</p>
//             <p className="text-sm text-slate-500">{stat.label}</p>
//           </Card>
//         ))}
//       </div>

//       <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
//         {tabs.map(({ key, label, count, icon: Icon }) => (
//           <button
//             key={key}
//             onClick={() => setTab(key)}
//             className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${
//               tab === key ? "border-sky-500 text-navy-900" : "border-transparent text-slate-500 hover:text-navy-900"
//             }`}
//           >
//             <Icon className="h-4 w-4" />
//             {label}
//             {count !== null && (
//               <span
//                 className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
//                   tab === key ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"
//                 }`}
//               >
//                 {count}
//               </span>
//             )}
//           </button>
//         ))}
//       </div>

//       <div className="mt-4">
//         {tab === "overview" && (
//           <div className="grid gap-4 lg:grid-cols-2">
//             <Card className="p-5">
//               <p className="mb-4 font-bold">Journey</p>
//               <ol className="relative ml-1.5 border-l border-slate-200">
//                 {journey.map(([title, subtitle, done]) => (
//                   <li key={title} className="relative pb-5 pl-6 last:pb-0">
//                     <span
//                       className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
//                         done ? "bg-emerald-500" : "bg-slate-300"
//                       }`}
//                     />
//                     <p className="text-sm font-semibold">{title}</p>
//                     <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
//                   </li>
//                 ))}
//               </ol>
//             </Card>

//             <Card className="p-5">
//               <p className="mb-4 font-bold">Record</p>
//               <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 text-sm">
//                 <dt className="text-slate-500">Email</dt>
//                 <dd className="font-medium">{student.email}</dd>
//                 <dt className="text-slate-500">Phone</dt>
//                 <dd className="font-medium">{student.phone || "—"}</dd>
//                 <dt className="text-slate-500">Countries</dt>
//                 <dd className="font-medium">{(student.preferred_countries || []).join(", ") || "—"}</dd>
//                 <dt className="text-slate-500">Field</dt>
//                 <dd className="font-medium">{student.field_of_interest || "—"}</dd>
//                 <dt className="text-slate-500">Score</dt>
//                 <dd className="font-medium">{student.academic_score || "—"}</dd>
//                 <dt className="text-slate-500">Telecaller</dt>
//                 <dd className="font-medium">{telecallerLabel(store.telecallers, student.assigned_telecaller_id)}</dd>
//                 <dt className="text-slate-500">Counselor</dt>
//                 <dd className="font-medium">{counselorLabel(store.counselors, student.assigned_counselor_id)}</dd>
//                 <dt className="text-slate-500">Converted</dt>
//                 <dd className="font-medium">{whenLabel(student.conversion_date)}</dd>
//               </dl>
//               <div className="mt-5">
//                 <div className="mb-1.5 flex justify-between text-sm">
//                   <span className="text-slate-500">Document completion</span>
//                   <span className="font-semibold">{progress}%</span>
//                 </div>
//                 <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200">
//                   <span
//                     className={`block h-full rounded-full ${
//                       progress < 40 ? "bg-rose-500" : progress < 80 ? "bg-gold-500" : "bg-emerald-500"
//                     }`}
//                     style={{ width: `${progress}%` }}
//                   />
//                 </span>
//               </div>
//               {student.notes && (
//                 <p className="mt-5 whitespace-pre-wrap text-xs text-slate-500">{student.notes}</p>
//               )}
//             </Card>
//           </div>
//         )}

//         {tab === "documents" &&
//           (docs.length === 0 ? (
//             <Card className="p-8 text-center text-sm text-slate-500">
//               No documents uploaded by this student yet.
//             </Card>
//           ) : (
//             <Card className="overflow-hidden">
//               {docs.map((doc) => (
//                 <div
//                   key={doc.id}
//                   className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
//                 >
//                   <div className="min-w-0">
//                     <p className="text-sm font-semibold">{doc.document_type || "Document"}</p>
//                     <p className="text-xs text-slate-500">
//                       {doc.file_name || "Not uploaded yet"}
//                       {doc.created_at ? ` · ${whenLabel(doc.created_at)}` : ""}
//                     </p>
//                     {doc.admin_comments && <p className="mt-0.5 text-xs text-rose-600">{doc.admin_comments}</p>}
//                   </div>
//                   <div className="flex flex-wrap items-center gap-2">
//                     <Badge value={docBadge(doc.status)} />
//                     <Button size="sm" variant="secondary" onClick={() => void openFile(doc.id)}>
//                       View
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="secondary"
//                       disabled={busyId === doc.id || doc.status === "approved"}
//                       onClick={() => void decideDoc(doc.id, "approved")}
//                     >
//                       Approve
//                     </Button>
//                     <Button
//                       size="sm"
//                       variant="secondary"
//                       disabled={busyId === doc.id || doc.status === "rejected"}
//                       onClick={() => void decideDoc(doc.id, "rejected")}
//                     >
//                       Reject
//                     </Button>
//                   </div>
//                 </div>
//               ))}
//             </Card>
//           ))}

//         {tab === "applications" &&
//           (apps.length === 0 ? (
//             <Card className="p-8 text-center text-sm text-slate-500">No applications submitted yet.</Card>
//           ) : (
//             <Card className="overflow-hidden">
//               {apps.map((app) => (
//                 <div
//                   key={app.id}
//                   className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
//                 >
//                   <div className="min-w-0">
//                     <p className="text-sm font-semibold">{app.university_name}</p>
//                     <p className="text-xs text-slate-500">
//                       {app.course_name} · {app.country}
//                       {app.intake_term ? ` · ${app.intake_term}` : ""}
//                     </p>
//                     {app.counselor_comments && (
//                       <p className="mt-0.5 text-xs text-slate-400">{app.counselor_comments}</p>
//                     )}
//                     {app.created_at && (
//                       <p className="mt-0.5 text-xs text-slate-400">
//                         Submitted {format(new Date(app.created_at), "PP")}
//                       </p>
//                     )}
//                   </div>
//                   <div className="flex flex-wrap items-center gap-2">
//                     <Badge value={isPendingApp(app.status) ? "needs review" : app.status} />
//                     {isPendingApp(app.status) && (
//                       <>
//                         <Button
//                           size="sm"
//                           variant="secondary"
//                           disabled={busyId === app.id}
//                           onClick={() => void decideApp(app.id, "counselor_approved")}
//                         >
//                           Approve
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="secondary"
//                           disabled={busyId === app.id}
//                           onClick={() => void decideApp(app.id, "returned")}
//                         >
//                           Return
//                         </Button>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </Card>
//           ))}

//         {tab === "shortlists" &&
//           (shortlists.length === 0 ? (
//             <Card className="p-8 text-center text-sm text-slate-500">
//               The counselor has not recommended any universities yet.
//             </Card>
//           ) : (
//             <Card className="overflow-hidden">
//               {shortlists.map((row) => (
//                 <div
//                   key={row.id}
//                   className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
//                 >
//                   <div className="min-w-0">
//                     <p className="text-sm font-semibold">{row.university_name}</p>
//                     <p className="text-xs text-slate-500">
//                       {row.course_name}
//                       {row.location ? ` · ${row.location}` : ""}
//                     </p>
//                     {row.counselor_notes && <p className="mt-0.5 text-xs text-slate-400">{row.counselor_notes}</p>}
//                   </div>
//                   <Badge value={row.status || "requested"} />
//                 </div>
//               ))}
//             </Card>
//           ))}

//         {tab === "chat" &&
//           (messages.length === 0 ? (
//             <Card className="p-8 text-center text-sm text-slate-500">
//               {student.assigned_counselor_id
//                 ? "No messages exchanged with the counselor yet."
//                 : "No counselor assigned, so there is no conversation."}
//             </Card>
//           ) : (
//             <Card className="flex max-h-[62vh] flex-col overflow-hidden">
//               <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4">
//                 <p className="text-sm font-semibold">
//                   {student.first_name} and {counselorLabel(store.counselors, student.assigned_counselor_id)}
//                 </p>
//                 <span className="text-xs text-slate-500">Last {whenLabel(lastMessage?.created_at)}</span>
//               </div>
//               <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
//                 {messages.map((msg) => {
//                   const fromStudent = studentOwns(student, msg.sender_id);
//                   return (
//                     <div
//                       key={msg.id}
//                       className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm ${
//                         fromStudent
//                           ? "self-start rounded-bl-sm border border-slate-200 bg-white"
//                           : "self-end rounded-br-sm bg-navy-900 text-white"
//                       }`}
//                     >
//                       <p>{msg.message}</p>
//                       {msg.created_at && (
//                         <p className={`mt-1 text-[11px] ${fromStudent ? "text-slate-400" : "text-white/60"}`}>
//                           {format(new Date(msg.created_at), "PP p")}
//                         </p>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//               <p className="border-t border-slate-200 bg-white p-3 text-xs text-slate-500">
//                 Admin view is read-only. The counselor replies from the counselor portal.
//               </p>
//             </Card>
//           ))}

//         {tab === "ai" &&
//           (aiMessages.length === 0 ? (
//             <Card className="p-8 text-center text-sm text-slate-500">
//               {student.first_name} did not come through the AI advisor. Source:{" "}
//               {(student.lead_source || "manual").replace(/_/g, " ")}.
//             </Card>
//           ) : (
//             <Card className="flex max-h-[62vh] flex-col overflow-hidden">
//               <div className="border-b border-slate-200 p-4">
//                 <p className="text-sm font-semibold">University Advisor session</p>
//                 <p className="text-xs text-slate-500">What this student originally asked for, before conversion.</p>
//               </div>
//               <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
//                 {aiMessages.map((msg) => {
//                   const fromUser = msg.role === "user";
//                   return (
//                     <div
//                       key={msg.id}
//                       className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm ${
//                         fromUser
//                           ? "self-start rounded-bl-sm border border-slate-200 bg-white"
//                           : "self-end rounded-br-sm bg-navy-900 text-white"
//                       }`}
//                     >
//                       <p>{msg.content}</p>
//                     </div>
//                   );
//                 })}
//               </div>
//             </Card>
//           ))}
//       </div>
//     </div>
//   );
// }

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, BookOpen, FileText, MessageCircle, MessagesSquare, University, User } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { counselorLabel, counselorOwns, displayName, initials, isConvertedStudent, studentOwns, telecallerLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import type { DocumentRow } from "@/lib/types";

const SILENT_DAYS = 7;
type Tab = "overview" | "documents" | "applications" | "shortlists" | "chat" | "ai";

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

function docProgress(docs: DocumentRow[]) {
  if (!docs.length) return 0;
  return Math.round((docs.filter((doc) => doc.status === "approved").length / docs.length) * 100);
}

function isPendingDoc(status: string) {
  return status === "uploaded" || status === "pending";
}

function isPendingApp(status: string) {
  return status === "pending_counselor" || status === "submitted";
}

function docBadge(status: string) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (isPendingDoc(status)) return "uploaded";
  return "requested";
}

export default function StudentDetail() {
  const { id = "" } = useParams();
  const store = useAdminStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickedCounselor, setPickedCounselor] = useState("");
  const [error, setError] = useState("");

  const student = store.leads.find((lead) => lead.id === id || lead.user_id === id) || null;

  const docs = useMemo(
    () => (student ? store.documents.filter((doc) => !doc.archived && studentOwns(student, doc.user_id)) : []),
    [student, store.documents],
  );
  const apps = useMemo(
    () => (student ? store.applications.filter((app) => studentOwns(student, app.user_id)) : []),
    [student, store.applications],
  );
  const shortlists = useMemo(
    () => (student ? store.shortlists.filter((row) => studentOwns(student, row.student_id)) : []),
    [student, store.shortlists],
  );
  const messages = useMemo(() => {
    if (!student) return [];
    const threadIds = new Set(
      store.conversations.filter((row) => studentOwns(student, row.student_id)).map((row) => row.id),
    );
    return store.messages
      .filter((msg) => threadIds.has(msg.conversation_id))
      .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  }, [student, store.conversations, store.messages]);
  const aiMessages = useMemo(() => {
    if (!student) return [];
    const sessionIds = new Set(
      store.chatSessions.filter((row) => studentOwns(student, row.user_id)).map((row) => row.id),
    );
    return store.chatMessages
      .filter((msg) => msg.session_id && sessionIds.has(msg.session_id))
      .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  }, [student, store.chatSessions, store.chatMessages]);

  if (!student) {
    return (
      <div>
        <Link to="/admin/students" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
          <ArrowLeft className="h-4 w-4" /> Back to students
        </Link>
        <Card className="p-8 text-center text-sm text-slate-500">No student found with this id.</Card>
      </div>
    );
  }

  const lastMessage = messages.length ? messages[messages.length - 1] : null;
  const convertedAt = student.conversion_date || student.created_at;
  const convertedIsExact = Boolean(student.conversion_date);
  const silence = daysSince(lastMessage?.created_at || convertedAt);
  const progress = docProgress(docs);
  const pendingDocs = docs.filter((doc) => isPendingDoc(doc.status));
  const hasOffer = apps.some((app) => app.status === "offer");

  const counselor = store.counselors.find((row) => counselorOwns(row, student.assigned_counselor_id)) || null;
  const counselorLoad = (counselorId: string) =>
    store.leads.filter((lead) => isConvertedStudent(lead) && lead.assigned_counselor_id === counselorId).length;

  const assignCounselor = async (counselorId: string) => {
    if (!counselorId) return;
    setBusyId("counselor");
    setError("");
    try {
      await api("/leads/bulk-assign", { method: "POST", body: { ids: [student.id], counselorId } });
      setPickedCounselor("");
      await refreshStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign the counselor.");
    } finally {
      setBusyId(null);
    }
  };

  const removeCounselor = async () => {
    setBusyId("counselor");
    setError("");
    try {
      await api(`/leads/${student.id}`, {
        method: "PATCH",
        body: { assigned_counselor_id: null, status: "unassigned" },
      });
      setPickedCounselor("");
      await refreshStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the counselor.");
    } finally {
      setBusyId(null);
    }
  };

  const decideDoc = async (docId: string, status: "approved" | "rejected") => {
    setBusyId(docId);
    setError("");
    try {
      await api(`/documents/${docId}`, { method: "PATCH", body: { status, comments: "" } });
      await refreshStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the document.");
    } finally {
      setBusyId(null);
    }
  };

  const decideApp = async (appId: string, status: "counselor_approved" | "returned") => {
    setBusyId(appId);
    setError("");
    try {
      await api(`/applications/${appId}`, { method: "PATCH", body: { status, comments: "" } });
      await refreshStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the application.");
    } finally {
      setBusyId(null);
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
    { label: "Documents approved", value: `${docs.filter((d) => d.status === "approved").length}/${docs.length}` },
    { label: "Awaiting review", value: pendingDocs.length, alert: pendingDocs.length > 0 },
    { label: "Applications", value: apps.length },
    {
      label: lastMessage ? "Days since last message" : "Days since converted",
      value: silence === null ? "—" : silence,
      alert: silence !== null && silence >= SILENT_DAYS,
    },
  ];

  const tabs: Array<{ key: Tab; label: string; count: number | null; icon: typeof User }> = [
    { key: "overview", label: "Overview", count: null, icon: User },
    { key: "documents", label: "Documents", count: docs.length, icon: FileText },
    { key: "applications", label: "Applications", count: apps.length, icon: BookOpen },
    { key: "shortlists", label: "Shortlists", count: shortlists.length, icon: University },
    { key: "chat", label: "Counselor chat", count: messages.length, icon: MessageCircle },
    { key: "ai", label: "AI chat", count: aiMessages.length, icon: MessagesSquare },
  ];

  const journey: Array<[string, string, boolean]> = [
    ["Lead created", `${whenLabel(student.created_at)} · source ${(student.lead_source || "manual").replace(/_/g, " ")}`, true],
    [
      "Telecaller engaged",
      student.assigned_telecaller_id
        ? `${telecallerLabel(store.telecallers, student.assigned_telecaller_id)} captured preferences`
        : "No telecaller recorded",
      Boolean(student.assigned_telecaller_id),
    ],
    ["Converted to student", convertedIsExact ? whenLabel(convertedAt) : `${whenLabel(convertedAt)} (no conversion date recorded)`, true],
    [
      "Counselor assigned",
      student.assigned_counselor_id
        ? counselorLabel(store.counselors, student.assigned_counselor_id)
        : "Waiting for admin to assign",
      Boolean(student.assigned_counselor_id),
    ],
    [
      "Documents submitted",
      `${progress}% approved · ${docs.filter((d) => !isPendingDoc(d.status) && d.status !== "approved" && d.status !== "rejected").length} not uploaded`,
      progress > 0,
    ],
    ["Applications sent", apps.length ? `${apps.length} submitted` : "None yet", apps.length > 0],
    ["Outcome", hasOffer ? "Offer received" : "No decision yet", hasOffer],
  ];

  return (
    <div>
      <Link to="/admin/students" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-xl font-bold text-white">
            {initials(student.first_name, student.last_name, student.email)}
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">
                {displayName(student.first_name, student.last_name, student.email)}
              </h1>
              <Badge value="converted" />
              {!student.assigned_counselor_id && (
                <Badge value="unassigned" className="normal-case">No counselor</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {student.email} · {student.phone || "No phone"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(student.preferred_countries || []).length ? (
                student.preferred_countries.map((country) => (
                  <span
                    key={country}
                    className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800"
                  >
                    {country}
                  </span>
                ))
              ) : (
                <Badge value="pending" className="normal-case">No country</Badge>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {student.field_of_interest || "No field"} · {student.academic_score || "No score"} · source{" "}
              {(student.lead_source || "manual").replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </Card>

      <Card className={`mt-4 p-5 ${counselor ? "" : "border-rose-200 bg-rose-50"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Counselor</p>
            {counselor ? (
              <Link
                to={`/admin/counselors/${counselor.id}`}
                className="mt-2 flex items-center gap-3 transition hover:opacity-80"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-xs font-bold text-white">
                  {initials(counselor.first_name, counselor.last_name, counselor.email)}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {displayName(counselor.first_name, counselor.last_name, counselor.email)}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {counselor.specializations?.length ? counselor.specializations.join(", ") : "No country set"} ·{" "}
                    {counselorLoad(counselor.id)} students
                  </span>
                </span>
              </Link>
            ) : (
              <p className="mt-2 text-sm text-rose-800">
                Not assigned. Nobody owns this student&apos;s documents, applications or messages.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[240px]">
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                {counselor ? "Change counselor" : "Choose counselor"}
              </p>
              <Select value={pickedCounselor} onChange={(e) => setPickedCounselor(e.target.value)}>
                <option value="">Choose counselor</option>
                {store.counselors
                  .filter((row) => !counselor || row.id !== counselor.id)
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      {displayName(row.first_name, row.last_name, row.email)}
                      {row.specializations?.length ? ` · ${row.specializations.join(", ")}` : ""}
                      {` · ${counselorLoad(row.id)} students`}
                    </option>
                  ))}
              </Select>
            </div>
            <Button
              size="sm"
              disabled={busyId === "counselor" || !pickedCounselor}
              onClick={() => void assignCounselor(pickedCounselor)}
            >
              {counselor ? "Reassign" : "Assign"}
            </Button>
            {counselor && (
              <Button
                size="sm"
                variant="secondary"
                disabled={busyId === "counselor"}
                onClick={() => void removeCounselor()}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </Card>
      {silence !== null && silence >= SILENT_DAYS && (
        <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          No message exchanged for {silence} days.
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
            {count !== null && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  tab === key ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <p className="mb-4 font-bold">Journey</p>
              <ol className="relative ml-1.5 border-l border-slate-200">
                {journey.map(([title, subtitle, done]) => (
                  <li key={title} className="relative pb-5 pl-6 last:pb-0">
                    <span
                      className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                        done ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                  </li>
                ))}
              </ol>
            </Card>

            <Card className="p-5">
              <p className="mb-4 font-bold">Record</p>
              <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium">{student.email}</dd>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium">{student.phone || "—"}</dd>
                <dt className="text-slate-500">Countries</dt>
                <dd className="font-medium">{(student.preferred_countries || []).join(", ") || "—"}</dd>
                <dt className="text-slate-500">Field</dt>
                <dd className="font-medium">{student.field_of_interest || "—"}</dd>
                <dt className="text-slate-500">Score</dt>
                <dd className="font-medium">{student.academic_score || "—"}</dd>
                <dt className="text-slate-500">Telecaller</dt>
                <dd className="font-medium">{telecallerLabel(store.telecallers, student.assigned_telecaller_id)}</dd>
                <dt className="text-slate-500">Counselor</dt>
                <dd className="font-medium">
                  {counselor ? (
                    <Link to={`/admin/counselors/${counselor.id}`} className="text-sky-700 hover:underline">
                      {displayName(counselor.first_name, counselor.last_name, counselor.email)}
                    </Link>
                  ) : (
                    "Not assigned"
                  )}
                </dd>
                <dt className="text-slate-500">Converted</dt>
                <dd className="font-medium">{whenLabel(convertedAt)}{convertedIsExact ? "" : " (estimated)"}</dd>
              </dl>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-slate-500">Document completion</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <span className="block h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className={`block h-full rounded-full ${
                      progress < 40 ? "bg-rose-500" : progress < 80 ? "bg-gold-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </div>
              {student.notes && (
                <p className="mt-5 whitespace-pre-wrap text-xs text-slate-500">{student.notes}</p>
              )}
            </Card>
          </div>
        )}

        {tab === "documents" &&
          (docs.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              No documents uploaded by this student yet.
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{doc.document_type || "Document"}</p>
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
                      disabled={busyId === doc.id || doc.status === "approved"}
                      onClick={() => void decideDoc(doc.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === doc.id || doc.status === "rejected"}
                      onClick={() => void decideDoc(doc.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          ))}

        {tab === "applications" &&
          (apps.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">No applications submitted yet.</Card>
          ) : (
            <Card className="overflow-hidden">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{app.university_name}</p>
                    <p className="text-xs text-slate-500">
                      {app.course_name} · {app.country}
                      {app.intake_term ? ` · ${app.intake_term}` : ""}
                    </p>
                    {app.counselor_comments && (
                      <p className="mt-0.5 text-xs text-slate-400">{app.counselor_comments}</p>
                    )}
                    {app.created_at && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Submitted {format(new Date(app.created_at), "PP")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge value={isPendingApp(app.status) ? "needs review" : app.status} />
                    {isPendingApp(app.status) && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === app.id}
                          onClick={() => void decideApp(app.id, "counselor_approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === app.id}
                          onClick={() => void decideApp(app.id, "returned")}
                        >
                          Return
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          ))}

        {tab === "shortlists" &&
          (shortlists.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              The counselor has not recommended any universities yet.
            </Card>
          ) : (
            <Card className="overflow-hidden">
              {shortlists.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{row.university_name}</p>
                    <p className="text-xs text-slate-500">
                      {row.course_name}
                      {row.location ? ` · ${row.location}` : ""}
                    </p>
                    {row.counselor_notes && <p className="mt-0.5 text-xs text-slate-400">{row.counselor_notes}</p>}
                  </div>
                  <Badge value={row.status || "requested"} />
                </div>
              ))}
            </Card>
          ))}

        {tab === "chat" &&
          (messages.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              {student.assigned_counselor_id
                ? "No messages exchanged with the counselor yet."
                : "No counselor assigned, so there is no conversation."}
            </Card>
          ) : (
            <Card className="flex max-h-[62vh] flex-col overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4">
                <p className="text-sm font-semibold">
                  {student.first_name} and {counselorLabel(store.counselors, student.assigned_counselor_id)}
                </p>
                <span className="text-xs text-slate-500">Last {whenLabel(lastMessage?.created_at)}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
                {messages.map((msg) => {
                  const fromStudent = studentOwns(student, msg.sender_id);
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
            </Card>
          ))}

        {tab === "ai" &&
          (aiMessages.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">
              {student.first_name} did not come through the AI advisor. Source:{" "}
              {(student.lead_source || "manual").replace(/_/g, " ")}.
            </Card>
          ) : (
            <Card className="flex max-h-[62vh] flex-col overflow-hidden">
              <div className="border-b border-slate-200 p-4">
                <p className="text-sm font-semibold">University Advisor session</p>
                <p className="text-xs text-slate-500">What this student originally asked for, before conversion.</p>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
                {aiMessages.map((msg) => {
                  const fromUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        fromUser
                          ? "self-start rounded-bl-sm border border-slate-200 bg-white"
                          : "self-end rounded-br-sm bg-navy-900 text-white"
                      }`}
                    >
                      <p>{msg.content}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}