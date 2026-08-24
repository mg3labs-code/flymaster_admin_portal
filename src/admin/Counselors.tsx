import { Shield } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { displayName } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function Counselors() {
  const store = useAdminStore();
  const counselors = store.counselors;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Counselors</h1>
          <p className="text-slate-600">Country specialists assigned after student conversion. Set specializations to countries (UK, Canada, etc.).</p>
        </div>
      </div>
      <div className="grid gap-3">
        {counselors.map((counselor) => {
          const assigned = store.leads.filter((lead) => lead.assigned_counselor_id === counselor.id || lead.assigned_counselor_id === counselor.auth_user_id);
          const students = assigned.filter((lead) => lead.entity_type === "student" || lead.lead_status === "converted");
          return (
            <Card key={counselor.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{displayName(counselor.first_name, counselor.last_name, counselor.email)}</p>
                  <p className="text-sm text-slate-500">{counselor.email} · {counselor.phone || "No phone"}</p>
                  <p className="mt-2 text-sm">{assigned.length} assigned · {students.length} students</p>
                  {counselor.specializations?.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">{counselor.specializations.join(" · ")}</p>
                  )}
                  {counselor.bio && <p className="mt-2 text-sm text-slate-600">{counselor.bio}</p>}
                </div>
                <Badge value={counselor.is_active ? "assigned" : "cold"} />
              </div>
            </Card>
          );
        })}
        {counselors.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-500">
            No counselors yet. Create one from Users with role Counselor, or sign up on the counselor portal — both appear here.
          </Card>
        )}
      </div>
    </div>
  );
}
