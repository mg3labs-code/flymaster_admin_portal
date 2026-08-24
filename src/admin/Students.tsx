import { useMemo, useState } from "react";
import { format } from "date-fns";
import { GraduationCap, Mail, Phone } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { counselorLabel, displayName, isConvertedStudent, telecallerLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";

export default function Students() {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.leads
      .filter((lead) => isConvertedStudent(lead))
      .filter((lead) => `${lead.first_name} ${lead.last_name} ${lead.email}`.toLowerCase().includes(q));
  }, [store.leads, query]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-slate-600">
            Converted leads — telecaller history, country counselor, documents, applications, and shortlists.
          </p>
        </div>
      </div>
      <Input className="max-w-sm" placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="mt-4 grid gap-3">
        {students.map((student) => {
          const docs = store.documents.filter((item) => item.user_id === student.user_id && !item.archived);
          const apps = store.applications.filter((item) => item.user_id === student.user_id);
          const lists = store.shortlists.filter((item) => item.student_id === student.user_id || item.student_id === student.id);
          const chats = store.conversations.filter((item) => item.student_id === student.user_id || item.student_id === student.id);
          return (
            <Card key={student.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{displayName(student.first_name, student.last_name, student.email)}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</span>
                    {student.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.phone}</span>}
                  </div>
                  <p className="mt-2 text-sm">
                    {(student.preferred_countries || []).join(", ") || "No country"} · {student.field_of_interest || "No field"} · {student.academic_score || "No score"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Telecaller: {telecallerLabel(store.telecallers, student.assigned_telecaller_id)} · Counselor: {counselorLabel(store.counselors, student.assigned_counselor_id)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {docs.length} docs · {apps.length} applications · {lists.length} shortlists · {chats.length} chat threads
                    {student.conversion_date && <> · converted {format(new Date(student.conversion_date), "PP")}</>}
                  </p>
                  {student.notes && (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">{student.notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge value="converted" />
                  {!student.assigned_counselor_id && <Badge value="unassigned" />}
                  <Badge value={student.lead_source || "student"} />
                </div>
              </div>
            </Card>
          );
        })}
        {students.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No converted students yet.</Card>}
      </div>
    </div>
  );
}
