import { useEffect, useState } from "react";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Employee, EmployeeStatus, RecyclingProcess, RecyclingStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Star } from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseItems(items: any[]): { glass: number; plastic: number; cans: number } {
  let glass = 0, plastic = 0, cans = 0;
  if (Array.isArray(items)) {
    items.forEach((item: any) => {
      const count = item.count || 0;
      const key = (item.itemKey || "").toLowerCase();
      if (key.startsWith("glass")) glass += count;
      else if (key.startsWith("plastic")) plastic += count;
      else if (key.startsWith("cans")) cans += count;
    });
  }
  return { glass, plastic, cans };
}

function toDateString(timestamp: any) {
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString();
  }
  return "N/A";
}

function toTimeString(timestamp: any) {
  if (timestamp && typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return "N/A";
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HomePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [processes, setProcesses] = useState<RecyclingProcess[]>([]);
  const [materialChart, setMaterialChart] = useState<{ name: string; value: number; color: string }[]>([]);
  const [starDistribution, setStarDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const [recyclingErrors, setRecyclingErrors] = useState(0);
  const [recyclingTotal, setRecyclingTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ── 1. Employees ──
        const empSnap = await getDocs(query(collection(db, "users"), where("role", "==", "employ")));
        const empData: Employee[] = empSnap.docs.map(doc => {
          const d = doc.data();
          const createdAt = d.createdAt as Timestamp;
          return {
            id: d.userId || doc.id,
            name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Unknown",
            email: d.email || "",
            phone: d.phone || "",
            warehouse: "N/A",
            date: createdAt ? createdAt.toDate().toLocaleDateString() : "N/A",
            status: EmployeeStatus.Shift,
          };
        });
        setEmployees(empData);

        // ── 2. Recycling Transactions ──
        const txSnap = await getDocs(collection(db, "recycle_transactions"));
        let totalGlass = 0, totalPlastic = 0, totalCans = 0, errors = 0;

        const txData: any[] = txSnap.docs.map(doc => {
          const d = doc.data();
          const ts = d.scannedAt || d.timestamp || d.createdAt;
          const { glass, plastic, cans } = parseItems(d.items || []);
          totalGlass += glass;
          totalPlastic += plastic;
          totalCans += cans;

          const status = d.status ?? RecyclingStatus.Done;
          if (status === RecyclingStatus.Error) errors++;

          const calcPoints = glass * 2 + plastic * 3 + cans * 5;
          const dateObj = ts && typeof ts.toDate === "function" ? ts.toDate() : null;

          return {
            id: doc.id,
            employeeId: d.employee_id || d.employeeId || "N/A",
            userId: d.user_id || d.userId || "N/A",
            amountGlass: glass,
            amountPlastic: plastic,
            amountCans: cans,
            points: calcPoints || d.points || 0,
            date: dateObj ? dateObj.toLocaleDateString() : "N/A",
            time: dateObj ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A",
            status,
            _timestamp: dateObj ? dateObj.getTime() : 0,
          };
        });

        const sortedTx = txData.sort((a, b) => b._timestamp - a._timestamp);
        setProcesses(sortedTx);
        setRecyclingTotal(sortedTx.length);
        setRecyclingErrors(errors);

        // Material donut chart
        setMaterialChart([
          { name: "Glass", value: totalGlass, color: "#60a5fa" },
          { name: "Plastic", value: totalPlastic, color: "#34d399" },
          { name: "Cans", value: totalCans, color: "#f59e0b" },
        ]);

        // ── 3. Reviews ──
        const reviewSnap = await getDocs(collection(db, "reviews"));
        const stars = [0, 0, 0, 0, 0];
        reviewSnap.docs.forEach(doc => {
          const rating = doc.data().rating as number;
          if (rating >= 1 && rating <= 5) stars[rating - 1]++;
        });
        setStarDistribution(stars);

      } catch (error) {
        console.error("Error loading home page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Top row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Material Donut Chart */}
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="mb-4 text-center font-bold text-card-foreground">Materials Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={materialChart} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {materialChart.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex justify-center gap-4">
            {materialChart.map((m) => (
              <div key={m.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: m.color }} />
                {m.name}: {m.value}
              </div>
            ))}
          </div>
        </div>

        {/* Customer Analysis */}
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="mb-4 font-bold text-card-foreground">Customer Analysis</h3>
          <div className="mb-6 flex flex-wrap gap-2">
            {starDistribution.map((count, i) => (
              <div key={i} className="flex flex-1 flex-col items-center rounded-lg border p-2">
                <span className="text-sm font-bold">{count}</span>
                <div className="flex">
                  {Array.from({ length: i + 1 }).map((_, j) => (
                    <Star key={j} size={12} className="fill-warning text-warning" />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">STARS</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm font-bold text-card-foreground">Recycling Process Errors</p>
              <p className="text-2xl font-bold text-destructive">{recyclingErrors}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-card-foreground">Total Recycling Process</p>
              <p className="text-2xl font-bold text-primary">{recyclingTotal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee table */}
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-4 font-bold text-card-foreground">Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Phone</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium text-card-foreground">{emp.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.email}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.phone}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{emp.date}</td>
                  <td className="py-3"><StatusBadge status={emp.status} type="employee" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recycling Process table */}
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-4 font-bold text-card-foreground">Recycling Process</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">ID_EMP</th>
                <th className="pb-2 pr-4">ID_User</th>
                <th className="pb-2 pr-4">Glass</th>
                <th className="pb-2 pr-4">Plastic</th>
                <th className="pb-2 pr-4">Cans</th>
                <th className="pb-2 pr-4">Points</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium text-card-foreground">{p.id}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.employeeId}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.userId}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.amountGlass}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.amountPlastic}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.amountCans}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.points}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.date}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.time}</td>
                  <td className="py-3"><StatusBadge status={p.status} type="recycling" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
