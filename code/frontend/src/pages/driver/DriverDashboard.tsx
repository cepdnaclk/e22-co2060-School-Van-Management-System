import { useEffect, useState, useCallback } from "react";
import {
  getActiveJourney,
  startJourney,
  arriveAtSchool,
  startReturn,
  completeJourney,
  boardStudent,
  dropStudent,
  triggerSOS,
  updateDriverLocation,
  Journey,
  StudentStatus,
} from "../../services/driverService";
import { getRoutes, Route } from "../../services/route.service";
import { getOnboardingStatus } from "../../services/driverService";
import { useAuth } from "../../features/auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Navigation,
  ShieldAlert,
  Zap,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Loader2,
  UserCircle,
  ArrowRight,
  Plus,
  Check,
  CreditCard,
  Settings,
  History as HistoryIcon
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pickup_started: { label: "Morning Trip", color: "text-amber-500", bg: "bg-amber-50/50 border-amber-100", icon: <Navigation size={20} /> },
  heading_to_school: { label: "Going to School", color: "text-blue-500", bg: "bg-blue-50/50 border-blue-100", icon: <Navigation size={20} /> },
  arrived_at_school: { label: "At School", color: "text-emerald-500", bg: "bg-emerald-50/50 border-emerald-100", icon: <CheckCircle2 size={20} /> },
  return_started: { label: "Afternoon Trip", color: "text-purple-500", bg: "bg-purple-50/50 border-purple-100", icon: <Navigation size={20} /> },
  completed: { label: "Trip Finished", color: "text-slate-400", bg: "bg-slate-50 border-slate-100", icon: <CheckCircle2 size={20} /> },
};

