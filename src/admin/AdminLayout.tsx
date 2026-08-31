// // // import { NavLink, Outlet } from "react-router-dom";
// // // import {
// // //   Bell,
// // //   BookOpen,
// // //   ClipboardList,
// // //   FileText,
// // //   GraduationCap,
// // //   LayoutDashboard,
// // //   LogOut,
// // //   Menu,
// // //   MessageCircle,
// // //   MessagesSquare,
// // //   Plane,
// // //   Phone,
// // //   PhoneCall,
// // //   Shield,
// // //   Target,
// // //   University,
// // //   Users,
// // //   Wallet,
// // //   X,
// // // } from "lucide-react";
// // // import { useState } from "react";
// // // import { useAuth } from "@/context/AuthContext";
// // // import { displayName, initials, isConvertedStudent } from "@/lib/utils";
// // // import { Button } from "@/components/ui/Button";
// // // import { useAdminStore } from "@/lib/store";

// // // const groups = [
// // //   {
// // //     title: "Overview",
// // //     items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
// // //   },
// // //   {
// // //     title: "CRM",
// // //     items: [
// // //       { to: "/admin/leads", label: "Telecaller Leads", icon: PhoneCall, end: false },
// // //       { to: "/admin/telecallers", label: "Telecallers", icon: Phone, end: false },
// // //       { to: "/admin/unassigned", label: "Counselor Assign", icon: Target, end: false },
// // //       { to: "/admin/students", label: "Students", icon: GraduationCap, end: false },
// // //     ],
// // //   },
// // //   {
// // //     title: "Operations",
// // //     items: [
// // //       { to: "/admin/documents", label: "Documents", icon: FileText, end: false },
// // //       { to: "/admin/applications", label: "Applications", icon: BookOpen, end: false },
// // //       { to: "/admin/shortlists", label: "Shortlists", icon: University, end: false },
// // //       { to: "/admin/chat", label: "Student Chat", icon: MessageCircle, end: false },
// // //       { to: "/admin/ai-chat", label: "AI Chat", icon: MessagesSquare, end: false },
// // //     ],
// // //   },
// // //   {
// // //     title: "People",
// // //     items: [
// // //       { to: "/admin/users", label: "Users", icon: Users, end: false },
// // //       { to: "/admin/counselors", label: "Counselors", icon: Shield, end: false },
// // //       { to: "/admin/hr", label: "HR", icon: Wallet, end: false },
// // //     ],
// // //   },
// // //   {
// // //     title: "Catalog",
// // //     items: [
// // //       { to: "/admin/universities", label: "Universities", icon: Plane, end: false },
// // //       { to: "/admin/checklists", label: "Document lists", icon: ClipboardList, end: false },
// // //     ],
// // //   },
// // //   {
// // //     title: "System",
// // //     items: [
// // //       { to: "/admin/notifications", label: "Notifications", icon: Bell, end: false },
// // //       { to: "/admin/health", label: "Health", icon: Shield, end: false },
// // //     ],
// // //   },
// // // ];

// // // export default function AdminLayout() {
// // //   const { user, signOut } = useAuth();
// // //   const [open, setOpen] = useState(false);
// // //   const store = useAdminStore();
// // //   const pendingDocs = store.documents.filter((item) => item.status === "uploaded" || item.status === "pending").length;
// // //   const pendingLeave = store.leave.filter((item) => item.status === "pending").length;
// // //   const unassigned = store.leads.filter((item) => isConvertedStudent(item) && !item.assigned_counselor_id).length;

