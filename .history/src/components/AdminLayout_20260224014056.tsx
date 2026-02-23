import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Menu } from "lucide-react";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen gap-4 p-4">
      {/* Mobile hamburger button */}
      <button
        className="fixed left-4 top-4 z-50 flex items-center justify-center rounded-xl bg-card p-2 shadow-md md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, inline on md+ */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:static md:translate-x-0 md:z-auto md:transition-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
