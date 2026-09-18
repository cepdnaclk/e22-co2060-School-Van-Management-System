import React, { useEffect, useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import {
  Bell,
  BusFront,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Truck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { getHomePath } from "../features/auth/navigation";
import { APP_SETTINGS_EVENT, applyAppSettings, readAppSettings } from "../features/settings/appSettings";
import { getParentNotifications } from "../services/parentService";

export default function SidebarLayout() {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settings, setSettings] = useState(() => readAppSettings());
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    if (user?.role !== "parent") {
      setNotifications([]);
      return;
    }

    getParentNotifications()
      .then((items) => mounted && setNotifications(items.slice(0, 6)))
      .catch(() => mounted && setNotifications([]));

    return () => {
      mounted = false;
    };
  }, [user?.role]);

  useEffect(() => {
    applyAppSettings(settings);

    const handleSettingsChange = () => setSettings(readAppSettings());
    window.addEventListener(APP_SETTINGS_EVENT, handleSettingsChange);
    window.addEventListener("storage", handleSettingsChange);

    return () => {
      window.removeEventListener(APP_SETTINGS_EVENT, handleSettingsChange);
      window.removeEventListener("storage", handleSettingsChange);
    };
  }, [settings]);

  const displayName = user?.name || user?.email?.split("@")[0] || "Account";
  const initials = (user?.name || user?.email || user?.role || "U")
    .split(/[ @.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  return (
    <div className="app-surface flex h-screen w-screen text-slate-800 overflow-hidden font-sans relative">
      {/* Mobile Sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={closeMobileSidebar}
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isSidebarCollapsed ? "lg:w-24" : "lg:w-72"}
        fixed inset-y-0 left-0 z-40 lg:static
        w-72 flex flex-col
        glass-card border-r border-white/70 shadow-soft
        transition-all duration-300
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className={`p-5 flex items-center ${isSidebarCollapsed ? "lg:justify-center" : "gap-4"} mb-2 justify-between lg:justify-start`}>
          <div className="flex items-center gap-4">
            <Link
              to={getHomePath(user?.role)}
              onClick={closeMobileSidebar}
              className="flex items-center gap-4 rounded-2xl transition hover:opacity-80"
              aria-label="Go to home dashboard"
            >
              <div className="bg-slate-950 p-2.5 rounded-2xl shadow-lg shadow-slate-300/60 flex items-center justify-center shrink-0">
                <BusFront className="text-white w-6 h-6" />
              </div>
              <div className={isSidebarCollapsed ? "lg:hidden" : "min-w-0"}>
                <span className="font-display block font-black text-2xl text-slate-950 leading-none">KidsRoute</span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1 block">School Van System</span>
              </div>
            </Link>
          </div>
          {/* Close button for mobile drawer */}
          <button
            onClick={closeMobileSidebar}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 lg:hidden hover:bg-slate-200 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <button
          onClick={() => setIsSidebarCollapsed((value) => !value)}
          className={`mx-4 mb-4 hidden lg:flex h-11 items-center justify-center gap-3 rounded-2xl border border-white/80 bg-white/65 text-sm font-black text-slate-600 shadow-soft transition hover:bg-white ${isSidebarCollapsed ? "px-0" : "px-4"}`}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          {!isSidebarCollapsed && <span>Collapse</span>}
        </button>

        <nav className={`${isSidebarCollapsed ? "lg:px-3" : "lg:px-4"} px-4 flex-1 overflow-y-auto space-y-1.5 scrollbar-hide`}>
          {user?.role === "admin" && (
            <>
              <SectionLabel label="Operations" collapsed={isSidebarCollapsed} />
              <NavItem to="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/admin/users" icon={<Users size={20} />} label="User Management" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/admin/vehicles" icon={<Truck size={20} />} label="Vehicles" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/routes" icon={<Navigation size={20} />} label="Route Map" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
            </>
          )}

          {user?.role === "driver" && (
            <>
              <SectionLabel label="Driver Menu" collapsed={isSidebarCollapsed} />
              <NavItem to="/driver" icon={<Truck size={20} />} label="Home Dashboard" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/driver/attendance" icon={<ClipboardList size={20} />} label="Attendance History" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/driver/announce" icon={<Megaphone size={20} />} label="Announcements" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              
              <SectionLabel label="Payments" collapsed={isSidebarCollapsed} />
              <NavItem to="/driver/payments" icon={<CreditCard size={20} />} label="Student Dues" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/driver/payments/history" icon={<History size={20} />} label="Payment History" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
            </>
          )}

          {user?.role === "parent" && (
            <>
              <SectionLabel label="Parent Menu" collapsed={isSidebarCollapsed} />
              <NavItem to="/parent" icon={<LayoutDashboard size={20} />} label="Home" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/parent/children" icon={<Users size={20} />} label="My Children" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/tracking" icon={<MapPin size={20} />} label="Track Van" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/parent/payments" icon={<CreditCard size={20} />} label="Fee Management" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
              <NavItem to="/parent/history" icon={<History size={20} />} label="Trip History" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
            </>
          )}
        </nav>
        
        <div className={`${isSidebarCollapsed ? "lg:p-4" : "lg:p-6"} p-6 border-t border-white/70 mt-auto`}>
          <Link
            to="/profile"
            onClick={closeMobileSidebar}
            className={`flex items-center ${isSidebarCollapsed ? "lg:justify-center lg:p-2" : "gap-3 p-3"} p-3 bg-white/55 rounded-2xl border border-white/80 mb-3 shadow-soft transition hover:bg-white`}
            title="Open profile"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-950 shadow-sm text-white font-black flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className={isSidebarCollapsed ? "lg:hidden" : "overflow-hidden min-w-0"}>
              <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user?.role}</p>
            </div>
          </Link>

          <div className="mb-2 space-y-1">
            <NavItem to="/profile" icon={<UserCircle size={18} />} label="Profile" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
            <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" collapsed={isSidebarCollapsed} onClick={closeMobileSidebar} />
          </div>
          
          <button 
            onClick={logout}
            className={`flex items-center ${isSidebarCollapsed ? "lg:justify-center lg:px-0" : "gap-3 px-4"} gap-3 px-4 w-full py-3 text-sm font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group`}
            title="Sign Out"
          >
            <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
            <span className={isSidebarCollapsed ? "lg:hidden" : ""}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="sticky top-0 z-30 px-6 pt-5 lg:px-10">
          <div className="liquid-glass mx-auto flex max-w-[1420px] items-center justify-between overflow-visible rounded-[1.5rem] px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Hamburger menu */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/65 text-slate-700 shadow-soft transition hover:bg-white lg:hidden shrink-0"
                aria-label="Open sidebar"
              >
                <PanelLeftOpen size={20} />
              </button>
              
              <div className="flex min-w-0 flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Welcome back</span>
                <span className="font-display truncate text-lg font-black text-slate-950">{displayName}</span>
              </div>
            </div>

            <div className="relative flex items-center gap-3">
              <button
                onClick={() => {
                  setShowNotifications((value) => !value);
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/65 text-slate-700 shadow-soft transition hover:bg-white"
                aria-label="Open notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <Link
                to="/profile"
                onClick={() => setShowNotifications(false)}
                className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/65 py-1.5 pl-1.5 pr-3 text-left shadow-soft transition hover:bg-white"
                aria-label="Open profile section"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">{initials}</span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-36 truncate text-sm font-black text-slate-900">{displayName}</span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {settings.showEmailInProfile ? user?.email || user?.role : user?.role}
                  </span>
                </span>
              </Link>

              {showNotifications && (
                <div className="absolute right-0 top-14 z-50 w-[min(92vw,380px)] rounded-[1.75rem] border border-white/80 bg-white p-4 shadow-2xl shadow-slate-300/50">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-xl font-black text-slate-950">Notifications</h2>
                      <p className="text-xs font-bold text-slate-400">{unreadCount} unread updates</p>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="rounded-xl bg-slate-100 p-2 text-slate-500">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div key={item.id} className={`rounded-2xl border p-4 ${item.is_read ? "border-slate-100 bg-slate-50/70" : "border-emerald-100 bg-emerald-50/70"}`}>
                          <p className="text-sm font-bold leading-relaxed text-slate-800">{item.message}</p>
                          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-8 text-center">
                        <Bell className="mx-auto mb-3 text-slate-300" size={32} />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No alerts yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1420px] px-6 py-8 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed?: boolean }) {
  if (collapsed) return <div className="mt-6" />;

  return (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-8 mb-3 px-4">
      {label}
    </p>
  );
}

function NavItem({
  to,
  icon,
  label,
  collapsed,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end
      title={label}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center ${collapsed ? "lg:justify-center lg:px-0" : "gap-4 px-4"} py-3.5 rounded-2xl transition-all duration-300 font-bold ${
          isActive
            ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200/80 translate-x-1"
            : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
        }`
      }
    >
      <div className="shrink-0 transition-transform duration-500 group-hover:scale-110">
        {icon}
      </div>
      <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
    </NavLink>
  );
}