// // //   const Nav = () => (
// // //     <>
// // //       <div className="flex items-center gap-3 border-b border-white/10 p-4">
// // //         <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white">
// // //           <Shield className="h-5 w-5" />
// // //         </div>
// // //         <div>
// // //           <p className="text-sm font-semibold text-white">Admin Portal</p>
// // //           <p className="text-xs text-slate-400">Fly Masters</p>
// // //         </div>
// // //       </div>
// // //       <nav className="flex-1 overflow-y-auto py-4">
// // //         {groups.map((group) => (
// // //           <div key={group.title} className="mb-3">
// // //             <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
// // //             {group.items.map((item) => (
// // //               <NavLink
// // //                 key={item.to}
// // //                 to={item.to}
// // //                 end={item.end}
// // //                 onClick={() => setOpen(false)}
// // //                 className={({ isActive }) =>
// // //                   `mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
// // //                     isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
// // //                   }`
// // //                 }
// // //               >
// // //                 <item.icon className="h-4 w-4" />
// // //                 {item.label}
// // //                 {item.label === "Documents" && pendingDocs > 0 && (
// // //                   <span className="ml-auto rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-white">{pendingDocs}</span>
// // //                 )}
// // //                 {item.label === "Counselor Assign" && unassigned > 0 && (
// // //                   <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{unassigned}</span>
// // //                 )}
// // //                 {item.label === "HR" && pendingLeave > 0 && (
// // //                   <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{pendingLeave}</span>
// // //                 )}
// // //               </NavLink>
// // //             ))}
// // //           </div>
// // //         ))}
// // //       </nav>
// // //       <div className="border-t border-white/10 p-4">
// // //         <div className="mb-3 flex items-center gap-3">
// // //           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">
// // //             {initials(user?.firstName, user?.lastName, user?.email)}
// // //           </div>
// // //           <div className="min-w-0">
// // //             <p className="truncate text-sm font-medium text-white">{displayName(user?.firstName, user?.lastName)}</p>
// // //             <p className="text-xs capitalize text-slate-400">{user?.role?.replace("_", " ")}</p>
// // //           </div>
// // //         </div>
// // //         <Button
// // //           variant="ghost"
// // //           size="sm"
// // //           className="w-full justify-start text-slate-300 hover:bg-white/10"
// // //           onClick={() => {
// // //             void signOut();
// // //           }}
// // //         >
// // //           <LogOut className="h-4 w-4" /> Sign out
// // //         </Button>
// // //       </div>
// // //     </>
// // //   );

// // //   return (
// // //     <div className="flex min-h-screen bg-slate-50">
// // //       <Button variant="ghost" size="sm" className="fixed left-3 top-3 z-50 md:hidden" onClick={() => setOpen(!open)}>
// // //         {open ? <X /> : <Menu />}
// // //       </Button>
// // //       <aside className="hidden w-64 flex-col bg-navy-950 md:flex">
// // //         <Nav />
// // //       </aside>
// // //       {open && (
// // //         <>
// // //           <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
// // //           <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-navy-950 md:hidden">
// // //             <Nav />
// // //           </aside>
// // //         </>
// // //       )}
// // //       <main className="flex-1 overflow-y-auto p-4 pt-14 md:p-8 md:pt-8">
// // //         {store.error && (
// // //           <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
// // //             {store.error}
// // //           </div>
// // //         )}
// // //         <Outlet />
// // //       </main>
// // //     </div>
// // //   );
// // // }

// // import { NavLink, Outlet } from "react-router-dom";
// // import {
// //   Bell,
// //   ClipboardList,
// //   GraduationCap,
// //   LayoutDashboard,
// //   LogOut,
// //   Menu,
// //   Plane,
// //   Phone,
// //   PhoneCall,
// //   Shield,
// //   Target,
// //   Users,
// //   Wallet,
// //   X,
// // } from "lucide-react";
// // import { useState } from "react";
// // import { useAuth } from "@/context/AuthContext";
// // import { displayName, initials, isConvertedStudent } from "@/lib/utils";
// // import { Button } from "@/components/ui/Button";
// // import { useAdminStore } from "@/lib/store";

// // const groups = [
// //   {
// //     title: "Overview",
// //     items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
// //   },
// //   {
// //     title: "CRM",
// //     items: [
// //       { to: "/admin/leads", label: "Telecaller Leads", icon: PhoneCall, end: false },
// //       { to: "/admin/telecallers", label: "Telecallers", icon: Phone, end: false },
// //       { to: "/admin/unassigned", label: "Counselor Assign", icon: Target, end: false },
// //       { to: "/admin/students", label: "Students", icon: GraduationCap, end: false },
// //     ],
// //   },
// //   {
// //     title: "People",
// //     items: [
// //       { to: "/admin/users", label: "Users", icon: Users, end: false },
// //       { to: "/admin/counselors", label: "Counselors", icon: Shield, end: false },
// //       { to: "/admin/hr", label: "HR", icon: Wallet, end: false },
// //     ],
// //   },
// //   {
// //     title: "Catalog",
// //     items: [
// //       { to: "/admin/universities", label: "Universities", icon: Plane, end: false },
// //       { to: "/admin/checklists", label: "Document lists", icon: ClipboardList, end: false },
// //     ],
// //   },
// //   {
// //     title: "System",
// //     items: [
// //       { to: "/admin/notifications", label: "Notifications", icon: Bell, end: false },
// //       { to: "/admin/health", label: "Health", icon: Shield, end: false },
// //     ],
// //   },
// // ];

