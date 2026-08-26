// // import { useMemo, useState } from "react";
// // import { format } from "date-fns";
// // import { GraduationCap, Mail, Phone } from "lucide-react";
// // import { useAdminStore } from "@/lib/store";
// // import { counselorLabel, displayName, isConvertedStudent, telecallerLabel } from "@/lib/utils";
// // import { Badge } from "@/components/ui/Badge";
// // import { Card } from "@/components/ui/Card";
// // import { Input } from "@/components/ui/Field";

// // export default function Students() {
// //   const store = useAdminStore();
// //   const [query, setQuery] = useState("");
// //   const students = useMemo(() => {
// //     const q = query.trim().toLowerCase();
// //     return store.leads
// //       .filter((lead) => isConvertedStudent(lead))
// //       .filter((lead) => `${lead.first_name} ${lead.last_name} ${lead.email}`.toLowerCase().includes(q));
// //   }, [store.leads, query]);

// //   return (
// //     <div>
// //       <div className="mb-6 flex items-center gap-3">
// //         <GraduationCap className="h-6 w-6 text-sky-500" />
// //         <div>
// //           <h1 className="text-2xl font-bold">Students</h1>
// //           <p className="text-slate-600">
// //             Converted leads — telecaller history, country counselor, documents, applications, and shortlists.
// //           </p>
// //         </div>
// //       </div>
// //       <Input className="max-w-sm" placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} />
// //       <div className="mt-4 grid gap-3">
// //         {students.map((student) => {
// //           const docs = store.documents.filter((item) => item.user_id === student.user_id && !item.archived);
// //           const apps = store.applications.filter((item) => item.user_id === student.user_id);
// //           const lists = store.shortlists.filter((item) => item.student_id === student.user_id || item.student_id === student.id);
// //           const chats = store.conversations.filter((item) => item.student_id === student.user_id || item.student_id === student.id);
// //           return (
// //             <Card key={student.id} className="p-5">
// //               <div className="flex flex-wrap items-start justify-between gap-3">
// //                 <div>
// //                   <p className="text-lg font-semibold">{displayName(student.first_name, student.last_name, student.email)}</p>
// //                   <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
// //                     <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</span>
// //                     {student.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.phone}</span>}
// //                   </div>
// //                   <p className="mt-2 text-sm">
// //                     {(student.preferred_countries || []).join(", ") || "No country"} · {student.field_of_interest || "No field"} · {student.academic_score || "No score"}
// //                   </p>
// //                   <p className="mt-2 text-sm text-slate-600">
// //                     Telecaller: {telecallerLabel(store.telecallers, student.assigned_telecaller_id)} · Counselor: {counselorLabel(store.counselors, student.assigned_counselor_id)}
// //                   </p>
// //                   <p className="mt-1 text-xs text-slate-500">
// //                     {docs.length} docs · {apps.length} applications · {lists.length} shortlists · {chats.length} chat threads
// //                     {student.conversion_date && <> · converted {format(new Date(student.conversion_date), "PP")}</>}
// //                   </p>
// //                   {student.notes && (
// //                     <p className="mt-2 line-clamp-2 text-xs text-slate-400">{student.notes}</p>
// //                   )}
// //                 </div>
// //                 <div className="flex flex-col items-end gap-2">
// //                   <Badge value="converted" />
// //                   {!student.assigned_counselor_id && <Badge value="unassigned" />}
// //                   <Badge value={student.lead_source || "student"} />
// //                 </div>
// //               </div>
// //             </Card>
// //           );
// //         })}
// //         {students.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No converted students yet.</Card>}
// //       </div>
// //     </div>
// //   );
// // }

// import { useMemo, useState } from "react";
// import { format } from "date-fns";
// import { GraduationCap, Mail, Phone } from "lucide-react";
// import { useAdminStore } from "@/lib/store";
// import { counselorLabel, displayName, isConvertedStudent, studentOwns, telecallerLabel } from "@/lib/utils";
// import { Badge } from "@/components/ui/Badge";
// import { Card } from "@/components/ui/Card";
// import { Input } from "@/components/ui/Field";

// export default function Students() {
//   const store = useAdminStore();
//   const [query, setQuery] = useState("");
//   const students = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return store.leads
//       .filter((lead) => isConvertedStudent(lead))
//       .filter((lead) => `${lead.first_name} ${lead.last_name} ${lead.email}`.toLowerCase().includes(q));
//   }, [store.leads, query]);

