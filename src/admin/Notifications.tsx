import { FormEvent, useState } from "react";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { displayName, personName } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";

export default function Notifications() {
  const store = useAdminStore();
  const [busy, setBusy] = useState(false);

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const audience = String(data.get("audience"));
      const body = {
        title: String(data.get("title")),
        message: String(data.get("message")),
        audience,
        userId: String(data.get("userId") || ""),
      };
      if (audience === "one") {
        await api("/notifications", { method: "POST", body });
      } else {
        await api("/notifications/broadcast", { method: "POST", body });
      }
      e.currentTarget.reset();
      await refreshStore();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Bell className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-slate-600">Send alerts into the student and counselor inboxes.</p>
        </div>
      </div>
      <Card className="mb-4 p-5">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void send(e)}>
          <div><Label>Title</Label><Input name="title" required /></div>
          <div>
            <Label>Audience</Label>
            <Select name="audience" defaultValue="students">
              <option value="students">All students</option>
              <option value="counselors">All counselors</option>
              <option value="all">Everyone</option>
              <option value="one">One person</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Recipient (if one person)</Label>
            <Select name="userId" defaultValue="">
              <option value="">Choose</option>
              {store.users.map((user) => (
                <option key={user.id} value={user.id}>{displayName(user.first_name, user.last_name, user.email)} · {user.role}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2"><Label>Message</Label><Textarea name="message" required /></div>
          <div><Button type="submit" disabled={busy}>Send</Button></div>
        </form>
      </Card>
      <div className="grid gap-3">
        {store.notifications.slice(0, 40).map((item) => (
          <Card key={item.id} className="p-4">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-slate-600">{item.message}</p>
            <p className="mt-1 text-xs text-slate-400">
              {personName([...store.leads, ...store.users.map((user) => ({ ...user, user_id: user.id }))], item.user_id)}
              {item.created_at ? ` · ${format(new Date(item.created_at), "PP p")}` : ""}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