// // export default function AdminLayout() {
// //   const { user, signOut } = useAuth();
// //   const [open, setOpen] = useState(false);
// //   const store = useAdminStore();
// //   const pendingDocs = store.documents.filter((item) => item.status === "uploaded" || item.status === "pending").length;
// //   const pendingLeave = store.leave.filter((item) => item.status === "pending").length;
// //   const unassigned = store.leads.filter((item) => isConvertedStudent(item) && !item.assigned_counselor_id).length;

// //   const Nav = () => (
// //     <>
// //       <div className="flex items-center gap-3 border-b border-white/10 p-4">
// //         <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white">
// //           <Shield className="h-5 w-5" />
// //         </div>
// //         <div>
// //           <p className="text-sm font-semibold text-white">Admin Portal</p>
// //           <p className="text-xs text-slate-400">Fly Masters</p>
// //         </div>
// //       </div>
// //       <nav className="flex-1 overflow-y-auto py-4">
// //         {groups.map((group) => (
// //           <div key={group.title} className="mb-3">
// //             <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
// //             {group.items.map((item) => (
// //               <NavLink
// //                 key={item.to}
// //                 to={item.to}
// //                 end={item.end}
// //                 onClick={() => setOpen(false)}
// //                 className={({ isActive }) =>
// //                   `mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
// //                     isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
// //                   }`
// //                 }
// //               >
// //                 <item.icon className="h-4 w-4" />
// //                 {item.label}
// //                 {item.label === "Documents" && pendingDocs > 0 && (
// //                   <span className="ml-auto rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-white">{pendingDocs}</span>
// //                 )}
// //                 {item.label === "Counselor Assign" && unassigned > 0 && (
// //                   <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{unassigned}</span>
// //                 )}
// //                 {item.label === "HR" && pendingLeave > 0 && (
// //                   <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{pendingLeave}</span>
// //                 )}
// //               </NavLink>
// //             ))}
// //           </div>
// //         ))}
// //       </nav>
// //       <div className="border-t border-white/10 p-4">
// //         <div className="mb-3 flex items-center gap-3">
// //           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">
// //             {initials(user?.firstName, user?.lastName, user?.email)}
// //           </div>
// //           <div className="min-w-0">
// //             <p className="truncate text-sm font-medium text-white">{displayName(user?.firstName, user?.lastName)}</p>
// //             <p className="text-xs capitalize text-slate-400">{user?.role?.replace("_", " ")}</p>
// //           </div>
// //         </div>
// //         <Button
// //           variant="ghost"
// //           size="sm"
// //           className="w-full justify-start text-slate-300 hover:bg-white/10"
// //           onClick={() => {
// //             void signOut();
// //           }}
// //         >
// //           <LogOut className="h-4 w-4" /> Sign out
// //         </Button>
// //       </div>
// //     </>
// //   );

// //   return (
// //     <div className="flex min-h-screen bg-slate-50">
// //       <Button variant="ghost" size="sm" className="fixed left-3 top-3 z-50 md:hidden" onClick={() => setOpen(!open)}>
// //         {open ? <X /> : <Menu />}
// //       </Button>
// //       <aside className="hidden w-64 flex-col bg-navy-950 md:flex">
// //         <Nav />
// //       </aside>
// //       {open && (
// //         <>
// //           <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
// //           <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-navy-950 md:hidden">
// //             <Nav />
// //           </aside>
// //         </>
// //       )}
// //       <main className="flex-1 overflow-y-auto p-4 pt-14 md:p-8 md:pt-8">
// //         {store.error && (
// //           <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
// //             {store.error}
// //           </div>
// //         )}
// //         <Outlet />
// //       </main>
// //     </div>
// //   );
// // }

