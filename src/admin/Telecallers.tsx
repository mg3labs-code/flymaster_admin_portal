import { PhoneCall } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { displayName } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function Telecallers() {
  const store = useAdminStore();
  const telecallers = store.telecallers;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <PhoneCall className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Telecallers</h1>
          <p className="text-slate-600">
            First-contact team — capture lead details, qualify, and convert to students. Create accounts from Users with role Telecaller.
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        {telecallers.map((telecaller) => {
          const assigned = store.leads.filter(
            (lead) => lead.assigned_telecaller_id === telecaller.id && lead.entity_type !== "student" && lead.lead_status !== "converted",
          );
          const converted = store.leads.filter((lead) => lead.assigned_telecaller_id === telecaller.id && (lead.entity_type === "student" || lead.lead_status === "converted"));
          return (
            <Card key={telecaller.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{displayName(telecaller.first_name, telecaller.last_name, telecaller.email)}</p>
                  <p className="text-sm text-slate-500">{telecaller.email} · {telecaller.phone || "No phone"}</p>
                  <p className="mt-2 text-sm">{assigned.length} open leads · {converted.length} converted</p>
                </div>
                <Badge value={telecaller.is_active ? "telecaller" : "cold"} />
              </div>
            </Card>
          );
        })}
        {telecallers.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-500">
            No telecallers yet. Create one from Users with role Telecaller.
          </Card>
        )}
      </div>
    </div>
  );
}
