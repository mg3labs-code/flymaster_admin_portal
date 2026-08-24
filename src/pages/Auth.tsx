import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthContext";

export default function Auth() {
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "signup">(location.pathname === "/signup" ? "signup" : "login");
  const [email, setEmail] = useState(location.pathname === "/signup" ? "" : "admin@local.test");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/admin", { replace: true });
  }, [user, loading, navigate]);

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setError("");
    setPassword("");
    setEmail(next === "login" ? "admin@local.test" : "");
    navigate(next === "signup" ? "/signup" : "/", { replace: true });
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp({ email, password, firstName, lastName, phone });
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-hero-grid" />
      <Card className="relative w-full max-w-md p-8 text-navy-900">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold leading-tight">Fly Masters</p>
            <p className="text-xs uppercase tracking-widest text-slate-500">Admin portal</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Manage students, counselors, documents, and HR from one control center."
            : "Fill in your details to create an admin account."}
        </p>

        <form className="mt-6 space-y-3" onSubmit={(e) => void onSubmit(e)}>
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First name</Label>
                  <Input name="firstName" required autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input name="lastName" required autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input name="phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              name="password"
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button className="w-full" type="submit" disabled={busy || loading}>
            {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              New admin?{" "}
              <button type="button" className="font-medium text-sky-700" onClick={() => switchMode("signup")}>
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="font-medium text-sky-700" onClick={() => switchMode("login")}>
                Sign in
              </button>
            </>
          )}
        </p>

        {mode === "login" && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Local admin: <span className="font-medium text-navy-800">admin@local.test</span> / admin123
          </p>
        )}
      </Card>
    </div>
  );
}
