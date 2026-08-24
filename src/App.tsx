import { Component, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import AdminLayout from "@/admin/AdminLayout";
import Dashboard from "@/admin/Dashboard";
import Leads from "@/admin/Leads";
import Unassigned from "@/admin/Unassigned";
import Students from "@/admin/Students";
import Documents from "@/admin/Documents";
import Applications from "@/admin/Applications";
import Shortlists from "@/admin/Shortlists";
import ChatMonitor from "@/admin/ChatMonitor";
import AiChat from "@/admin/AiChat";
import UsersPage from "@/admin/Users";
import Counselors from "@/admin/Counselors";
import HR from "@/admin/HR";
import Universities from "@/admin/Universities";
import Checklists from "@/admin/Checklists";
import Notifications from "@/admin/Notifications";
import Telecallers from "@/admin/Telecallers";
import Health from "@/admin/Health";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };

  static getDerivedStateFromError(error: Error) {
    return { error: error.message || "Something went wrong" };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-navy-950 p-6 text-white">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold">The page failed to load</h1>
            <p className="mt-2 text-sm text-slate-300">{this.state.error}</p>
            <button
              className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-navy-950"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="unassigned" element={<Unassigned />} />
              <Route path="students" element={<Students />} />
              <Route path="documents" element={<Documents />} />
              <Route path="applications" element={<Applications />} />
              <Route path="shortlists" element={<Shortlists />} />
              <Route path="chat" element={<ChatMonitor />} />
              <Route path="ai-chat" element={<AiChat />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="counselors" element={<Counselors />} />
              <Route path="hr" element={<HR />} />
              <Route path="universities" element={<Universities />} />
              <Route path="checklists" element={<Checklists />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="telecallers" element={<Telecallers />} />
              <Route path="health" element={<Health />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
