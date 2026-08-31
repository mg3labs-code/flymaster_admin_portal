// // import { Link } from "react-router-dom";
// // import { BookOpen, FileText, Flame, GraduationCap, Phone, PhoneCall, Target, Users, Wallet } from "lucide-react";
// // import { format } from "date-fns";
// // import { useAdminStore } from "@/lib/store";
// // import { counselorLabel, displayName, isConvertedStudent, telecallerLabel } from "@/lib/utils";
// // import { Badge } from "@/components/ui/Badge";
// // import { Card } from "@/components/ui/Card";

// // export default function Dashboard() {
// //   const store = useAdminStore();
// //   const leads = store.leads.filter((lead) => !isConvertedStudent(lead));
// //   const students = store.leads.filter((lead) => isConvertedStudent(lead));
// //   const unassignedCounselor = students.filter((lead) => !lead.assigned_counselor_id);
// //   const unassignedTelecaller = leads.filter((lead) => !lead.assigned_telecaller_id);
// //   const hot = leads.filter((lead) => lead.lead_status === "hot");
// //   const pendingDocs = store.documents.filter((item) => !item.archived && (item.status === "uploaded" || item.status === "pending"));
// //   const pendingApps = store.applications.filter((item) => item.status === "pending_counselor" || item.status === "submitted");
// //   const pendingLeave = store.leave.filter((item) => item.status === "pending");
// //   const rate = store.leads.length ? Math.round((students.length / store.leads.length) * 100) : 0;
// //   const today = format(new Date(), "yyyy-MM-dd");
// //   const clockedIn = store.attendance.filter((row) => row.date === today && row.clock_in && !row.clock_out);

// //   const stats = [
// //     { label: "Telecaller leads", value: leads.length, icon: PhoneCall, to: "/admin/leads" },
// //     { label: "Students", value: students.length, icon: GraduationCap, to: "/admin/students" },
// //     { label: "Need counselor", value: unassignedCounselor.length, icon: Target, to: "/admin/unassigned" },
// //     { label: "Hot leads", value: hot.length, icon: Flame, to: "/admin/leads" },
// //     { label: "No telecaller", value: unassignedTelecaller.length, icon: Phone, to: "/admin/leads" },
// //     { label: "Docs to review", value: pendingDocs.length, icon: FileText, to: "/admin/documents" },
// //     { label: "Applications", value: pendingApps.length, icon: BookOpen, to: "/admin/applications" },
// //     { label: "Conversion", value: `${rate}%`, icon: Users, to: "/admin/students" },
// //   ];

// //   const recent = [...store.leads]
// //     .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
// //     .slice(0, 8);

// //   return (
// //     <div>
// //       <div>
// //         <h1 className="text-2xl font-bold">Operations overview</h1>
// //         <p className="text-slate-600">Telecaller → convert → country counselor → documents & applications.</p>
// //       </div>

// //       <Card className="mt-4 border-sky-100 bg-sky-50/50 p-4 text-sm text-slate-700">
// //         <strong>Flymaster flow:</strong> User connects to telecaller → details captured → convert to student → admin assigns country counselor → checklist, applications, shortlist.
// //       </Card>

// //       <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
// //         {stats.map((item) => (
// //           <Link key={item.label} to={item.to}>
// //             <Card className="p-4 transition hover:-translate-y-0.5">
// //               <item.icon className="h-5 w-5 text-sky-500" />
// //               <p className="mt-3 text-2xl font-bold">{item.value}</p>
// //               <p className="text-sm text-slate-500">{item.label}</p>
// //             </Card>
// //           </Link>
// //         ))}
// //       </div>

// //       <div className="mt-6 grid gap-4 lg:grid-cols-2">
// //         <Card className="p-5">
// //           <div className="mb-3 flex items-center justify-between">
// //             <h2 className="font-semibold">Latest leads & students</h2>
// //             <Link to="/admin/leads" className="text-sm text-sky-600">Open telecaller CRM</Link>
// //           </div>
// //           {recent.length === 0 && <p className="text-sm text-slate-500">No leads yet. They appear here from AI chat, signups, and telecallers.</p>}
// //           {recent.map((lead) => (
// //             <div key={lead.id} className="flex items-center justify-between gap-3 border-t py-3 first:border-0">
// //               <div>
// //                 <p className="font-medium">{displayName(lead.first_name, lead.last_name, lead.email)}</p>
// //                 <p className="text-xs text-slate-500">
// //                   {lead.preferred_countries.join(", ") || "No country"} ·{" "}
// //                   {isConvertedStudent(lead)
// //                     ? counselorLabel(store.counselors, lead.assigned_counselor_id)
// //                     : telecallerLabel(store.telecallers, lead.assigned_telecaller_id)}
// //                 </p>
// //               </div>
// //               <Badge value={isConvertedStudent(lead) ? "converted" : (lead.lead_status || "warm")} />
// //             </div>
// //           ))}
// //         </Card>

