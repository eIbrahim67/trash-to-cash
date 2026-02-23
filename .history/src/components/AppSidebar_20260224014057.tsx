import { NavLink, useLocation } from "react-router-dom";
import { Home, FileText, Users, Star, ArrowLeftRight, Layers, LogOut, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/report", label: "Report", icon: FileText },
  { to: "/employees", label: "Employee", icon: Users },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/warehouse-rp", label: "Wearhouse RP", icon: ArrowLeftRight },
  { to: "/materials", label: "Materials", icon: Layers },
];

interface AppSidebarProps {
  onClose?: () => void;
}

export default function AppSidebar({ onClose }: AppSidebarProps) {
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      onClose?.();
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col rounded-2xl bg-card p-5 shadow-sm md:w-56 md:h-auto">
      {/* Close button – mobile only */}
      <button
        onClick={onClose}
        className="mb-2 self-end rounded-lg p-1 text-muted-foreground hover:bg-muted md:hidden"
        aria-label="Close menu"
      >
        <X size={20} />
      </button>

      {/* Logo */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-3xl">♻️</span>
        <div className="leading-tight">
          <span className="text-lg font-extrabold text-primary">TRASH</span>
          <br />
          <span className="text-xs font-bold text-primary">TO CASH</span>
        </div>
      </div>

      <p className="mb-3 text-sm font-bold text-foreground">Admin</p>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
            >
              <Icon size={20} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </aside>
  );
}
