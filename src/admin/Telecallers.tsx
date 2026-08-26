// import { PhoneCall } from "lucide-react";
// import { useAdminStore } from "@/lib/store";
// import { displayName } from "@/lib/utils";
// import { Badge } from "@/components/ui/Badge";
// import { Card } from "@/components/ui/Card";

// export default function Telecallers() {
//   const store = useAdminStore();
//   const telecallers = store.telecallers;

//   return (
//     <div>
//       <div className="mb-6 flex items-center gap-3">
//         <PhoneCall className="h-6 w-6 text-sky-500" />
//         <div>
//           <h1 className="text-2xl font-bold">Telecallers</h1>
//           <p className="text-slate-600">
//             First-contact team — capture lead details, qualify, and convert to students. Create accounts from Users with role Telecaller.
//           </p>
//         </div>
//       </div>
//       <div className="grid gap-3">
//         {telecallers.map((telecaller) => {
//           const assigned = store.leads.filter(
//             (lead) => lead.assigned_telecaller_id === telecaller.id && lead.entity_type !== "student" && lead.lead_status !== "converted",
//           );
//           const converted = store.leads.filter((lead) => lead.assigned_telecaller_id === telecaller.id && (lead.entity_type === "student" || lead.lead_status === "converted"));
//           return (
//             <Card key={telecaller.id} className="p-5">
//               <div className="flex flex-wrap items-start justify-between gap-3">
//                 <div>
//                   <p className="text-lg font-semibold">{displayName(telecaller.first_name, telecaller.last_name, telecaller.email)}</p>
//                   <p className="text-sm text-slate-500">{telecaller.email} · {telecaller.phone || "No phone"}</p>
//                   <p className="mt-2 text-sm">{assigned.length} open leads · {converted.length} converted</p>
//                 </div>
//                 <Badge value={telecaller.is_active ? "telecaller" : "cold"} />
//               </div>
//             </Card>
//           );
//         })}
//         {telecallers.length === 0 && (
//           <Card className="p-8 text-center text-sm text-slate-500">
//             No telecallers yet. Create one from Users with role Telecaller.
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }

import { ChevronRight, PhoneCall } from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminStore } from "@/lib/store";
import { displayName, initials, isConvertedStudent } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Lead } from "@/lib/types";

const STALE_DAYS = 2;

function daysSince(value?: string | null) {
  if (!value) return null;
  const ms = Date.now() - new Date(value).getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / 86400000);
}

/** A lead needs a call if its follow-up is due, or it has gone quiet. */
function needsCall(lead: Lead) {
  const today = new Date().toISOString().slice(0, 10);
  if (lead.next_follow_up_date) return lead.next_follow_up_date.slice(0, 10) <= today;
  if (!lead.last_contact_date) return (daysSince(lead.created_at) ?? 0) >= STALE_DAYS;
  return (daysSince(lead.last_contact_date) ?? 0) >= STALE_DAYS;
}

export default function Telecallers() {
  const store = useAdminStore();
  const month = new Date().toISOString().slice(0, 7);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <PhoneCall className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Telecallers</h1>
          <p className="text-slate-600">
            First-contact team. Open a telecaller to see their leads, conversions and call history.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        {store.telecallers.map((telecaller) => {
          const mine = store.leads.filter((lead) => lead.assigned_telecaller_id === telecaller.id);
          const open = mine.filter((lead) => !isConvertedStudent(lead));
          const converted = mine.filter((lead) => isConvertedStudent(lead));
          const overdue = open.filter(needsCall).length;
          const thisMonth = converted.filter(
            (lead) => (lead.conversion_date || "").slice(0, 7) === month,
          ).length;

          return (
            <Link
              key={telecaller.id}
              to={`/admin/telecallers/${telecaller.id}`}
              className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 transition last:border-b-0 hover:bg-slate-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white">
                {initials(telecaller.first_name, telecaller.last_name, telecaller.email)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {displayName(telecaller.first_name, telecaller.last_name, telecaller.email)}
                </span>
                <span className="block text-sm text-slate-500">
                  {telecaller.email} · {telecaller.phone || "No phone"}
                </span>
                <span className="mt-1 block text-xs text-slate-400">
                  {open.length} open lead{open.length === 1 ? "" : "s"} · {converted.length} converted
                  {thisMonth > 0 && ` · ${thisMonth} this month`}
                </span>
              </span>
              <span className="flex flex-wrap items-center justify-end gap-2">
                {overdue > 0 && (
                  <Badge value="rejected" className="normal-case">{overdue} need a call</Badge>
                )}
                <Badge value={telecaller.is_active === false ? "cold" : "telecaller"} />
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
              </span>
            </Link>
          );
        })}
        {store.telecallers.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">
            No telecallers yet. Create one from Users with role Telecaller.
          </p>
        )}
      </Card>
    </div>
  );
}