// //         <Card className="p-5">
// //           <h2 className="font-semibold">Counselors on shift today</h2>
// //           <p className="mt-1 text-sm text-slate-500">{clockedIn.length} clocked in · {unassignedCounselor.length} students need assignment</p>
// //           <div className="mt-4 space-y-3">
// //             {store.counselors.slice(0, 8).map((counselor) => {
// //               const assigned = store.leads.filter(
// //                 (lead) => isConvertedStudent(lead) && (lead.assigned_counselor_id === counselor.id || lead.assigned_counselor_id === counselor.auth_user_id),
// //               );
// //               const onShift = clockedIn.some((row) => row.counselor_id === counselor.id);
// //               return (
// //                 <div key={counselor.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
// //                   <div>
// //                     <p className="text-sm font-medium">{displayName(counselor.first_name, counselor.last_name, counselor.email)}</p>
// //                     <p className="text-xs text-slate-500">
// //                       {assigned.length} students · {(counselor.specializations || []).join(", ") || "General"}
// //                     </p>
// //                   </div>
// //                   <Badge value={onShift ? "assigned" : "cold"} />
// //                 </div>
// //               );
// //             })}
// //             {store.counselors.length === 0 && <p className="text-sm text-slate-500">No counselors yet.</p>}
// //           </div>
// //         </Card>
// //       </div>
// //     </div>
// //   );
// // }

// import { Link } from "react-router-dom";
// import { BookOpen, FileText, Flame, GraduationCap, Phone, PhoneCall, Target, Users } from "lucide-react";
// import { format } from "date-fns";
// import { useAdminStore } from "@/lib/store";
// import { counselorLabel, counselorOwns, displayName, isConvertedStudent, telecallerLabel } from "@/lib/utils";
// import { Badge } from "@/components/ui/Badge";
// import { Card } from "@/components/ui/Card";

// export default function Dashboard() {
//   const store = useAdminStore();
//   const leads = store.leads.filter((lead) => !isConvertedStudent(lead));
//   const students = store.leads.filter((lead) => isConvertedStudent(lead));
//   const unassignedCounselor = students.filter((lead) => !lead.assigned_counselor_id);
//   const unassignedTelecaller = leads.filter((lead) => !lead.assigned_telecaller_id);
//   const hot = leads.filter((lead) => lead.lead_status === "hot");
//   const pendingDocs = store.documents.filter((item) => !item.archived && (item.status === "uploaded" || item.status === "pending"));
//   const pendingApps = store.applications.filter((item) => item.status === "pending_counselor" || item.status === "submitted");
//   const rate = store.leads.length ? Math.round((students.length / store.leads.length) * 100) : 0;
//   const today = format(new Date(), "yyyy-MM-dd");
//   const clockedIn = store.attendance.filter((row) => row.date === today && row.clock_in && !row.clock_out);

//   const stats = [
//     { label: "Telecaller leads", value: leads.length, icon: PhoneCall, to: "/admin/leads" },
//     { label: "Students", value: students.length, icon: GraduationCap, to: "/admin/students" },
//     { label: "Need counselor", value: unassignedCounselor.length, icon: Target, to: "/admin/unassigned" },
//     { label: "Hot leads", value: hot.length, icon: Flame, to: "/admin/leads" },
//     { label: "No telecaller", value: unassignedTelecaller.length, icon: Phone, to: "/admin/leads" },
//     { label: "Docs to review", value: pendingDocs.length, icon: FileText, to: "/admin/documents" },
//     { label: "Applications", value: pendingApps.length, icon: BookOpen, to: "/admin/applications" },
//     { label: "Conversion", value: `${rate}%`, icon: Users, to: "/admin/students" },
//   ];

//   const recent = [...store.leads]
//     .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
//     .slice(0, 8);

