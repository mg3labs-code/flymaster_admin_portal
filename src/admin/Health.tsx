// import { useEffect, useState } from "react";
// import { Shield } from "lucide-react";
// import { api } from "@/lib/api";
// import { Card } from "@/components/ui/Card";
// import { Badge } from "@/components/ui/Badge";

// export default function Health() {
//   const [status, setStatus] = useState<{ ok?: boolean; database?: string; error?: string; info?: { database?: string; db_user?: string } } | null>(null);

//   useEffect(() => {
//     api<{ ok: boolean; database: string; error?: string; info?: { database?: string; db_user?: string } }>("/health", { auth: false })
//       .then(setStatus)
//       .catch((error) => setStatus({ ok: false, error: error instanceof Error ? error.message : "Unreachable" }));
//   }, []);

//   return (
//     <div>
//       <div className="mb-6 flex items-center gap-3">
//         <Shield className="h-6 w-6 text-sky-500" />
//         <div>
//           <h1 className="text-2xl font-bold">System health</h1>
//           <p className="text-slate-600">This admin portal reads the same PostgreSQL database as the student and counselor websites.</p>
//         </div>
//       </div>
//       <div className="grid gap-4 md:grid-cols-2">
//         <Card className="p-5">
//           <p className="text-sm text-slate-500">Admin API</p>
//           <p className="mt-1 text-lg font-semibold">http://127.0.0.1:8788</p>
//           <p className="mt-2"><Badge value={status?.ok ? "assigned" : "rejected"} /></p>
//           {status?.error && <p className="mt-2 text-sm text-rose-600">{status.error}</p>}
//           {status?.info && <p className="mt-2 text-sm text-slate-500">{status.info.database} as {status.info.db_user}</p>}
//         </Card>
//         <Card className="p-5">
//           <p className="font-semibold">Connected products</p>
//           <ul className="mt-3 space-y-2 text-sm text-slate-600">
//             <li>Student website — leads, documents, applications, AI chat</li>
//             <li>Counselor website — assignment, shortlists, chat, HR</li>
//             <li>Admin portal — CRM, review, users, catalog, notifications</li>
//           </ul>
//         </Card>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Health() {
  const [status, setStatus] = useState<{ ok?: boolean; database?: string; error?: string } | null>(null);

  useEffect(() => {
    api<{ ok: boolean; database: string; error?: string }>("/health", { auth: false })
      .then(setStatus)
      .catch((error) => setStatus({ ok: false, error: error instanceof Error ? error.message : "Unreachable" }));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold">System health</h1>
          <p className="text-slate-600">This admin portal reads the same PostgreSQL database as the student and counselor websites.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Admin API</p>
          <p className="mt-1 text-lg font-semibold">http://127.0.0.1:8788</p>
          <p className="mt-2"><Badge value={status?.ok ? "assigned" : "rejected"} /></p>
          {status?.error && <p className="mt-2 text-sm text-rose-600">{status.error}</p>}
          {status?.database && <p className="mt-2 text-sm text-slate-500">Database {status.database}</p>}
        </Card>
        <Card className="p-5">
          <p className="font-semibold">Connected products</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Student website — leads, documents, applications, AI chat</li>
            <li>Counselor website — assignment, shortlists, chat, HR</li>
            <li>Admin portal — CRM, review, users, catalog, notifications</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}