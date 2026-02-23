import { useEffect, useState } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Employee, EmployeeStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Pencil, Trash2, Search, Filter, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmployeePage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", warehouse: "", date: "", status: EmployeeStatus.Shift });
  const [filterStatus, setFilterStatus] = useState<"all" | "shift" | "absent" | "break">("all");
  const [showFilter, setShowFilter] = useState(false);

  const load = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "employ"));
      const querySnapshot = await getDocs(q);

      const employeeData: Employee[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp;
        return {
          id: data.userId || doc.id,
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Unknown",
          email: data.email || "",
          phone: data.phone || "",
          warehouse: "N/A", // Not in firestore schema provided
          date: createdAt ? createdAt.toDate().toLocaleDateString() : "N/A",
          status: EmployeeStatus.Shift // Defaulting as not in firestore schema provided
        };
      });

      setEmployees(employeeData);
    } catch (error) {
      console.error("Error fetching employees from Firestore:", error);
    }
  };

  useEffect(() => { load(); }, []);

  const statusFilterMap: Record<string, EmployeeStatus | null> = {
    all: null,
    shift: EmployeeStatus.Shift,
    absent: EmployeeStatus.Absent,
    break: EmployeeStatus.Break,
  };

  const filtered = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusFilter = statusFilterMap[filterStatus];
    const matchesStatus = statusFilter === null || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", warehouse: "", date: new Date().toLocaleDateString(), status: EmployeeStatus.Shift });
    setDialogOpen(true);
  };

  const openEdit = () => {
    if (selected.size !== 1) return;
    const emp = employees.find((e) => selected.has(e.id));
    if (!emp) return;
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, phone: emp.phone, warehouse: emp.warehouse, date: emp.date, status: emp.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Note: Implementing Firestore writes would require knowing the 'users' collection schema for updates/creates
    // For now, we are focusing on reading employee data as requested.
    console.log("Firestore writes not implemented in this step", form);
    setDialogOpen(false);
    setSelected(new Set());
    load();
  };

  const handleDelete = async () => {
    console.log("Firestore deletes not implemented in this step", Array.from(selected));
    setSelected(new Set());
    load();
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openAdd} className="gap-1"><Plus size={16} /> Add</Button>
        <Button variant="outline" onClick={openEdit} disabled={selected.size !== 1} className="gap-1 border-primary text-primary"><Pencil size={16} /> Edit</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={selected.size === 0} className="gap-1"><Trash2 size={16} /> Delete</Button>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Search size={16} className="text-muted-foreground" />
            <input className="bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className="flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted"
            >
              <Filter size={14} /> Filter
              {filterStatus !== "all" && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                  {filterStatus}
                </span>
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 top-10 z-10 w-36 rounded-xl border bg-card shadow-md">
                {(["all", "shift", "absent", "break"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setFilterStatus(s); setShowFilter(false); }}
                    className={`w-full px-4 py-2 text-left text-sm capitalize hover:bg-muted first:rounded-t-xl last:rounded-b-xl ${filterStatus === s ? "font-bold text-primary" : "text-card-foreground"
                      }`}
                  >
                    {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => navigate("/profile")} className="rounded-full border p-2 text-muted-foreground hover:bg-muted transition-colors"><User size={18} /></button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4 w-8"></th>
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Phone</th>
                <th className="pb-2 pr-4">Wearhouse</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <input type="checkbox" checked={selected.has(emp.id)} onChange={() => toggleSelect(emp.id)} className="accent-primary" />
                  </td>
                  <td className="py-3 pr-4 font-medium text-card-foreground">{emp.id}</td>
                  <td className="py-3 pr-4 text-card-foreground">{emp.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.email}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.phone}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.warehouse}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.date}</td>
                  <td className="py-3"><StatusBadge status={emp.status} type="employee" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Warehouse" value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} />
            <Select value={String(form.status)} onValueChange={(v) => setForm({ ...form, status: Number(v) as EmployeeStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={String(EmployeeStatus.Shift)}>Shift</SelectItem>
                <SelectItem value={String(EmployeeStatus.Absent)}>Absent</SelectItem>
                <SelectItem value={String(EmployeeStatus.Break)}>Break</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
