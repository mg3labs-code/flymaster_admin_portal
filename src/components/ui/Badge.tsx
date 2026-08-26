// import { cn } from "@/lib/utils";

// const styles: Record<string, string> = {
//   cold: "bg-sky-100 text-sky-800",
//   warm: "bg-amber-100 text-amber-800",
//   hot: "bg-orange-100 text-orange-800",
//   converted: "bg-emerald-100 text-emerald-800",
//   enrolled: "bg-emerald-100 text-emerald-800",
//   pending: "bg-amber-100 text-amber-800",
//   approved: "bg-emerald-100 text-emerald-800",
//   rejected: "bg-rose-100 text-rose-800",
//   requested: "bg-slate-100 text-slate-700",
//   uploaded: "bg-sky-100 text-sky-800",
//   "needs review": "bg-sky-100 text-sky-800",
//   returned: "bg-orange-100 text-orange-800",
//   student: "bg-slate-100 text-slate-700",
//   telecaller: "bg-violet-100 text-violet-800",
//   counselor: "bg-indigo-100 text-indigo-800",
//   admin: "bg-navy-900 text-white",
//   super_admin: "bg-navy-900 text-white",
//   ai_chat: "bg-cyan-100 text-cyan-800",
//   manual: "bg-slate-100 text-slate-700",
//   student_site: "bg-sky-100 text-sky-800",
//   unassigned: "bg-rose-100 text-rose-800",
//   assigned: "bg-indigo-100 text-indigo-800",
// };

// export function Badge({
//   value,
//   className,
// }: {
//   value: string;
//   className?: string;
// }) {
//   return (
//     <span
//       className={cn(
//         "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
//         styles[value] || "bg-slate-100 text-slate-700",
//         className,
//       )}
//     >
//       {value.replace(/_/g, " ")}
//     </span>
//   );
// }

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const styles: Record<string, string> = {
  cold: "bg-sky-100 text-sky-800",
  warm: "bg-amber-100 text-amber-800",
  hot: "bg-orange-100 text-orange-800",
  converted: "bg-emerald-100 text-emerald-800",
  enrolled: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  requested: "bg-slate-100 text-slate-700",
  uploaded: "bg-sky-100 text-sky-800",
  "needs review": "bg-sky-100 text-sky-800",
  returned: "bg-orange-100 text-orange-800",
  student: "bg-slate-100 text-slate-700",
  telecaller: "bg-violet-100 text-violet-800",
  counselor: "bg-indigo-100 text-indigo-800",
  admin: "bg-navy-900 text-white",
  super_admin: "bg-navy-900 text-white",
  ai_chat: "bg-cyan-100 text-cyan-800",
  manual: "bg-slate-100 text-slate-700",
  student_site: "bg-sky-100 text-sky-800",
  unassigned: "bg-rose-100 text-rose-800",
  assigned: "bg-indigo-100 text-indigo-800",
};

export function Badge({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  /** Custom label. Falls back to a humanised `value` when omitted. */
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        styles[value] || "bg-slate-100 text-slate-700",
        className,
      )}
    >
      {children ?? value.replace(/_/g, " ")}
    </span>
  );
}