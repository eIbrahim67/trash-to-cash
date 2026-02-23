import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RecyclingProcess, RecyclingStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { Search, Filter, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WarehouseRPPage() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<RecyclingProcess[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactionsRef = collection(db, "recycle_transactions");
        // Remove orderBy to prevent empty results if index is missing or field is missing in some docs
        const querySnapshot = await getDocs(transactionsRef);

        const data: any[] = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          // Use scannedAt as the primary timestamp field
          const timestamp = (docData.scannedAt || docData.timestamp || docData.createdAt) as Timestamp;
          const items = docData.items || [];

          let glass = 0;
          let plastic = 0;
          let cans = 0;

          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              const count = item.count || 0;
              const key = (item.itemKey || "").toLowerCase();
              if (key.startsWith("glass")) glass += count;
              else if (key.startsWith("plastic")) plastic += count;
              else if (key.startsWith("cans")) cans += count;
            });
          }

          const dateObj = timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate() : null;

          const glassPoints = glass * 2;
          const plasticPoints = plastic * 3;
          const cansPoints = cans * 5;
          const calculatedPoints = glassPoints + plasticPoints + cansPoints;

          return {
            id: doc.id,
            employeeId: docData.employee_id || docData.employeeId || "N/A",
            userId: docData.user_id || docData.userId || "N/A",
            amountGlass: glass,
            amountPlastic: plastic,
            amountCans: cans,
            points: calculatedPoints || docData.points || 0,
            date: dateObj ? dateObj.toLocaleDateString() : "N/A",
            time: dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
            status: docData.status ?? RecyclingStatus.Done,
            _timestamp: dateObj ? dateObj.getTime() : 0 // Internal field for sorting
          };
        });

        // Sort in memory (newest first)
        data.sort((a: any, b: any) => b._timestamp - a._timestamp);

        setProcesses(data);
      } catch (error) {
        console.error("Error fetching recycle transactions:", error);
      }
    };

    fetchTransactions();
  }, []);

  const [filterStatus, setFilterStatus] = useState<"all" | "done" | "pending" | "error">("all");
  const [showFilter, setShowFilter] = useState(false);

  const statusFilterMap: Record<string, RecyclingStatus | null> = {
    all: null,
    done: RecyclingStatus.Done,
    pending: RecyclingStatus.Pending,
    error: RecyclingStatus.Error,
  };

  const filtered = processes.filter((p) => {
    const matchesSearch = Object.values(p).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
    const statusFilter = statusFilterMap[filterStatus];
    const matchesStatus = statusFilter === null || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-3">
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
              {(["all", "done", "pending", "error"] as const).map((s) => (
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

      {/* Table */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">ID_EMP</th>
                <th className="pb-2 pr-4">ID_User</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4"></th>
                <th className="pb-2 pr-4"></th>
                <th className="pb-2 pr-4">Points</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium text-card-foreground">{p.id}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.employeeId}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.userId}</td>
                  <td className="py-3 pr-4 text-muted-foreground">Glass: {p.amountGlass}</td>
                  <td className="py-3 pr-4 text-muted-foreground">Plastic: {p.amountPlastic}</td>
                  <td className="py-3 pr-4 text-muted-foreground">Cans: {p.amountCans}</td>
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
