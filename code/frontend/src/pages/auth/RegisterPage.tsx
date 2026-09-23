import { FormEvent, useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { API_BASE_URL } from "../../config/api";
import {
  UserCircle, ShieldCheck, Truck, Camera, ChevronRight, ChevronLeft,
  CheckCircle2, CreditCard, MapPin, Upload, Zap, FileImage
} from "lucide-react";

const SRI_LANKAN_PROVINCES = [
  "Western", "Central", "Southern", "Northern", "Eastern",
  "North Western", "North Central", "Uva", "Sabaragamuwa"
];

const VEHICLE_TYPES = ["Van", "Mini Bus", "Standard Bus"];

interface DriverForm {
  name: string; email: string; password: string; phone: string;
  nic: string; address: string; province: string; dob: string;
  selfie_url: string;
  license_number: string; license_image: string; license_expiry: string;
  vehicle_registration: string; vehicle_type: string; seat_count: number; is_ac: boolean;
}

interface ParentForm {
  name: string; email: string; password: string; phone: string;
  nic: string; address: string; province: string;
  guardian_type: string;
}

const emptyDriverForm: DriverForm = {
  name: "", email: "", password: "", phone: "",
  nic: "", address: "", province: "", dob: "", selfie_url: "",
  license_number: "", license_image: "", license_expiry: "",
  vehicle_registration: "", vehicle_type: "Van", seat_count: 12, is_ac: false,
};

const emptyParentForm: ParentForm = {
  name: "", email: "", password: "", phone: "",
  nic: "", address: "", province: "", guardian_type: "Father",
};

interface InputFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: any) => void;
  placeholder?: string;
  required?: boolean;
  icon?: any;
}

