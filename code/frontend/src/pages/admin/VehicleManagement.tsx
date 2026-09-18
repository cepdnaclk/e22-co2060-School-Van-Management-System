import { useEffect, useState } from "react";
import { Truck, Plus, Trash2, Edit2, AlertCircle, X, ShieldCheck } from "lucide-react";
import { getVehicles } from "../../services/route.service";
import { createVehicle, updateVehicle, deleteVehicle } from "../../services/adminService";

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    vehicle_number: "",
    type: "Van",
    capacity: 15,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getVehicles();
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, formData);
      } else {
        await createVehicle(formData);
      }
      setIsModalOpen(false);
      setEditingVehicle(null);
      setFormData({ vehicle_number: "", type: "Van", capacity: 15 });
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to save vehicle");
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      type: vehicle.type,
      capacity: vehicle.capacity,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteVehicle(id);
        loadData();
      } catch (err: any) {
        setError(err.message || "Failed to delete vehicle");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-[1420px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Fleet Operations</span>
          <h1 className="font-display text-3xl md:text-4xl font-black text-slate-950 tracking-tight">Vehicle Management</h1>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setFormData({ vehicle_number: "", type: "Van", capacity: 15 });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-[2rem] bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-emerald-600 hover:shadow-emerald-200"
        >
          <Plus size={18} />
          Register Vehicle
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-sm font-bold text-red-600">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vehicles Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500"></div>
          <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Loading fleet data...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="glass-card rounded-[1.75rem] p-12 text-center border border-white/60 shadow-soft">
          <Truck className="mx-auto mb-4 text-slate-300" size={48} />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">No vehicles registered</h2>
          <p className="mt-2 text-sm font-bold text-slate-400 max-w-sm mx-auto">Register your first vehicle to start assigning them to routes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="glass-card p-6 rounded-[1.75rem] border border-white/60 shadow-soft hover:-translate-y-1 transition-transform duration-300 flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Truck size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{vehicle.type}</span>
                    <span className="text-xl font-black text-slate-900 uppercase tracking-tight block">{vehicle.vehicle_number}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50/50 rounded-[1.25rem] border border-slate-100 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacity</span>
                </div>
                <span className="text-lg font-black text-slate-900">{vehicle.capacity} Seats</span>
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 text-xs font-bold hover:text-emerald-600 hover:border-emerald-100 transition-colors"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 text-xs font-bold hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-8 py-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingVehicle ? "Edit Vehicle" : "Register Vehicle"}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">License Plate</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. NB-1234"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all uppercase"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all appearance-none"
                  >
                    <option value="Van">Van</option>
                    <option value="Bus">Bus</option>
                    <option value="Mini-Bus">Mini-Bus</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Capacity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full mt-4 rounded-[2rem] bg-emerald-600 py-4 text-sm font-black text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                {editingVehicle ? "Update Fleet Record" : "Confirm Registration"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