//   return (
//     <div>
//       <div>
//         <h1 className="text-2xl font-bold">Operations overview</h1>
//         <p className="text-slate-600">Telecaller → convert → country counselor → documents & applications.</p>
//       </div>

//       <Card className="mt-4 border-sky-100 bg-sky-50/50 p-4 text-sm text-slate-700">
//         <strong>Flymaster flow:</strong> User connects to telecaller → details captured → convert to student → admin assigns country counselor → checklist, applications, shortlist.
//       </Card>

//       <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
//         {stats.map((item) => (
//           <Link key={item.label} to={item.to}>
//             <Card className="p-4 transition hover:-translate-y-0.5">
//               <item.icon className="h-5 w-5 text-sky-500" />
//               <p className="mt-3 text-2xl font-bold">{item.value}</p>
//               <p className="text-sm text-slate-500">{item.label}</p>
//             </Card>
//           </Link>
//         ))}
//       </div>

//       <div className="mt-6 grid gap-4 lg:grid-cols-2">
//         <Card className="p-5">
//           <div className="mb-3 flex items-center justify-between">
//             <h2 className="font-semibold">Latest leads & students</h2>
//             <Link to="/admin/leads" className="text-sm text-sky-600">Open telecaller CRM</Link>
//           </div>
//           {recent.length === 0 && <p className="text-sm text-slate-500">No leads yet. They appear here from AI chat, signups, and telecallers.</p>}
//           {recent.map((lead) => (
//             <div key={lead.id} className="flex items-center justify-between gap-3 border-t py-3 first:border-0">
//               <div>
//                 <p className="font-medium">{displayName(lead.first_name, lead.last_name, lead.email)}</p>
//                 <p className="text-xs text-slate-500">
//                   {lead.preferred_countries.join(", ") || "No country"} ·{" "}
//                   {isConvertedStudent(lead)
//                     ? counselorLabel(store.counselors, lead.assigned_counselor_id)
//                     : telecallerLabel(store.telecallers, lead.assigned_telecaller_id)}
//                 </p>
//               </div>
//               <Badge value={isConvertedStudent(lead) ? "converted" : (lead.lead_status || "warm")} />
//             </div>
//           ))}
//         </Card>

//         <Card className="p-5">
//           <h2 className="font-semibold">Counselors on shift today</h2>
//           <p className="mt-1 text-sm text-slate-500">{clockedIn.length} clocked in · {unassignedCounselor.length} students need assignment</p>
//           <div className="mt-4 space-y-3">
//             {store.counselors.slice(0, 8).map((counselor) => {
//               const assigned = store.leads.filter(
//                 (lead) => isConvertedStudent(lead) && counselorOwns(counselor, lead.assigned_counselor_id),
//               );
//               const onShift = clockedIn.some((row) => row.counselor_id === counselor.id);
//               return (
//                 <div key={counselor.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
//                   <div>
//                     <p className="text-sm font-medium">{displayName(counselor.first_name, counselor.last_name, counselor.email)}</p>
//                     <p className="text-xs text-slate-500">
//                       {assigned.length} students · {(counselor.specializations || []).join(", ") || "General"}
//                     </p>
//                   </div>
//                   <Badge value={onShift ? "assigned" : "cold"} />
//                 </div>
//               );
//             })}
//             {store.counselors.length === 0 && <p className="text-sm text-slate-500">No counselors yet.</p>}
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// }

