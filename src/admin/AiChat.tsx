import { useMemo, useState } from "react";
import { format } from "date-fns";
import { MessagesSquare } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AiChat() {
  const store = useAdminStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sessions = useMemo(
    () => [...store.chatSessions].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))),
    [store.chatSessions],
  );
  const selected = sessions.find((item) => item.id === selectedId) || sessions[0] || null;
  const messages = store.chatMessages.filter((item) => item.session_id === selected?.id);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <MessagesSquare className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">AI counselor chat</h1>
          <p className="text-slate-600">Anonymous University Advisor sessions from the public website.</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-2">
          {sessions.map((item) => (
            <button
              key={item.id}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${selected?.id === item.id ? "bg-sky-50" : "hover:bg-slate-50"}`}
              onClick={() => setSelectedId(item.id)}
            >
              <p className="font-medium">Session {String(item.id).slice(0, 8)}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge value={item.is_completed ? "converted" : "warm"} />
                {item.created_at && <span className="text-[10px] text-slate-400">{format(new Date(item.created_at), "PP")}</span>}
              </div>
            </button>
          ))}
          {sessions.length === 0 && <p className="p-4 text-sm text-slate-500">No AI chat sessions stored yet.</p>}
        </Card>
        <Card className="max-h-[70vh] overflow-y-auto p-5">
          {messages.map((item) => (
            <div key={item.id} className={`mb-3 max-w-[80%] rounded-2xl px-3 py-2 text-sm ${item.role === "user" ? "bg-slate-100" : "ml-auto bg-navy-900 text-white"}`}>
              <p>{item.content}</p>
            </div>
          ))}
          {selected && messages.length === 0 && <p className="text-sm text-slate-500">No messages for this session.</p>}
          {!selected && <p className="text-sm text-slate-500">No sessions to show.</p>}
        </Card>
      </div>
    </div>
  );
}
