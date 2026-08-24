import { FormEvent, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { api } from "@/lib/api";
import { refreshStore, useAdminStore } from "@/lib/store";
import { displayName } from "@/lib/utils";
import type { Role } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Field";

const ROLES: Role[] = ["student", "telecaller", "counselor", "admin", "super_admin"];

export default function UsersPage() {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busy, setBusy] = useState(false);

  const users = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.users
      .filter((user) => roleFilter === "all" || user.role === roleFilter)
      .filter((user) => `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(q));
  }, [store.users, query, roleFilter]);

  const createUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/users", {
        method: "POST",
        body: {
          firstName: String(data.get("firstName")),
          lastName: String(data.get("lastName")),
          email: String(data.get("email")),
          password: String(data.get("password")),
          phone: String(data.get("phone") || ""),
          role: String(data.get("role")),
        },
      });
      e.currentTarget.reset();
      await refreshStore();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not create user");
    } finally {
      setBusy(false);
    }
  };

  const setRole = async (id: string, role: string) => {
    await api(`/users/${id}/role`, { method: "PUT", body: { role } });
    await refreshStore();
  };

  const resetPassword = async (id: string) => {
    const password = window.prompt("New password (min 6 characters)");
    if (!password) return;
    try {
      await api(`/users/${id}/password`, { method: "PUT", body: { password } });
      window.alert("Password updated.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not update password");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">User management</h1>
          <p className="text-slate-600">Accounts shared by the student website, counselor portal, and this admin app.</p>
          <p className="mt-1 text-xs text-slate-500">
            Telecallers handle first contact and conversion. Counselors are assigned after convert by country specialization.
          </p>
        </div>
      </div>

      <Card className="mb-4 p-5">
        <p className="font-semibold">Create account</p>
        <form className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => void createUser(e)}>
          <div><Label>First name</Label><Input name="firstName" required /></div>
          <div><Label>Last name</Label><Input name="lastName" required /></div>
          <div><Label>Email</Label><Input name="email" type="email" required /></div>
          <div><Label>Password</Label><Input name="password" type="password" minLength={6} required /></div>
          <div><Label>Phone</Label><Input name="phone" /></div>
          <div>
            <Label>Role</Label>
            <Select name="role" defaultValue="student">
              {ROLES.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
            </Select>
          </div>
          <div className="flex items-end"><Button type="submit" disabled={busy}>Create</Button></div>
        </form>
      </Card>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-sm" placeholder="Search users..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select className="w-44" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          {ROLES.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
        </Select>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{displayName(user.first_name, user.last_name, user.email)}</p>
              <p className="text-xs text-slate-500">{user.email} · {user.phone || "No phone"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={user.role} />
              <Select className="w-36" value={user.role} onChange={(e) => void setRole(user.id, e.target.value)}>
                {ROLES.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}
              </Select>
              <Button size="sm" variant="secondary" onClick={() => void resetPassword(user.id)}>Reset password</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
