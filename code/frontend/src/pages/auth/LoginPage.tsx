import { FormEvent, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../features/auth/api";
import { useAuth } from "../../features/auth/AuthContext";
import { BusFront, ArrowRight, Mail, Lock, Info } from "lucide-react";

const emptyCredentials = {
  email: "",
  password: "",
};

const trustedProfiles = [
  { name: "Asha", tone: "from-emerald-100 via-teal-50 to-amber-100", accent: "bg-emerald-700" },
  { name: "Ravi", tone: "from-sky-100 via-white to-emerald-100", accent: "bg-sky-700" },
  { name: "Nila", tone: "from-rose-100 via-white to-amber-100", accent: "bg-rose-700" },
  { name: "Dev", tone: "from-amber-100 via-white to-lime-100", accent: "bg-amber-700" },
];

function LoginPage() {
  const navigate = useNavigate();
  const { session, login: contextLogin, logout: contextLogout } = useAuth();

  const [credentials, setCredentials] = useState(emptyCredentials);


  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (!active) return;
      } catch {
        // Silently fail or log
      } finally {
        if (active) setIsBootstrapping(false);
      }
    }
    void bootstrap();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (session && !isBootstrapping) {
      const roleHome: Record<string, string> = {
        admin: "/admin/dashboard",
        driver: "/driver",
        parent: "/parent",
      };
      navigate(roleHome[session.user.role] || "/login", { replace: true });
    }
  }, [session, isBootstrapping, navigate]);


  function validateForm() {
    if (!credentials.email.trim()) {
      return "Email is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      return "Please enter a valid email address.";
    }
    if (!credentials.password.trim()) {
      return "Password is required.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const nextSession = await login(credentials.email, credentials.password);
      contextLogin(nextSession);
      const roleHome: Record<string, string> = {
        admin: "/admin/dashboard",
        driver: "/driver",
        parent: "/parent",
      };
      navigate(roleHome[nextSession.user.role] || "/login", { replace: true });
    } catch (error: any) {
      if (error?.code === "pending_approval" || error?.message?.includes("pending admin approval") || error?.message === "pending_approval") {
        navigate("/pending-approval", { state: { email: credentials.email } });
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfdfc]">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-500/20 flex items-center justify-center">
            <BusFront className="text-white w-6 h-6" />
        </div>
        <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfc] text-slate-900 grid lg:grid-cols-2 font-sans">
      {/* Left Panel: Hero */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-[linear-gradient(145deg,#10724f_0%,#27a977_56%,#f2bd4d_145%)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.2),transparent_28%)]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
            <BusFront className="text-white w-6 h-6" />
          </div>
          <span className="font-display font-black text-2xl text-white">KidsRoute</span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-5xl xl:text-6xl font-black text-white leading-[1.08] max-w-[13ch]">
            Experience the <span className="text-emerald-300">future</span> of school transport.
          </h1>
          <p className="mt-6 text-lg text-emerald-50/80 max-w-md font-medium leading-8">
            Real-time tracking, seamless logistics, and ultimate safety for the children who matter most. 
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 rounded-[1.75rem] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex -space-x-4">
                {trustedProfiles.map(profile => (
                    <ProfilePortrait key={profile.name} {...profile} />
                ))}
            </div>
            <div>
              <p className="text-sm font-black text-white">Trusted by 200+ locals</p>
              <p className="mt-1 text-xs font-semibold text-emerald-50/70">Parents and drivers using KidsRoute daily</p>
            </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-12">
            <h2 className="font-display text-4xl font-black text-slate-900">Welcome Back</h2>
            <p className="mt-2 text-slate-500 font-medium">Log in to your account to continue.</p>
          </div>

          {!session ? (
            <form className="space-y-6" onSubmit={handleSubmit}>


              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none"
                    onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Email or Username"
                    type="email"
                    value={credentials.email}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-800 font-bold focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all outline-none"
                    onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Password"
                    type="password"
                    value={credentials.password}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 animate-in fade-in slide-in-from-top-1">
                  <Info size={16} />
                  {errorMessage}
                </div>
              )}

              <button
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                type="submit"
              >
                {isSubmitting ? "Signing in..." : <>Access Dashboard <ArrowRight size={20} /></>}
              </button>

              <div className="pt-8 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  New to KidsRoute?{" "}
                  <Link to="/register" className="text-emerald-600 hover:text-emerald-500 underline underline-offset-8 decoration-2">
                    Create an account
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-4 p-6 bg-emerald-50 border border-emerald-100 rounded-[2.5rem]">
                    <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-2xl font-black text-emerald-600 border border-emerald-200">
                        {session.user.name?.charAt(0) || "P"}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Secure session active</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Hi, {session.user.name?.split(' ')[0]}</h3>
                    </div>
                </div>

                <div className="grid gap-3">
                    <button
                        onClick={() => navigate({admin: "/admin/dashboard", driver: "/driver", parent: "/tracking"}[session.user.role] || "/login")}
                        className="w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                    >
                        Resume to Dashboard
                    </button>
                    <button
                        onClick={contextLogout}
                        className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        Switch Account
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

function ProfilePortrait({ tone, accent, name }: { tone: string; accent: string; name: string }) {
  return (
    <div className={`relative h-12 w-12 overflow-hidden rounded-full border-2 border-white/80 bg-gradient-to-br ${tone} shadow-lg`} title={name}>
      <div className={`absolute left-1/2 top-2 h-5 w-5 -translate-x-1/2 rounded-full ${accent}`} />
      <div className="absolute bottom-1 left-1/2 h-7 w-8 -translate-x-1/2 rounded-t-full bg-white/90" />
      <div className="absolute left-1/2 top-4 h-4 w-4 -translate-x-1/2 rounded-full bg-[#f2c6a0]" />
      <div className="absolute left-[18px] top-[21px] h-1 w-1 rounded-full bg-slate-800" />
      <div className="absolute right-[18px] top-[21px] h-1 w-1 rounded-full bg-slate-800" />
    </div>
  );
}
