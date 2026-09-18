import { useEffect, useState } from "react";
import { Users, Truck, GraduationCap, CheckCircle2, XCircle, AlertCircle, Phone, Mail } from "lucide-react";
import { getUsers, updateUserStatus, getStudents } from "../../services/adminService";

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<"parents" | "drivers" | "students">("parents");
  
  const [parents, setParents] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (activeTab === "parents") {
        const data = await getUsers("parent");
        setParents(data);
      } else if (activeTab === "drivers") {
        const data = await getUsers("driver");
        setDrivers(data);
      } else if (activeTab === "students") {
        const data = await getStudents();
        setStudents(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: number, isApproved: boolean) => {
    try {
      await updateUserStatus(userId, isApproved);
      // Reload current tab data
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  const renderUserTable = (users: any[], role: string) => (
    <div className="overflow-x-auto w-full glass-card rounded-[1.75rem] border border-white/60 shadow-soft">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400 w-16">ID</th>
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400">Name</th>
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400">Contact</th>
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400">Status</th>
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/50">
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">No {role}s found.</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-white/40 transition-colors">
                <td className="p-4 font-bold text-slate-400">#{user.id}</td>
                <td className="p-4">
                  <span className="font-semibold text-slate-900 block">{user.name}</span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(user.created_at).toLocaleDateString()}</span>
                </td>
                <td className="p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
                    <Phone size={12} className="text-slate-300" />
                    <span>{user.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-xs">
                    <Mail size={12} className="text-slate-300" />
                    <span>{user.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  {user.is_approved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                      <CheckCircle2 size={12} /> Approved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-100">
                      <AlertCircle size={12} /> Pending
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {!user.is_approved ? (
                    <button 
                      onClick={() => handleStatusUpdate(user.id, true)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusUpdate(user.id, false)}
                      className="px-4 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-black border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderStudentTable = () => (
    <div className="overflow-x-auto w-full glass-card rounded-[1.75rem] border border-white/60 shadow-soft">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400 w-16">ID</th>
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400">Student Info</th>
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400">Parent Info</th>
            <th className="p-4 font-black uppercase tracking-wider text-[10px] text-slate-400">Route Assignment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/50">
          {students.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">No students registered yet.</td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student.id} className="hover:bg-white/40 transition-colors">
                <td className="p-4 font-bold text-slate-400">#{student.id}</td>
                <td className="p-4">
                  <span className="font-semibold text-slate-900 block">{student.name}</span>
                  <span className="text-xs font-bold text-slate-400 block">{student.school}</span>
                </td>
                <td className="p-4">
                  <span className="font-semibold text-slate-700 block">{student.parent_name || "Unassigned"}</span>
                  <span className="text-xs text-slate-400 block">{student.parent_phone}</span>
                </td>
                <td className="p-4 space-y-1">
                  <div className="text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Pickup:</span>
                    <span className="font-semibold text-slate-700">{student.pickup_stop || "Not set"}</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[9px] mr-1">Dropoff:</span>
                    <span className="font-semibold text-slate-700">{student.dropoff_stop || "Not set"}</span>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1420px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Administration</span>
        <h1 className="font-display text-3xl md:text-4xl font-black text-slate-950 tracking-tight">User Management</h1>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-bold text-red-600">
          <XCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("parents")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            activeTab === "parents"
              ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
          }`}
        >
          <Users size={18} /> Parents
        </button>
        <button
          onClick={() => setActiveTab("drivers")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            activeTab === "drivers"
              ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
          }`}
        >
          <Truck size={18} /> Drivers
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
            activeTab === "students"
              ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
              : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
          }`}
        >
          <GraduationCap size={18} /> Students
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500"></div>
          <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Loading records...</p>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {activeTab === "parents" && renderUserTable(parents, "parent")}
          {activeTab === "drivers" && renderUserTable(drivers, "driver")}
          {activeTab === "students" && renderStudentTable()}
        </div>
      )}
    </div>
  );
}