// import { NavLink, Outlet } from "react-router-dom";
// import {
//   Bell,
//   ClipboardList,
//   GraduationCap,
//   AlarmClock,
//   LayoutDashboard,
//   LogOut,
//   Menu,
//   Plane,
//   Phone,
//   PhoneCall,
//   Shield,
//   Target,
//   Users,
//   Wallet,
//   X,
// } from "lucide-react";
// import { useState } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { displayName, initials, isConvertedStudent } from "@/lib/utils";
// import { Button } from "@/components/ui/Button";
// import { useAdminStore } from "@/lib/store";

// const groups = [
//   {
//     title: "Overview",
//     items: [
//       { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
//       { to: "/admin/alerts", label: "Lead Alerts", icon: AlarmClock, end: false },
//     ],
//   },
//   {
//     title: "CRM",
//     items: [
//       { to: "/admin/leads", label: "Telecaller Leads", icon: PhoneCall, end: false },
//       { to: "/admin/telecallers", label: "Telecallers", icon: Phone, end: false },
//       { to: "/admin/unassigned", label: "Counselor Assign", icon: Target, end: false },
//       { to: "/admin/students", label: "Students", icon: GraduationCap, end: false },
//     ],
//   },
//   {
//     title: "People",
//     items: [
//       { to: "/admin/users", label: "Users", icon: Users, end: false },
//       { to: "/admin/counselors", label: "Counselors", icon: Shield, end: false },
//       { to: "/admin/hr", label: "HR", icon: Wallet, end: false },
//     ],
//   },
//   {
//     title: "Catalog",
//     items: [
//       { to: "/admin/universities", label: "Universities", icon: Plane, end: false },
//       { to: "/admin/checklists", label: "Document lists", icon: ClipboardList, end: false },
//     ],
//   },
//   {
//     title: "System",
//     items: [
//       { to: "/admin/notifications", label: "Notifications", icon: Bell, end: false },
//       { to: "/admin/health", label: "Health", icon: Shield, end: false },
//     ],
//   },
// ];

// export default function AdminLayout() {
//   const { user, signOut } = useAuth();
//   const [open, setOpen] = useState(false);
//   const store = useAdminStore();
//   const pendingDocs = store.documents.filter((item) => item.status === "uploaded" || item.status === "pending").length;
//   const pendingLeave = store.leave.filter((item) => item.status === "pending").length;
//   const unassigned = store.leads.filter((item) => isConvertedStudent(item) && !item.assigned_counselor_id).length;
//   const noTelecaller = store.leads.filter((item) => !isConvertedStudent(item) && !item.assigned_telecaller_id).length;

//   const Nav = () => (
//     <>
//       <div className="flex items-center gap-3 border-b border-white/10 p-4">
//         <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white">
//           <Shield className="h-5 w-5" />
//         </div>
//         <div>
//           <p className="text-sm font-semibold text-white">Admin Portal</p>
//           <p className="text-xs text-slate-400">Fly Masters</p>
//         </div>
//       </div>
//       <nav className="flex-1 overflow-y-auto py-4">
//         {groups.map((group) => (
//           <div key={group.title} className="mb-3">
//             <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
//             {group.items.map((item) => (
//               <NavLink
//                 key={item.to}
//                 to={item.to}
//                 end={item.end}
//                 onClick={() => setOpen(false)}
//                 className={({ isActive }) =>
//                   `mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
//                     isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
//                   }`
//                 }
//               >
//                 <item.icon className="h-4 w-4" />
//                 {item.label}
//                 {item.label === "Documents" && pendingDocs > 0 && (
//                   <span className="ml-auto rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-white">{pendingDocs}</span>
//                 )}
//                 {item.label === "Counselor Assign" && unassigned > 0 && (
//                   <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{unassigned}</span>
//                 )}
//                 {item.label === "Lead Alerts" && noTelecaller > 0 && (
//                   <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{noTelecaller}</span>
//                 )}
//                 {item.label === "HR" && pendingLeave > 0 && (
//                   <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{pendingLeave}</span>
//                 )}
//               </NavLink>
//             ))}
//           </div>
//         ))}
//       </nav>
//       <div className="border-t border-white/10 p-4">
//         <div className="mb-3 flex items-center gap-3">
//           <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">
//             {initials(user?.firstName, user?.lastName, user?.email)}
//           </div>
//           <div className="min-w-0">
//             <p className="truncate text-sm font-medium text-white">{displayName(user?.firstName, user?.lastName)}</p>
//             <p className="text-xs capitalize text-slate-400">{user?.role?.replace("_", " ")}</p>
//           </div>
//         </div>
//         <Button
//           variant="ghost"
//           size="sm"
//           className="w-full justify-start text-slate-300 hover:bg-white/10"
//           onClick={() => {
//             void signOut();
//           }}
//         >
//           <LogOut className="h-4 w-4" /> Sign out
//         </Button>
//       </div>
//     </>
//   );

