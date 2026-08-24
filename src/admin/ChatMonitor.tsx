import { useMemo, useState } from "react";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { counselorLabel, personName } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export default function ChatMonitor() {
  const store = useAdminStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const conversations = useMemo(
    () => [...store.conversations].sort((a, b) => String(b.last_message_at || "").localeCompare(String(a.last_message_at || ""))),
    [store.conversations],
  );
  const selected = conversations.find((item) => item.id === selectedId) || conversations[0] || null;
  const messages = store.messages.filter((item) => item.conversation_id === selected?.id);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Student chat</h1>
          <p className="text-slate-600">Private counselor–student conversations across both portals.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-2">
          {conversations.map((item) => (
            <button
              key={item.id}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selected?.id === item.id ? "bg-sky-50" : "hover:bg-slate-50"}`}
              onClick={() => setSelectedId(item.id)}
            >
              <p className="font-medium">{personName(store.leads, item.student_id)}</p>
              <p className="text-xs text-slate-500">{counselorLabel(store.counselors, item.counselor_id)}</p>
            </button>
          ))}
          {conversations.length === 0 && <p className="p-4 text-sm text-slate-500">No conversations yet.</p>}
        </Card>
        <Card className="max-h-[70vh] overflow-y-auto p-5">
          {!selected && <p className="text-sm text-slate-500">Select a conversation.</p>}
          {selected && messages.length === 0 && <p className="text-sm text-slate-500">No messages in this thread.</p>}
          {messages.map((item) => {
            const fromStudent = item.sender_id === selected?.student_id;
            return (
              <div key={item.id} className={`mb-3 max-w-[80%] rounded-2xl px-3 py-2 text-sm ${fromStudent ? "bg-slate-100" : "ml-auto bg-navy-900 text-white"}`}>
                <p>{item.message}</p>
                {item.created_at && <p className={`mt-1 text-[10px] ${fromStudent ? "text-slate-400" : "text-white/60"}`}>{format(new Date(item.created_at), "PP p")}</p>}
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
