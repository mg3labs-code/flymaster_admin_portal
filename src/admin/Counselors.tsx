// import { Shield } from "lucide-react";
// import { useAdminStore } from "@/lib/store";
// import { displayName } from "@/lib/utils";
// import { Badge } from "@/components/ui/Badge";
// import { Card } from "@/components/ui/Card";

// export default function Counselors() {
//   const store = useAdminStore();
//   const counselors = store.counselors;

//   return (
//     <div>
//       <div className="mb-6 flex items-center gap-3">
//         <Shield className="h-6 w-6 text-sky-500" />
//         <div>
//           <h1 className="text-2xl font-bold">Counselors</h1>
//           <p className="text-slate-600">Country specialists assigned after student conversion. Set specializations to countries (UK, Canada, etc.).</p>
//         </div>
//       </div>
//       <div className="grid gap-3">
//         {counselors.map((counselor) => {
//           const assigned = store.leads.filter((lead) => lead.assigned_counselor_id === counselor.id || lead.assigned_counselor_id === counselor.auth_user_id);
//           const students = assigned.filter((lead) => lead.entity_type === "student" || lead.lead_status === "converted");
//           return (
//             <Card key={counselor.id} className="p-5">
//               <div className="flex flex-wrap items-start justify-between gap-3">
//                 <div>
//                   <p className="text-lg font-semibold">{displayName(counselor.first_name, counselor.last_name, counselor.email)}</p>
//                   <p className="text-sm text-slate-500">{counselor.email} · {counselor.phone || "No phone"}</p>
//                   <p className="mt-2 text-sm">{assigned.length} assigned · {students.length} students</p>
//                   {counselor.specializations?.length > 0 && (
//                     <p className="mt-1 text-xs text-slate-500">{counselor.specializations.join(" · ")}</p>
//                   )}
//                   {counselor.bio && <p className="mt-2 text-sm text-slate-600">{counselor.bio}</p>}
//                 </div>
//                 <Badge value={counselor.is_active ? "assigned" : "cold"} />
//               </div>
//             </Card>
//           );
//         })}
//         {counselors.length === 0 && (
//           <Card className="p-8 text-center text-sm text-slate-500">
//             No counselors yet. Create one from Users with role Counselor, or sign up on the counselor portal — both appear here.
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }
import { ChevronRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminStore } from "@/lib/store";
import { counselorOwns, displayName, initials, isConvertedStudent, studentOwns } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function Counselors() {
  const store = useAdminStore();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Counselors</h1>
          <p className="text-slate-600">
            Country specialists assigned after student conversion. Open a counselor to see their students,
            conversations and documents.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        {store.counselors.map((counselor) => {
          const students = store.leads.filter((lead) => isConvertedStudent(lead) && counselorOwns(counselor, lead.assigned_counselor_id));
          const pending = store.documents.filter(
            (doc) =>
              !doc.archived &&
              (doc.status === "uploaded" || doc.status === "pending") &&
              students.some((student) => studentOwns(student, doc.user_id)),
          ).length;
          const countries = counselor.specializations || [];

          return (
            <Link
              key={counselor.id}
              to={`/admin/counselors/${counselor.id}`}
              className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 transition last:border-b-0 hover:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white">
                {initials(counselor.first_name, counselor.last_name, counselor.email)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {displayName(counselor.first_name, counselor.last_name, counselor.email)}
                </span>
                <span className="block text-sm text-slate-500">
                  {counselor.email} · {counselor.phone || "No phone"}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {students.length} student{students.length === 1 ? "" : "s"}
                  {pending > 0 && ` · ${pending} document${pending === 1 ? "" : "s"} to review`}
                  {countries.length ? ` · ${countries.join(", ")}` : " · No country set"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                {pending > 0 && (
                  <span className="flex items-center gap-1">
                    <Badge value="uploaded" className="normal-case" />
                    <span className="text-xs text-slate-600">{pending} to review</span>
                  </span>
                )}
                <Badge value={countries.length ? "assigned" : "pending"} className="normal-case" />
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
              </span>
            </Link>
          );
        })}
        {store.counselors.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">
            No counselors yet. Create one from Users with role Counselor, or sign up on the counselor portal — both
            appear here.
          </p>
        )}
      </Card>
    </div>
  );
}