//   return (
//     <div className="flex min-h-screen bg-slate-50">
//       <Button variant="ghost" size="sm" className="fixed left-3 top-3 z-50 md:hidden" onClick={() => setOpen(!open)}>
//         {open ? <X /> : <Menu />}
//       </Button>
//       <aside className="hidden w-64 flex-col bg-navy-950 md:flex">
//         <Nav />
//       </aside>
//       {open && (
//         <>
//           <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
//           <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-navy-950 md:hidden">
//             <Nav />
//           </aside>
//         </>
//       )}
//       <main className="flex-1 overflow-y-auto p-4 pt-14 md:p-8 md:pt-8">
//         {store.error && (
//           <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//             {store.error}
//           </div>
//         )}
//         <Outlet />
//       </main>
//     </div>
//   );
// }

import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  ClipboardList,
  GraduationCap,
  AlarmClock,
  LayoutDashboard,
  LogOut,
  Menu,
  Plane,
  Phone,
  PhoneCall,
  Shield,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { displayName, initials, isConvertedStudent } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useAdminStore } from "@/lib/store";

const groups = [
  {
    title: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/alerts", label: "Lead Alerts", icon: AlarmClock, end: false },
    ],
  },
  {
    title: "CRM",
    items: [
      { to: "/admin/leads", label: "Telecaller Leads", icon: PhoneCall, end: false },
      { to: "/admin/telecallers", label: "Telecallers", icon: Phone, end: false },
      { to: "/admin/unassigned", label: "Counselor Assign", icon: Target, end: false },
      { to: "/admin/students", label: "Students", icon: GraduationCap, end: false },
    ],
  },
  {
    title: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: Users, end: false },
      { to: "/admin/counselors", label: "Counselors", icon: Shield, end: false },
      { to: "/admin/hr", label: "HR", icon: Wallet, end: false },
    ],
  },
  {
    title: "Catalog",
    items: [
      { to: "/admin/universities", label: "Universities", icon: Plane, end: false },
      { to: "/admin/checklists", label: "Document lists", icon: ClipboardList, end: false },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/admin/notifications", label: "Notifications", icon: Bell, end: false },
      { to: "/admin/health", label: "Health", icon: Shield, end: false },
    ],
  },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const store = useAdminStore();
  const pendingDocs = store.documents.filter((item) => item.status === "uploaded" || item.status === "pending").length;
  const pendingLeave = store.leave.filter((item) => item.status === "pending").length;
  const unassigned = store.leads.filter((item) => isConvertedStudent(item) && !item.assigned_counselor_id).length;
  const noTelecaller = store.leads.filter((item) => !isConvertedStudent(item) && !item.assigned_telecaller_id).length;

  const Nav = () => (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Admin Portal</p>
          <p className="text-xs text-slate-400">Fly Masters</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-3">
            <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `mx-2 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.label === "Documents" && pendingDocs > 0 && (
                  <span className="ml-auto rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-white">{pendingDocs}</span>
                )}
                {item.label === "Counselor Assign" && unassigned > 0 && (
                  <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{unassigned}</span>
                )}
                {item.label === "Lead Alerts" && noTelecaller > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{noTelecaller}</span>
                )}
                {item.label === "HR" && pendingLeave > 0 && (
                  <span className="ml-auto rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">{pendingLeave}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-xs font-bold text-sky-300">
            {initials(user?.firstName, user?.lastName, user?.email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{displayName(user?.firstName, user?.lastName)}</p>
            <p className="text-xs capitalize text-slate-400">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-300 hover:bg-white/10"
          onClick={() => {
            void signOut();
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Button variant="ghost" size="sm" className="fixed left-3 top-3 z-50 md:hidden" onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </Button>
      <aside className="hidden w-64 flex-col bg-navy-950 md:flex">
        <Nav />
      </aside>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-navy-950 md:hidden">
            <Nav />
          </aside>
        </>
      )}
      <main className="flex-1 overflow-y-auto p-4 pt-14 md:p-8 md:pt-8">
        {store.error && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {store.error}
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}