import { Link } from "react-router-dom";
import { BookOpen, FileText, Flame, GraduationCap, PhoneCall, Target, Users } from "lucide-react";
import { format } from "date-fns";
import { useAdminStore } from "@/lib/store";
import { counselorLabel, counselorOwns, displayName, isConvertedStudent, telecallerLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function Dashboard() {
  const store = useAdminStore();
  // Admin sees the whole pipeline. Leads are read-only here — only a telecaller can
  // convert one, and only an admin can attach a counselor after that.
  const leads = store.leads.filter((lead) => !isConvertedStudent(lead));
  const hot = leads.filter((lead) => lead.lead_status === "hot");
  const students = store.leads.filter((lead) => isConvertedStudent(lead));
  const unassignedCounselor = students.filter((lead) => !lead.assigned_counselor_id);
  const stranded = store.leads.filter(
    (lead) => !isConvertedStudent(lead) && !lead.assigned_telecaller_id,
  );
  const pendingDocs = store.documents.filter((item) => !item.archived && (item.status === "uploaded" || item.status === "pending"));
  const pendingApps = store.applications.filter((item) => item.status === "pending_counselor" || item.status === "submitted");
  const withCounselor = students.filter((lead) => lead.assigned_counselor_id).length;
  const monthKey = new Date().toISOString().slice(0, 7);
  const convertedThisMonth = students.filter(
    (lead) => String(lead.conversion_date || "").slice(0, 7) === monthKey,
  ).length;
  const today = format(new Date(), "yyyy-MM-dd");
  const clockedIn = store.attendance.filter((row) => row.date === today && row.clock_in && !row.clock_out);

  const stats = [
    { label: "Telecaller leads", value: leads.length, icon: PhoneCall, to: "/admin/leads" },
    { label: "Hot leads", value: hot.length, icon: Flame, to: "/admin/leads" },
    { label: "Students", value: students.length, icon: GraduationCap, to: "/admin/students" },
    { label: "Need counselor", value: unassignedCounselor.length, icon: Target, to: "/admin/unassigned" },
    { label: "With a counselor", value: withCounselor, icon: Users, to: "/admin/students" },
    { label: "Converted this month", value: convertedThisMonth, icon: GraduationCap, to: "/admin/students" },
    { label: "Docs to review", value: pendingDocs.length, icon: FileText, to: "/admin/documents" },
    { label: "Applications", value: pendingApps.length, icon: BookOpen, to: "/admin/applications" },
  ];

  const recent = [...store.leads]
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 8);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Operations overview</h1>
        <p className="text-slate-600">Telecaller → convert → country counselor → documents & applications.</p>
      </div>

      <Card className="mt-4 border-sky-100 bg-sky-50/50 p-4 text-sm text-slate-700">
        <strong>Flymaster flow:</strong> signup creates a hot lead → telecaller calls, qualifies and converts → you assign a country counselor → documents, applications, shortlists. Leads are read-only here; only the telecaller converts.
      </Card>

      {stranded.length > 0 && (
        <Card className="mt-4 border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <strong>{stranded.length} lead{stranded.length === 1 ? "" : "s"} could not be given to a telecaller.</strong>{" "}
          Leads are normally handled entirely in the telecaller portal. These reached nobody, so they need you.{" "}
          <Link to="/admin/alerts" className="font-semibold underline">Open Lead alerts</Link>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Link key={item.label} to={item.to}>
            <Card className="p-4 transition hover:-translate-y-0.5">
              <item.icon className="h-5 w-5 text-sky-500" />
              <p className="mt-3 text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-slate-500">{item.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Latest leads &amp; students</h2>
            <Link to="/admin/leads" className="text-sm text-sky-600">Open lead list</Link>
          </div>
          {recent.length === 0 && <p className="text-sm text-slate-500">Nothing yet. Leads appear here from signups and AI chat.</p>}
          {recent.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between gap-3 border-t py-3 first:border-0">
              <div>
                <p className="font-medium">{displayName(lead.first_name, lead.last_name, lead.email)}</p>
                <p className="text-xs text-slate-500">
                  {lead.preferred_countries.join(", ") || "No country"} ·{" "}
                  {isConvertedStudent(lead)
                    ? counselorLabel(store.counselors, lead.assigned_counselor_id)
                    : telecallerLabel(store.telecallers, lead.assigned_telecaller_id)}
                </p>
              </div>
              <Badge value={isConvertedStudent(lead) ? "converted" : (lead.lead_status || "warm")} />
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Counselors on shift today</h2>
          <p className="mt-1 text-sm text-slate-500">{clockedIn.length} clocked in · {unassignedCounselor.length} students need assignment</p>
          <div className="mt-4 space-y-3">
            {store.counselors.slice(0, 8).map((counselor) => {
              const assigned = store.leads.filter(
                (lead) => isConvertedStudent(lead) && counselorOwns(counselor, lead.assigned_counselor_id),
              );
              const onShift = clockedIn.some((row) => row.counselor_id === counselor.id);
              return (
                <div key={counselor.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{displayName(counselor.first_name, counselor.last_name, counselor.email)}</p>
                    <p className="text-xs text-slate-500">
                      {assigned.length} students · {(counselor.specializations || []).join(", ") || "General"}
                    </p>
                  </div>
                  <Badge value={onShift ? "assigned" : "cold"} />
                </div>
              );
            })}
            {store.counselors.length === 0 && <p className="text-sm text-slate-500">No counselors yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}