//   return (
//     <div>
//       <div className="mb-6 flex items-center gap-3">
//         <GraduationCap className="h-6 w-6 text-sky-500" />
//         <div>
//           <h1 className="text-2xl font-bold">Students</h1>
//           <p className="text-slate-600">
//             Converted leads — telecaller history, country counselor, documents, applications, and shortlists.
//           </p>
//         </div>
//       </div>
//       <Input className="max-w-sm" placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} />
//       <div className="mt-4 grid gap-3">
//         {students.map((student) => {
//           const docs = store.documents.filter((item) => studentOwns(student, item.user_id) && !item.archived);
//           const apps = store.applications.filter((item) => studentOwns(student, item.user_id));
//           const lists = store.shortlists.filter((item) => studentOwns(student, item.student_id));
//           const chats = store.conversations.filter((item) => studentOwns(student, item.student_id));
//           return (
//             <Card key={student.id} className="p-5">
//               <div className="flex flex-wrap items-start justify-between gap-3">
//                 <div>
//                   <p className="text-lg font-semibold">{displayName(student.first_name, student.last_name, student.email)}</p>
//                   <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
//                     <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</span>
//                     {student.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.phone}</span>}
//                   </div>
//                   <p className="mt-2 text-sm">
//                     {(student.preferred_countries || []).join(", ") || "No country"} · {student.field_of_interest || "No field"} · {student.academic_score || "No score"}
//                   </p>
//                   <p className="mt-2 text-sm text-slate-600">
//                     Telecaller: {telecallerLabel(store.telecallers, student.assigned_telecaller_id)} · Counselor: {counselorLabel(store.counselors, student.assigned_counselor_id)}
//                   </p>
//                   <p className="mt-1 text-xs text-slate-500">
//                     {docs.length} docs · {apps.length} applications · {lists.length} shortlists · {chats.length} chat threads
//                     {student.conversion_date && <> · converted {format(new Date(student.conversion_date), "PP")}</>}
//                   </p>
//                   {student.notes && (
//                     <p className="mt-2 line-clamp-2 text-xs text-slate-400">{student.notes}</p>
//                   )}
//                 </div>
//                 <div className="flex flex-col items-end gap-2">
//                   <Badge value="converted" />
//                   {!student.assigned_counselor_id && <Badge value="unassigned" />}
//                   <Badge value={student.lead_source || "student"} />
//                 </div>
//               </div>
//             </Card>
//           );
//         })}
//         {students.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No converted students yet.</Card>}
//       </div>
//     </div>
//   );
// }

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, GraduationCap } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { counselorLabel, displayName, initials, isConvertedStudent, studentOwns } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import type { Lead } from "@/lib/types";

const SILENT_DAYS = 7;

function daysSince(value?: string | null) {
  if (!value) return null;
  const ms = Date.now() - new Date(value).getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / 86400000);
}

export default function Students() {
  const store = useAdminStore();
  const [query, setQuery] = useState("");

  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.leads
      .filter((lead) => isConvertedStudent(lead))
      .filter((lead) =>
        `${lead.first_name} ${lead.last_name} ${lead.email} ${lead.field_of_interest}`.toLowerCase().includes(q),
      );
  }, [store.leads, query]);

  const summarise = (student: Lead) => {
    const docs = store.documents.filter((doc) => !doc.archived && studentOwns(student, doc.user_id));
    const apps = store.applications.filter((app) => studentOwns(student, app.user_id));
    const lists = store.shortlists.filter((row) => studentOwns(student, row.student_id));
    const threadIds = new Set(
      store.conversations.filter((row) => studentOwns(student, row.student_id)).map((row) => row.id),
    );
    const msgs = store.messages
      .filter((msg) => threadIds.has(msg.conversation_id))
      .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
    return {
      progress: docs.length
        ? Math.round((docs.filter((doc) => doc.status === "approved").length / docs.length) * 100)
        : 0,
      pendingDocs: docs.filter((doc) => doc.status === "uploaded" || doc.status === "pending").length,
      apps: apps.length,
      pendingApps: apps.filter((app) => app.status === "pending_counselor" || app.status === "submitted").length,
      lists: lists.length,
      silence: daysSince(msgs.length ? msgs[msgs.length - 1].created_at : student.conversion_date),
    };
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-slate-600">
            Converted leads. Open a student to see documents, applications, shortlists and both chats in one place.
          </p>
        </div>
      </div>

      <Input
        className="mb-4 max-w-sm"
        placeholder="Search students..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Card className="overflow-hidden">
        {students.map((student) => {
          const s = summarise(student);
          return (
            <Link
              key={student.id}
              to={`/admin/students/${student.id}`}
              className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 transition last:border-b-0 hover:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white">
                {initials(student.first_name, student.last_name, student.email)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {displayName(student.first_name, student.last_name, student.email)}
                </span>
                <span className="block text-sm text-slate-500">
                  {(student.preferred_countries || []).join(", ") || "No country"} ·{" "}
                  {student.field_of_interest || "No field"}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {student.assigned_counselor_id
                    ? `${counselorLabel(store.counselors, student.assigned_counselor_id)} · `
                    : ""}
                  {s.progress}% documents · {s.apps} application{s.apps === 1 ? "" : "s"} · {s.lists} shortlisted
                </span>
              </span>
              <span className="flex flex-wrap items-center justify-end gap-2">
                {!student.assigned_counselor_id && (
                  <Badge value="unassigned" className="normal-case">No counselor</Badge>
                )}
                {s.pendingDocs > 0 && (
                  <Badge value="uploaded" className="normal-case">
                    {s.pendingDocs} doc{s.pendingDocs === 1 ? "" : "s"}
                  </Badge>
                )}
                {s.pendingApps > 0 && (
                  <Badge value="pending" className="normal-case">
                    {s.pendingApps} app{s.pendingApps === 1 ? "" : "s"}
                  </Badge>
                )}
                {s.silence !== null && s.silence >= SILENT_DAYS && (
                  <Badge value="rejected" className="normal-case">Silent {s.silence}d</Badge>
                )}
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
              </span>
            </Link>
          );
        })}
        {students.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">
            {query ? "No students match that search." : "No converted students yet."}
          </p>
        )}
      </Card>
    </div>
  );
}