function InputField({ label, id, type = "text", value, onChange, placeholder, required = true, icon: Icon }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]" htmlFor={id}>{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />}
        <input
          id={id} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
          className={`w-full rounded-2xl border border-slate-200 ${Icon ? "pl-14" : "px-5"} pr-5 py-3.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-white`}
        />
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { login, session } = useAuth();

  useEffect(() => {
    if (session) {
      const roleHome: Record<string, string> = {
        admin: "/admin/dashboard",
        driver: "/driver",
        parent: "/parent",
      };
      navigate(roleHome[session.user.role] || "/parent", { replace: true });
    }
  }, [session, navigate]);

  const [role, setRole] = useState<"parent" | "driver" | null>(null);
  const [driverStep, setDriverStep] = useState(1);
  const [driverForm, setDriverForm] = useState<DriverForm>(emptyDriverForm);
  const [parentForm, setParentForm] = useState<ParentForm>(emptyParentForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const selfieInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: "selfie_url" | "license_image") {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDriverForm(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function validateDriverStep(step: number): string | null {
    if (step === 1) {
      if (!driverForm.name.trim() || driverForm.name.length < 3) return "Name must be at least 3 characters.";
      if (!/^\d{9}[VvXx]$|^\d{12}$/.test(driverForm.nic)) return "Enter a valid NIC (e.g., 200012345678 or 123456789V).";
      if (!driverForm.address.trim()) return "Address is required.";
      if (!driverForm.province) return "Please select a province.";
      if (!driverForm.dob) return "Date of birth is required.";
      if (!driverForm.phone || !/^[0-9]{10}$/.test(driverForm.phone)) return "Phone must be 10 digits.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driverForm.email)) return "Enter a valid email.";
      if (!driverForm.password || driverForm.password.length < 6) return "Password must be at least 6 characters.";
    }
    if (step === 2) {
      if (!driverForm.license_number.trim()) return "License number is required.";
      if (!driverForm.license_expiry) return "License expiry date is required.";
    }
    if (step === 3) {
      if (!driverForm.vehicle_registration.trim()) return "Vehicle registration number is required.";
      if (driverForm.seat_count < 1) return "Seat count must be at least 1.";
    }
    return null;
  }

  function validateParentForm(): string | null {
    if (!parentForm.name.trim() || parentForm.name.length < 3) return "Name must be at least 3 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentForm.email)) return "Enter a valid email.";
    if (!parentForm.phone || !/^[0-9]{10}$/.test(parentForm.phone)) return "Phone must be 10 digits.";
    if (!parentForm.password || parentForm.password.length < 6) return "Password must be at least 6 characters.";
    if (!parentForm.nic.trim()) return "NIC is required.";
    if (!parentForm.address.trim()) return "Address is required.";
    if (!parentForm.province) return "Please select a province.";
    return null;
  }

  async function handleDriverSubmit() {
    const err = validateDriverStep(3);
    if (err) { setErrorMessage(err); return; }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...driverForm, role: "driver" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || "Registration failed");
      setRegistrationComplete(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to register");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleParentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const err = validateParentForm();
    if (err) { setErrorMessage(err); return; }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parentForm, role: "parent" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || "Registration failed");
      login({ token: data.token, user: data.user });
      navigate("/parent", { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to register");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Driver registration complete → show pending approval
  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-700">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-amber-50 border-4 border-amber-200 text-amber-500">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Application Submitted!</h1>
          <p className="mt-4 text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            Your driver profile is under review. An admin will verify your details and approve your account. You'll receive an email once approved.
          </p>
          <div className="mt-8 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
            <p className="text-xs font-bold text-amber-700">This usually takes 1–2 business days</p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Role selection screen
  if (!role) {
    return (
      <div className="min-h-screen bg-[#f8f8f6] text-slate-900 flex flex-col justify-center py-12 px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg animate-in fade-in duration-700">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-4 border-emerald-400 bg-white shadow-xl text-3xl font-extrabold text-emerald-600">K</div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">Create your KidsRoute account</h2>
          <p className="mt-2 text-center text-sm text-slate-500">Choose your account type to get started</p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => setRole("parent")}
              className="group p-8 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-500 text-left active:scale-95"
            >
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                <UserCircle size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Parent</h3>
              <p className="mt-2 text-sm text-slate-400 font-medium">Track your child's van in real-time and manage pickups</p>
            </button>

            <button
              onClick={() => setRole("driver")}
              className="group p-8 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 text-left active:scale-95"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                <Truck size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Driver</h3>
              <p className="mt-2 text-sm text-slate-400 font-medium">Manage your van routes, attendance, and payments</p>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // PARENT FORM
  if (role === "parent") {
    return (
      <div className="min-h-screen bg-[#f8f8f6] text-slate-900 flex flex-col justify-center py-12 px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg animate-in fade-in slide-in-from-right-10 duration-500">
          <button onClick={() => setRole(null)} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mb-6">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCircle size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Parent Registration</h2>
              <p className="text-xs text-slate-400 font-bold">Instant access after registration</p>
            </div>
          </div>

          <form onSubmit={handleParentSubmit} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8 space-y-5">
            <InputField label="Full Name" id="p-name" value={parentForm.name} onChange={(e: any) => setParentForm({...parentForm, name: e.target.value})} placeholder="John Doe" icon={UserCircle} />
            <InputField label="Email Address" id="p-email" type="email" value={parentForm.email} onChange={(e: any) => setParentForm({...parentForm, email: e.target.value})} placeholder="john@example.com" />
            <InputField label="Phone Number" id="p-phone" value={parentForm.phone} onChange={(e: any) => setParentForm({...parentForm, phone: e.target.value})} placeholder="0771234567" />
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">Relationship</label>
              <div className="flex gap-3">
                {["Father", "Mother", "Guardian"].map(t => (
                  <button key={t} type="button"
                    onClick={() => setParentForm({...parentForm, guardian_type: t})}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all border ${parentForm.guardian_type === t ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100" : "bg-white text-slate-500 border-slate-100 hover:border-emerald-300"}`}
                  >{t}</button>
                ))}
              </div>
            </div>

            <InputField label="NIC Number" id="p-nic" value={parentForm.nic} onChange={(e: any) => setParentForm({...parentForm, nic: e.target.value})} placeholder="200012345678" icon={CreditCard} />
            <InputField label="Address" id="p-address" value={parentForm.address} onChange={(e: any) => setParentForm({...parentForm, address: e.target.value})} placeholder="123 Main Street, Colombo" icon={MapPin} />

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">Province</label>
              <select value={parentForm.province} onChange={e => setParentForm({...parentForm, province: e.target.value})} required
                className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-white appearance-none">
                <option value="">Select province...</option>
                {SRI_LANKAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <InputField label="Password" id="p-password" type="password" value={parentForm.password} onChange={(e: any) => setParentForm({...parentForm, password: e.target.value})} placeholder="••••••••" />

            {errorMessage && (
              <div className="rounded-2xl bg-red-50 p-4 border border-red-100">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            )}

            <button type="submit" disabled={isSubmitting}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 active:scale-95">
              {isSubmitting ? "Creating account..." : "Create Parent Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DRIVER MULTI-STEP FORM
  return (
    <div className="min-h-screen bg-[#f8f8f6] text-slate-900 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-2xl animate-in fade-in duration-500">
        <button onClick={() => { if (driverStep > 1) setDriverStep(driverStep - 1); else setRole(null); }}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors mb-6">
          <ChevronLeft size={16} /> {driverStep > 1 ? "Previous Step" : "Back"}
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Driver Registration</h2>
            <p className="text-xs text-slate-400 font-bold">Requires admin approval</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex justify-between mb-10 relative">
          <div className="absolute top-[18px] left-0 w-full h-[2px] bg-slate-100 -z-10" />
          <div className="absolute top-[18px] left-0 h-[2px] bg-emerald-500 -z-10 transition-all duration-700" style={{ width: `${(driverStep - 1) * 50}%` }} />
          {[
            { n: 1, label: "Personal Info" },
            { n: 2, label: "Driving Licence" },
            { n: 3, label: "Vehicle Info" },
          ].map(s => (
            <div key={s.n} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 shadow-lg ${
                driverStep === s.n ? "bg-slate-900 text-white scale-110 ring-4 ring-slate-100" :
                driverStep > s.n ? "bg-emerald-500 text-white" : "bg-white text-slate-300 border border-slate-100"
              }`}>
                {driverStep > s.n ? <CheckCircle2 size={20} /> : s.n}
              </div>
              <span className={`mt-3 text-[9px] font-black uppercase tracking-[0.15em] ${driverStep >= s.n ? "text-slate-900" : "text-slate-300"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-8">
          {/* Step 1: Personal Info */}
          {driverStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-10 duration-500">
              <InputField label="Full Name" id="d-name" value={driverForm.name} onChange={(e: any) => setDriverForm({...driverForm, name: e.target.value})} placeholder="Kasun Silva" icon={UserCircle} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField label="NIC Number" id="d-nic" value={driverForm.nic} onChange={(e: any) => setDriverForm({...driverForm, nic: e.target.value})} placeholder="200012345678" icon={CreditCard} />
                <InputField label="Date of Birth" id="d-dob" type="date" value={driverForm.dob} onChange={(e: any) => setDriverForm({...driverForm, dob: e.target.value})} placeholder="" />
              </div>

              <InputField label="Address" id="d-address" value={driverForm.address} onChange={(e: any) => setDriverForm({...driverForm, address: e.target.value})} placeholder="123 Main Street, Colombo" icon={MapPin} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">Province</label>
                  <select value={driverForm.province} onChange={e => setDriverForm({...driverForm, province: e.target.value})} required
                    className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-white appearance-none">
                    <option value="">Select...</option>
                    {SRI_LANKAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <InputField label="Mobile Number" id="d-phone" value={driverForm.phone} onChange={(e: any) => setDriverForm({...driverForm, phone: e.target.value})} placeholder="0771234567" />
              </div>

              {/* Selfie Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">Selfie Photo (Optional)</label>
                <div className="flex items-center gap-4">
                  {driverForm.selfie_url ? (
                    <img src={driverForm.selfie_url} alt="Selfie" className="h-20 w-20 rounded-2xl object-cover border-2 border-emerald-200" />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                      <Camera size={28} />
                    </div>
                  )}
                  <button type="button" onClick={() => selfieInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2">
                    <Upload size={14} /> Upload Photo
                  </button>
                  <input ref={selfieInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "selfie_url")} />
                </div>
              </div>

              <InputField label="Email Address" id="d-email" type="email" value={driverForm.email} onChange={(e: any) => setDriverForm({...driverForm, email: e.target.value})} placeholder="kasun@example.com" />
              <InputField label="Password" id="d-password" type="password" value={driverForm.password} onChange={(e: any) => setDriverForm({...driverForm, password: e.target.value})} placeholder="••••••••" />

              {errorMessage && <div className="rounded-2xl bg-red-50 p-3 border border-red-100"><p className="text-sm font-medium text-red-800">{errorMessage}</p></div>}

              <button type="button" onClick={() => {
                const err = validateDriverStep(1);
                if (err) { setErrorMessage(err); return; }
                setErrorMessage(null);
                setDriverStep(2);
              }} className="group w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-100 hover:bg-emerald-600 hover:shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                Next: Driving Licence <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 2: Driving Licence */}
          {driverStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-10 duration-500">
              <InputField label="Driving Licence Number" id="d-license" value={driverForm.license_number} onChange={(e: any) => setDriverForm({...driverForm, license_number: e.target.value})} placeholder="B1234567" icon={ShieldCheck} />
              <InputField label="Licence Expiry Date" id="d-license-expiry" type="date" value={driverForm.license_expiry} onChange={(e: any) => setDriverForm({...driverForm, license_expiry: e.target.value})} placeholder="" />

              {/* License Image Upload */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">Driving Licence Image (Optional)</label>
                <div className="flex items-center gap-4">
                  {driverForm.license_image ? (
                    <img src={driverForm.license_image} alt="License" className="h-20 w-32 rounded-2xl object-cover border-2 border-blue-200" />
                  ) : (
                    <div className="h-20 w-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                      <FileImage size={28} />
                    </div>
                  )}
                  <button type="button" onClick={() => licenseInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2">
                    <Upload size={14} /> Upload Image
                  </button>
                  <input ref={licenseInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "license_image")} />
                </div>
              </div>

              {errorMessage && <div className="rounded-2xl bg-red-50 p-3 border border-red-100"><p className="text-sm font-medium text-red-800">{errorMessage}</p></div>}

              <button type="button" onClick={() => {
                const err = validateDriverStep(2);
                if (err) { setErrorMessage(err); return; }
                setErrorMessage(null);
                setDriverStep(3);
              }} className="group w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-100 hover:bg-emerald-600 hover:shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-95">
                Next: Vehicle Info <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Step 3: Vehicle Info */}
          {driverStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-10 duration-500">
              <InputField label="Vehicle Registration No" id="d-vehicle" value={driverForm.vehicle_registration} onChange={(e: any) => setDriverForm({...driverForm, vehicle_registration: e.target.value})} placeholder="WP-CAT-9000" icon={Truck} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">Vehicle Type</label>
                  <select value={driverForm.vehicle_type} onChange={e => setDriverForm({...driverForm, vehicle_type: e.target.value})}
                    className="w-full rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all bg-white appearance-none">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <InputField label="Number of Seats" id="d-seats" type="number" value={driverForm.seat_count} onChange={(e: any) => setDriverForm({...driverForm, seat_count: parseInt(e.target.value) || 0})} placeholder="12" />
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input type="checkbox" checked={driverForm.is_ac} onChange={e => setDriverForm({...driverForm, is_ac: e.target.checked})}
                  className="w-6 h-6 rounded-lg border-slate-200 text-emerald-500 focus:ring-emerald-500 transition-all" />
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Air Conditioned (A/C)
                  <Zap className={`transition-all ${driverForm.is_ac ? "text-blue-500 animate-pulse" : "text-slate-200"}`} size={16} />
                </span>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700">⚠️ Students can only board up to the seat count you specify here.</p>
              </div>

              {errorMessage && <div className="rounded-2xl bg-red-50 p-3 border border-red-100"><p className="text-sm font-medium text-red-800">{errorMessage}</p></div>}

              <button type="button" onClick={handleDriverSubmit} disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95">
                {isSubmitting ? "Submitting..." : "Submit Application"} <CheckCircle2 size={22} />
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