const NEXT_ACTION: Record<string, { label: string; action: string; color: string; hover: string }> = {
  pickup_started: { label: "Confirm reached school", action: "arrive", color: "bg-blue-600 shadow-blue-200", hover: "hover:bg-blue-700" },
  arrived_at_school: { label: "Start Afternoon Trip", action: "return", color: "bg-emerald-600 shadow-emerald-200", hover: "hover:bg-emerald-700" },
  return_started: { label: "Finish Trip", action: "complete", color: "bg-slate-900 shadow-slate-200", hover: "hover:bg-black" },
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const driverId = user?.id || 0;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [realDriverId, setRealDriverId] = useState<number>(0);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const [studentActionLoading, setStudentActionLoading] = useState<number[]>([]);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const status = await getOnboardingStatus();
      setOnboardingPending(!status.completed);
      if (status.driverId) {
        setRealDriverId(status.driverId);
        try {
          const driverRoutes = await getRoutes(status.driverId);
          setRoutes(driverRoutes);
          if (driverRoutes.length > 0) {
            setSelectedRoute(driverRoutes[0].id || 0);
          }
          await refreshJourney(status.driverId);
        } catch (routeErr: any) {
          console.error("Link broken: Unable to fetch driver-specific route manifest.", routeErr);
          setError(routeErr.message || "Connection sync failed: Route data unreachable.");
        }
      }
    } catch (err: any) {
      console.error("Failed to check onboarding status", err);
      setError(err.message || "Failed to identify driver profile.");
    } finally {
      setLoading(false);
    }
  };

  const refreshJourney = useCallback(async (targetDriverId: number) => {
    if (!targetDriverId) return;
    try {
      const data = await getActiveJourney(targetDriverId);
      setIsActive(data.active);
      setJourney(data.journey);
      setStudents(data.students || []);
    } catch (err: any) {
      setError("Satellite link sync failure.");
    }
  }, []);

  useEffect(() => {
    let watchId: number | null = null;

    if (isActive && journey?.id) {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            updateDriverLocation(journey.id, position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            console.error("GPS tracking error:", err);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        console.warn("Geolocation is not supported by your browser");
      }
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isActive, journey?.id]);

  const handleStart = async () => {
    if (onboardingPending) {
      navigate("/driver/onboarding");
      return;
    }
    if (!selectedRoute || !realDriverId) return;
    setActionLoading(true);
    setError(null);
    try {
      await startJourney(realDriverId, selectedRoute);
      await refreshJourney(realDriverId);
    } catch (err: any) {
      console.error("Stage transition failure", err);
      setError(err.message || "Command failure: Satellite downlink restricted.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSOS = async () => {
    // Prevent accidental taps with a confirmation dialog
    const confirmed = window.confirm(
      "⚠️ EMERGENCY ALERT\n\nThis will immediately send an SOS notification to all parents on your current route.\n\nAre you sure you want to proceed?"
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const result = await triggerSOS();
      setError(null);
      alert(`✅ SOS SENT SUCCESSFULLY\n\n${result.message}`);
    } catch (err: any) {
      setError(err.message || "SOS TRANSMISSION FAILURE: Manual backup required.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStudentAction = async (studentId: number, action: 'board' | 'drop') => {
    if (!journey) return;
    setStudentActionLoading(prev => [...prev, studentId]);
    try {
      if (action === 'board') {
        await boardStudent(journey.id, studentId);
      } else {
        await dropStudent(journey.id, studentId);
      }
      await refreshJourney(realDriverId);
    } catch (err: any) {
      console.error(`Failed to ${action} student`, err);
      setError(err.message || `Communication error: Failed to record student ${action} protocol.`);
    } finally {
      setStudentActionLoading(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleNextAction = async () => {
    if (!journey) return;
    setActionLoading(true);
    setError(null);
    try {
      const action = NEXT_ACTION[journey.status]?.action;
      if (action === "arrive") await arriveAtSchool(journey.id);
      else if (action === "return") await startReturn(journey.id);
      else if (action === "complete") await completeJourney(journey.id);
      await refreshJourney(realDriverId);
    } catch (err: any) {
      setError(err.message || "Command failure: Satellite downlink restricted.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || (!onboardingPending && driverId && !realDriverId)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 relative z-10" size={48} />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-4 animate-bounce">Finding Profile</h1>
        <p className="text-slate-400 font-bold max-w-sm mx-auto uppercase tracking-widest text-[10px]">Synchronizing with transport manifest... Stand by.</p>
      </div>
    );
  }

  const statusInfo = journey ? STATUS_LABELS[journey.status] : null;
  const nextAction = journey ? NEXT_ACTION[journey.status] : null;
  const boardedCount = students.filter((s) => s.boarded_at).length;
  const droppedCount = students.filter((s) => s.dropped_at).length;
  const isMorningTrip = journey ? ["pickup_started", "heading_to_school", "arrived_at_school"].includes(journey.status) : true;

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 font-sans max-w-[1420px] mx-auto">
      {/* Premium Header */}
      <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">Dashboard</h1>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <p className="text-xs md:text-sm font-bold text-slate-400 capitalize tracking-tight">Live connection active</p>
          </div>
        </div>
        {/* Glowing SOS Button */}
        <button
          className="relative group flex items-center justify-center gap-3 px-6 py-4 md:px-8 md:py-5 bg-red-600 text-white rounded-2xl md:rounded-[2rem] font-black shadow-lg shadow-red-200 transition-all hover:bg-red-700 hover:scale-[1.02] active:scale-95 overflow-hidden w-full md:w-auto"
          onClick={handleSOS}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <ShieldAlert className="relative z-10" size={20} />
          <span className="relative z-10 text-base md:text-lg tracking-wider uppercase">Emergency Button</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl md:rounded-[2.5rem] bg-red-50 border border-red-100 p-5 md:p-6 text-sm font-black text-red-600 tracking-wider flex items-center gap-3 md:gap-4 animate-in slide-in-from-top-4">
          <ShieldAlert size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Onboarding Banner */}
      {onboardingPending && (
        <div className="rounded-3xl md:rounded-[3rem] bg-amber-50/50 border border-amber-100 p-6 md:p-10 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 group">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-[2rem] bg-white shadow-sm text-amber-500 flex items-center justify-center border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shrink-0">
              <Navigation size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-amber-900 tracking-tighter leading-none">Setup Required</h2>
              <p className="text-amber-700 font-bold mt-2 text-xs md:text-sm">Please set up your van and route information to start.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/driver/onboarding")}
            className="w-full md:w-auto px-8 py-4 md:px-12 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-3xl font-black text-base md:text-lg shadow-xl shadow-slate-200 transition-all hover:bg-black active:scale-95 flex items-center justify-center gap-3"
          >
            Start Wizard <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Startup Flow */}
      {!isActive && routes.length > 0 && (
        <div className="rounded-3xl md:rounded-[4rem] bg-white p-6 md:p-12 shadow-premium border border-slate-50 space-y-8 md:space-y-12 group overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none hidden md:block">
            <Navigation size={180} />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-10">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                <Navigation size={32} />
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">Your Route</h2>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-slate-400 font-bold text-xs md:text-sm">
                  <p className="flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-500" />
                    {routes[0].schedule || "Morning / Evening"}
                  </p>
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                  <p className="flex items-center gap-1.5">
                    <Users size={14} className="text-blue-500" />
                    {routes[0].stops?.length || 0} Stops
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/driver/onboarding")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-emerald-500 hover:border-emerald-100 transition-all active:scale-95 w-full lg:w-auto"
            >
              Edit Route Details
            </button>
          </div>

          <div className="p-4 md:p-8 rounded-2xl md:rounded-[3rem] bg-slate-50/50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            <div className="flex items-center gap-3 ml-1 w-full md:w-auto">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] shrink-0" />
              <p className="text-lg md:text-xl font-black text-slate-800 tracking-tight truncate">{routes[0].route_name}</p>
            </div>
            <button
              disabled={actionLoading}
              onClick={handleStart}
              className="w-full md:w-auto px-10 py-4 md:px-16 md:py-6 bg-emerald-500 text-white rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
            >
              {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              {actionLoading ? "Syncing..." : "Start Trip"}
            </button>
          </div>
        </div>
      )}

      {!isActive && routes.length === 0 && !onboardingPending && (
        <div className="rounded-3xl md:rounded-[3rem] bg-white p-8 md:p-20 shadow-premium border border-slate-50 text-center animate-in zoom-in-95">
          <div className="mb-6 h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mx-auto shadow-inner border border-slate-50">
            <Navigation size={32} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">No active route found</h2>
          <p className="mt-3 text-slate-400 font-medium max-w-sm mx-auto text-sm">You haven't set up your route yet. Please complete the setup to start driving.</p>
          <button
            onClick={() => navigate("/driver/onboarding")}
            className="mt-8 rounded-2xl bg-emerald-500 px-8 py-4 text-sm md:text-base font-black text-white shadow-xl shadow-emerald-200/80 transition-all hover:bg-emerald-600 active:scale-95"
          >
            Setup Route
          </button>
        </div>
      )}

      {/* Active Mission Dashboard */}
      {isActive && journey && (
        <>
          {/* Status + Stats Terminal */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <div className={`md:col-span-2 rounded-3xl md:rounded-[3.5rem] border p-6 md:p-10 flex flex-col justify-between shadow-soft transition-all min-h-[220px] ${statusInfo?.bg}`}>
              <div>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Trip Progress</p>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100/50 shrink-0">
                    {statusInfo?.icon}
                  </div>
                  <p className={`text-2xl md:text-4xl font-black tracking-tighter leading-none ${statusInfo?.color}`}>{statusInfo?.label}</p>
                </div>
              </div>
              <div className="mt-6 md:mt-8 flex items-center justify-between p-4 md:p-6 bg-white/50 backdrop-blur-md rounded-2xl md:rounded-[2.5rem] border border-white/50">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={16} className="text-slate-400 shrink-0" />
                  <p className="text-xs md:text-sm font-black text-slate-800 tracking-tight truncate">{(journey as any).route_name || `Route #${journey.route_id}`}</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500 animate-pulse shrink-0">
                  <Zap size={12} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Tracking On</span>
                </div>
              </div>
            </div>

            {[
              { label: "Boarded", count: boardedCount, total: students.length, color: "text-blue-600", bg: "bg-blue-50/50", icon: <Users size={20} /> },
              { label: "Dropped", count: droppedCount, total: students.length, color: "text-emerald-600", bg: "bg-emerald-50/50", icon: <CheckCircle2 size={20} /> }
            ].map((stat, i) => (
              <div key={i} className="rounded-3xl md:rounded-[3rem] bg-white border border-slate-50 p-6 md:p-10 text-center shadow-soft group hover:border-slate-200 transition-all flex md:flex-col items-center md:justify-center justify-between gap-4">
                <div className="flex items-center md:flex-col gap-4 md:gap-0">
                  <div className={`h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center border shadow-inner ${stat.color} ${stat.bg} border-transparent group-hover:bg-white group-hover:border-slate-100 transition-all md:mx-auto md:mb-6 shrink-0`}>
                    {stat.icon}
                  </div>
                  <div className="text-left md:text-center">
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 md:mb-2">{stat.label}</p>
                    <div className="flex items-baseline md:justify-center gap-1">
                      <p className={`text-3xl md:text-5xl font-black tracking-tighter ${stat.color}`}>{stat.count}</p>
                      <p className="text-xs md:text-lg font-black text-slate-200 tracking-tighter italic">/ {stat.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mission Control Trigger */}
          {nextAction && (
            <button
              onClick={handleNextAction}
              disabled={actionLoading}
              className={`w-full py-5 md:py-8 rounded-2xl md:rounded-[3rem] text-white text-lg md:text-2xl font-black shadow-lg transition-all disabled:opacity-30 active:scale-[0.98] flex items-center justify-center gap-4 md:gap-6 group overflow-hidden relative ${nextAction.color}`}
            >
              <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
              {actionLoading ? <Loader2 className="animate-spin w-6 h-6 md:w-8 md:h-8" /> : <ArrowRight className="group-hover:translate-x-2 transition-transform duration-500 shrink-0 w-6 h-6" />}
              <span className="relative z-10 tracking-widest uppercase">{actionLoading ? "Processing Phase..." : nextAction.label}</span>
            </button>
          )}

          {/* Student Manifest Checklist */}
          <div className="rounded-3xl md:rounded-[4rem] bg-white shadow-premium border border-slate-50 overflow-hidden">
            <div className="px-6 py-6 md:px-12 md:py-10 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none">Student List</h2>
                <p className="text-xs font-bold text-slate-400 mt-2">Check students who get on or off the van</p>
              </div>
              <div className="flex h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-slate-50 items-center justify-center text-slate-300 border border-slate-50 shadow-inner shrink-0">
                <Users size={18} />
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-12 md:p-20 text-center">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200 mx-auto shadow-inner mb-4">
                  <UserCircle size={36} />
                </div>
                <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em]">No Signal from Student Manifest</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {students.map((student) => {
                  const isDropped = !!student.dropped_at || (journey?.status === "arrived_at_school" && !!student.boarded_at);
                  const getStatusLabel = () => {
                    if (student.dropped_at) {
                      return isMorningTrip ? 'Dropped at school' : 'Dropped at home';
                    }
                    if (journey?.status === "arrived_at_school" && student.boarded_at) {
                      return 'Dropped at school';
                    }
                    if (student.boarded_at) {
                      return 'On the van';
                    }
                    return 'Waiting';
                  };

                  return (
                    <li key={student.student_id} className={`group flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-8 md:px-12 md:py-12 hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0 gap-6 md:gap-4 ${(student as any).is_absent ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto">
                          <div className={`h-14 w-14 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem] flex items-center justify-center border-2 transition-all duration-500 shadow-sm shrink-0 ${(student as any).is_absent ? 'bg-red-50 text-red-300 border-red-100' : isDropped ? 'bg-emerald-500 text-white border-emerald-400' : (student.boarded_at ? 'bg-blue-500 text-white border-blue-400' : 'bg-white text-slate-300 border-slate-100')}`}>
                              {isDropped ? <CheckCircle2 className="w-6 h-6 md:w-10 md:h-10" /> : <UserCircle className="w-6 h-6 md:w-10 md:h-10" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none truncate">{student.student_name}</p>
                            <div className="flex items-center gap-2 mt-2">
                               <Clock size={12} className="text-slate-300 shrink-0" />
                               <p className="text-xs md:text-base font-bold text-slate-400 truncate">
                                  {student.boarded_at
                                    ? `Boarded: ${new Date(student.boarded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                    : "Awaiting Boarding"}
                                  {student.dropped_at && ` • Arrival: ${new Date(student.dropped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                               </p>
                            </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                          {(student as any).is_absent ? (
                            <div className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-500 text-xs font-black uppercase tracking-widest">
                              <span>Absent</span>
                            </div>
                          ) : (
                            <>
                              {statusInfo?.label === "Morning Trip" && !student.boarded_at && (
                                <button
                                  disabled={studentActionLoading.includes(student.student_id)}
                                  onClick={() => handleStudentAction(student.student_id, 'board')}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-md shadow-blue-500/15 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                >
                                  {studentActionLoading.includes(student.student_id) ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                  {studentActionLoading.includes(student.student_id) ? "Syncing..." : "Pick Up"}
                                </button>
                              )}
                              
                              {statusInfo?.label === "Afternoon Trip" && student.boarded_at && !student.dropped_at && (
                                <button
                                  disabled={studentActionLoading.includes(student.student_id)}
                                  onClick={() => handleStudentAction(student.student_id, 'drop')}
                                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-md shadow-emerald-500/15 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                >
                                  {studentActionLoading.includes(student.student_id) ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                  {studentActionLoading.includes(student.student_id) ? "Syncing..." : "Drop Off"}
                                </button>
                              )}

                              <div className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 shrink-0 ${
                              isDropped ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : (student.boarded_at ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400 border border-transparent')
                              }`}>
                                {isDropped && <Check size={12} />}
                                <span>{getStatusLabel()}</span>
                              </div>
                            </>
                          )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Payments & Financials Control Grid */}
      {!onboardingPending && realDriverId > 0 && (
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Financial Administration</span>
            <h2 className="font-display text-2xl font-black text-slate-900 tracking-tight">Payments Control Center</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/driver/payments"
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-soft transition hover:bg-white"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition group-hover:bg-emerald-500 group-hover:text-white shrink-0">
                <CreditCard size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-base font-black text-slate-950">Student Dues</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 leading-tight">Calculate, track, and verify student fees</p>
              </div>
              <ArrowRight size={18} className="text-slate-300 transition group-hover:text-emerald-500 group-hover:translate-x-1 shrink-0" />
            </Link>

            <Link
              to="/driver/payments/history"
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-soft transition hover:bg-white"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 border border-slate-100 transition group-hover:bg-slate-900 group-hover:text-white shrink-0">
                <HistoryIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-base font-black text-slate-950">Payment History</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 leading-tight">View previous approvals and records</p>
              </div>
              <ArrowRight size={18} className="text-slate-300 transition group-hover:text-slate-900 group-hover:translate-x-1 shrink-0" />
            </Link>

            <Link
              to="/driver/payments/settings"
              className="group flex items-center gap-4 rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-soft transition hover:bg-white"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 border border-slate-100 transition group-hover:bg-emerald-500 group-hover:text-white shrink-0">
                <Settings size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-base font-black text-slate-950">Payment Settings</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400 leading-tight">Manage fixed rates & calculation modes</p>
              </div>
              <ArrowRight size={18} className="text-slate-300 transition group-hover:text-emerald-500 group-hover:translate-x-1 shrink-0" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
