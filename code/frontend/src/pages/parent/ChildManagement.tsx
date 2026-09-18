import { useEffect, useState } from "react";
import { 
    getChildren, 
    registerChild, 
    updateChild, 
    getAvailableRoutes,
    Child, 
    Route,
    getAbsences,
    markAbsent,
    cancelAbsence
} from "../../services/parentService";
import { UserPlus, UserCircle, Plus, ChevronRight, Edit3, MapPin, School, ShieldCheck, X, Navigation, Truck, Info, Calendar } from "lucide-react";
import StopSelectorMap from "../../components/parent/StopSelectorMap";

export default function ChildManagement() {
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchedRoute, setFetchedRoute] = useState<Route | null>(null);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);

    // Absence modal state
    const [absenceModalChild, setAbsenceModalChild] = useState<Child | null>(null);
    const [absences, setAbsences] = useState<any[]>([]);
    const [absenceForm, setAbsenceForm] = useState({ date: "", session_type: "both", reason: "" });
    const [absenceLoading, setAbsenceLoading] = useState(false);
    const [absenceError, setAbsenceError] = useState("");
    
    const [formData, setFormData] = useState({ 
        name: "", 
        school: "", 
        driver_id: "", 
        pickup_stop_id: "", 
        dropoff_stop_id: "",
        pickup_lat: 0,
        pickup_lng: 0,
        dropoff_lat: 0,
        dropoff_lng: 0
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [kids, routes] = await Promise.all([
                getChildren(),
                getAvailableRoutes()
            ]);
            setChildren(kids);
            setAvailableRoutes(routes);
        } catch (err) {
            console.error("Link failure: Remote manifest sync failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRouteChange = (routeId: string) => {
        setFormData({ ...formData, driver_id: routeId, pickup_stop_id: "", dropoff_stop_id: "" });
        const route = availableRoutes.find(r => r.id.toString() === routeId);
        setFetchedRoute(route || null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                school: formData.school,
                pickup_stop_id: parseInt(formData.pickup_stop_id),
                dropoff_stop_id: parseInt(formData.dropoff_stop_id),
                pickup_lat: formData.pickup_lat,
                pickup_lng: formData.pickup_lng,
                dropoff_lat: formData.dropoff_lat,
                dropoff_lng: formData.dropoff_lng
            };
            if (editingChild) {
                await updateChild(editingChild.id, payload);
            } else {
                await registerChild(payload);
            }
            setShowForm(false);
            setEditingChild(null);
            setFetchedRoute(null);
            setFormData({ name: "", school: "", driver_id: "", pickup_stop_id: "", dropoff_stop_id: "", pickup_lat: 0, pickup_lng: 0, dropoff_lat: 0, dropoff_lng: 0 });
            loadData();
        } catch (err) {
            alert("Sync Error: Failed to commit student data.");
        }
    };

    const handleEdit = async (child: Child) => {
        setEditingChild(child);
        const dId = child.driver_id?.toString() || "";
        
        setFormData({
            name: child.name,
            school: child.school || "",
            driver_id: dId,
            pickup_stop_id: child.pickup_stop_id?.toString() || "",
            dropoff_stop_id: child.dropoff_stop_id?.toString() || "",
            pickup_lat: child.pickup_lat || 0,
            pickup_lng: child.pickup_lng || 0,
            dropoff_lat: child.dropoff_lat || 0,
            dropoff_lng: child.dropoff_lng || 0
        });

        if (dId) {
            const route = availableRoutes.find(r => r.id.toString() === dId);
            setFetchedRoute(route || null);
        }
        
        setShowForm(true);
    };

    const openAbsenceModal = async (child: Child) => {
        setAbsenceModalChild(child);
        setAbsenceError("");
        setAbsenceForm({ date: "", session_type: "both", reason: "" });
        try {
            const data = await getAbsences(child.id);
            setAbsences(data);
        } catch (err) {
            setAbsences([]);
        }
    };

    const handleSubmitAbsence = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!absenceModalChild) return;
        setAbsenceLoading(true);
        setAbsenceError("");
        try {
            await markAbsent(absenceModalChild.id, absenceForm.date, absenceForm.session_type, absenceForm.reason || undefined);
            setAbsenceForm({ date: "", session_type: "both", reason: "" });
            const data = await getAbsences(absenceModalChild.id);
            setAbsences(data);
        } catch (err: any) {
            setAbsenceError("Failed to save absence. Please try again.");
        } finally {
            setAbsenceLoading(false);
        }
    };

    const handleCancelAbsence = async (studentId: number, date: string) => {
        try {
            await cancelAbsence(studentId, date);
            const data = await getAbsences(studentId);
            setAbsences(data);
        } catch (err) {
            alert("Failed to cancel absence.");
        }
    };



    if (loading) return (
        <div className="flex min-h-[400px] flex-col items-center justify-center">
            <div className="h-14 w-14 animate-spin rounded-full border-[6px] border-slate-100 border-t-emerald-500 shadow-xl" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-slate-300">Syncing Database</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700 font-sans">
            {/* Absence Management Modal */}
            {absenceModalChild && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAbsenceModalChild(null)} />
                    <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-500">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-amber-500">
                                    <Calendar size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Manage Absences</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{absenceModalChild.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setAbsenceModalChild(null)} className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {/* Mark New Absence Form */}
                            <div className="px-8 py-6 border-b border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Mark New Absence</p>
                                <form onSubmit={handleSubmitAbsence} className="space-y-4">
                                    {/* Date */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date</label>
                                        <input
                                            required
                                            type="date"
                                            value={absenceForm.date}
                                            onChange={e => setAbsenceForm(f => ({ ...f, date: e.target.value }))}
                                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
                                        />
                                    </div>
                                    {/* Session Type */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Journey</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {["morning", "afternoon", "both"].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setAbsenceForm(f => ({ ...f, session_type: s }))}
                                                    className={`rounded-2xl py-2.5 text-xs font-black transition-all capitalize border ${absenceForm.session_type === s ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100" : "bg-white text-slate-500 border-slate-100 hover:border-amber-300 hover:text-amber-600"}`}
                                                >
                                                    {s === "morning" ? "🌅 Morning" : s === "afternoon" ? "🌇 Afternoon" : "📅 Both"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Reason */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reason (optional)</label>
                                        <input
                                            type="text"
                                            value={absenceForm.reason}
                                            onChange={e => setAbsenceForm(f => ({ ...f, reason: e.target.value }))}
                                            placeholder="e.g. Doctor's appointment"
                                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all"
                                        />
                                    </div>
                                    {absenceError && <p className="text-xs font-bold text-red-500">{absenceError}</p>}
                                    <button
                                        type="submit"
                                        disabled={absenceLoading}
                                        className="w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-black text-white shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {absenceLoading ? "Saving..." : "Save Absence"}
                                    </button>
                                </form>
                            </div>

                            {/* Existing Absences List */}
                            <div className="px-8 py-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Recorded Absences</p>
                                {absences.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-200">
                                            <Calendar size={24} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">No absences recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {absences.map(ab => (
                                            <div key={ab.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-3 group hover:bg-white hover:shadow-soft transition-all">
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">{ab.absence_date}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${ab.session_type === "morning" ? "bg-amber-100 text-amber-700" : ab.session_type === "afternoon" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                                                            {ab.session_type}
                                                        </span>
                                                        {ab.reason && <span className="text-[10px] text-slate-400 font-bold truncate">{ab.reason}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleCancelAbsence(absenceModalChild.id, ab.absence_date)}
                                                    title="Cancel this absence"
                                                    className="h-9 w-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">My Children</h1>
                    <p className="mt-4 text-lg font-medium text-slate-400 capitalize flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500" size={20} />
                        Manage your child's information and van routes
                    </p>
                </div>
                {!showForm && (
                    <button 
                        onClick={() => { setEditingChild(null); setShowForm(true); }}
                        className="group flex items-center gap-3 rounded-[2rem] bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-slate-200 transition-all hover:bg-emerald-600 hover:shadow-emerald-200 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Child
                        <ChevronRight size={16} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </button>
                )}
            </div>

            {showForm && (
                <div className="overflow-hidden rounded-[3rem] bg-white shadow-premium border border-slate-50 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between border-b border-slate-50 px-10 py-8 bg-slate-50/30">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100/50">
                                <UserPlus size={24} />
                            </div>
                             <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{editingChild ? "Edit Details" : "Add Child"}</h2>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Information Secured</p>
                            </div>
                        </div>
                        <button onClick={() => setShowForm(false)} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-10">
                        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-300 ml-4 uppercase tracking-[0.2em]">Full Name</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full rounded-[2rem] border border-slate-100 bg-slate-50/50 px-8 py-5 text-slate-900 font-black tracking-tight focus:border-emerald-500 focus:bg-white focus:ring-[12px] focus:ring-emerald-500/5 transition-all outline-none text-lg"
                                    placeholder="Enter child's name"
                                />
                            </div>

                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-300 ml-4 uppercase tracking-[0.2em]">School Name</label>
                                <input 
                                    value={formData.school}
                                    onChange={e => setFormData({...formData, school: e.target.value})}
                                    className="w-full rounded-[2rem] border border-slate-100 bg-slate-50/50 px-8 py-5 text-slate-900 font-black tracking-tight focus:border-emerald-500 focus:bg-white focus:ring-[12px] focus:ring-emerald-500/5 transition-all outline-none text-lg"
                                    placeholder="Enter school name"
                                />
                            </div>

                             <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-300 ml-4 uppercase tracking-[0.2em]">Select Driver & Route</label>
                                <div className="relative group">
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                                        <Truck size={20} />
                                    </div>
                                    <select 
                                        required
                                        value={formData.driver_id}
                                        onChange={e => handleRouteChange(e.target.value)}
                                        className="w-full rounded-[2rem] border border-slate-100 bg-slate-50/50 pl-20 pr-8 py-5 text-slate-900 font-black tracking-tight focus:border-emerald-500 focus:bg-white focus:ring-[12px] focus:ring-emerald-500/5 transition-all outline-none text-lg appearance-none cursor-pointer"
                                    >
                                        <option value="">Choose your driver...</option>
                                        {availableRoutes.map(route => (
                                            <option key={route.id} value={route.id}>
                                                {route.driver_name} — {route.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                        <ChevronRight size={20} className="rotate-90" />
                                    </div>
                                </div>
                                <p className="mt-4 text-[10px] font-bold text-slate-400 ml-4 flex items-center gap-2">
                                    <Info size={14} className="text-emerald-500" />
                                    Ask your driver for their ID if they are not in this list.
                                </p>
                            </div>
                                
                            {fetchedRoute && (
                                <div className="md:col-span-2 space-y-10 mt-6 animate-in fade-in slide-in-from-top-10 duration-700">
                                     <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-300 ml-4 uppercase tracking-[0.3em]">Step 1: Morning Pickup Location</h3>
                                        <div className="p-2 bg-slate-50/50 rounded-[3rem] border border-slate-100 shadow-inner">
                                            <StopSelectorMap 
                                                label="Select Pickup Stop"
                                                stops={fetchedRoute.stops}
                                                initialLat={formData.pickup_lat}
                                                initialLng={formData.pickup_lng}
                                                onPointSelect={(lat, lng, stopId) => setFormData(prev => ({ 
                                                    ...prev, 
                                                    pickup_lat: lat, 
                                                    pickup_lng: lng,
                                                    pickup_stop_id: stopId.toString()
                                                }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-300 ml-4 uppercase tracking-[0.3em]">Step 2: Afternoon Drop-off Location</h3>
                                        <div className="p-2 bg-slate-50/50 rounded-[3rem] border border-slate-100 shadow-inner">
                                            <StopSelectorMap 
                                                label="Select Drop-off Stop"
                                                stops={fetchedRoute.stops}
                                                initialLat={formData.dropoff_lat}
                                                initialLng={formData.dropoff_lng}
                                                onPointSelect={(lat, lng, stopId) => setFormData(prev => ({ 
                                                    ...prev, 
                                                    dropoff_lat: lat, 
                                                    dropoff_lng: lng,
                                                    dropoff_stop_id: stopId.toString()
                                                }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-12 flex items-center justify-end gap-10 border-t border-slate-50 pt-10">
                            <button type="button" onClick={() => setShowForm(false)} className="text-sm font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-colors">Discard</button>
                             <button type="submit" className="rounded-[2rem] bg-emerald-500 px-16 py-5 text-lg font-black text-white shadow-2xl shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95">
                                {editingChild ? "Save Changes" : "Save Details"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {children.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[3rem] bg-white p-24 shadow-premium border border-slate-50 text-center animate-in zoom-in-95">
                    <div className="mb-8 h-24 w-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mx-auto shadow-inner border border-slate-50">
                        <UserCircle size={48} />
                    </div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">No children added yet</h2>
                    <p className="mt-3 text-slate-400 font-medium max-w-sm mx-auto">Add your child's information to see where the van is and get arrival updates.</p>
                    <button 
                        onClick={() => { setEditingChild(null); setShowForm(true); }}
                        className="mt-10 rounded-2xl bg-emerald-500 px-10 py-5 text-base font-black text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
                    >
                        Add Child
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                    {children.map(child => (
                        <div key={child.id} className="premium-card group relative p-8 rounded-[3rem]">
                            <div className="flex items-start justify-between mb-10">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all duration-500">
                                        <UserCircle size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{child.name}</h3>
                                        <div className="flex items-center gap-2 mt-2 text-sm font-bold text-slate-400">
                                            <School size={16} className="text-emerald-500/50" />
                                            <span>{child.school || "St. Peters College"}</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleEdit(child)}
                                    className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:bg-white hover:shadow-sm hover:border-slate-100 border border-transparent transition-all"
                                >
                                    <Edit3 size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 group-hover:bg-white group-hover:shadow-soft transition-all duration-500 min-w-0">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100 shrink-0">
                                            <MapPin size={18} />
                                        </div>
                                         <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Pickup at</p>
                                            <p className="text-sm font-black text-slate-800 tracking-tight mt-1 truncate">{child.pickup_stop_name || "Not set"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 group-hover:bg-white group-hover:shadow-soft transition-all duration-500 min-w-0">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 border border-slate-100 shrink-0">
                                            <Navigation size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Drop-off at</p>
                                            <p className="text-sm font-black text-slate-800 tracking-tight mt-1 truncate">{child.dropoff_stop_name || "Not set"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-2 w-2 rounded-full ${child.route_name ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                        {child.route_name || `Driver Link: ${child.driver_id}` || "Encryption Offline"}
                                    </span>
                                </div>
                                <button
                                    onClick={() => openAbsenceModal(child)}
                                    className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-2 text-xs font-black text-amber-700 hover:bg-amber-100 hover:border-amber-200 transition-all active:scale-95"
                                >
                                    <Calendar size={14} />
                                    Absences
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
