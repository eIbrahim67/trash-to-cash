import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen gap-4 p-4">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
