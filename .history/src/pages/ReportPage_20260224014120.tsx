import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ReportStats, RecyclingProcess } from "@/types";
import { RecyclingStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { Search, Filter, Download } from "lucide-react";

export default function ReportPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [processes, setProcesses] = useState<RecyclingProcess[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "done" | "pending" | "error">("all");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const transactionsRef = collection(db, "recycle_transactions");
        const querySnapshot = await getDocs(transactionsRef);

        let errorCount = 0;
        const data: any[] = querySnapshot.docs.map(doc => {
          const docData = doc.data();
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

          const glassPoints = glass * 2;
          const plasticPoints = plastic * 3;
          const cansPoints = cans * 5;
          const calculatedPoints = glassPoints + plasticPoints + cansPoints;

          const status = docData.status ?? RecyclingStatus.Done;
          if (status === RecyclingStatus.Error) errorCount++;

          const dateObj = timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate() : null;

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
            status: status,
            _timestamp: dateObj ? dateObj.getTime() : 0
          };
        });

        // Sort by timestamp newest first
        const sortedData = [...data].sort((a: any, b: any) => b._timestamp - a._timestamp);
        setProcesses(sortedData);

        // Calculate Stats
        const totalCount = sortedData.length;
        setStats({
          recyclingProcessErrors: errorCount,
          totalRecyclingProcess: totalCount,
          totalWithoutErrors: totalCount - errorCount
        });

      } catch (error) {
        console.error("Error fetching report data from Firestore:", error);
      }
    };

    fetchReports();
  }, []);

  const statusFilterMap: Record<string, RecyclingStatus | null> = {
    all: null,
    done: RecyclingStatus.Done,
    pending: RecyclingStatus.Pending,
    error: RecyclingStatus.Error,
  };

  const filtered = processes.filter((p) => {
    const matchesSearch = p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const statusFilter = statusFilterMap[filterStatus];
    const matchesStatus = statusFilter === null || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = ["ID", "Employee ID", "User ID", "Glass", "Plastic", "Cans", "Points", "Date", "Time", "Status"];
    const statusLabel = (s: RecyclingStatus) =>
      s === RecyclingStatus.Done ? "Done" : s === RecyclingStatus.Pending ? "Pending" : "Error";
    const rows = filtered.map((p) => [
      p.id, p.employeeId, p.userId,
      p.amountGlass, p.amountPlastic, p.amountCans,
      p.points, p.date, p.time, statusLabel(p.status),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!stats) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-1 sm:flex-none items-center gap-2 rounded-lg border bg-card px-3 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Recycling Process\nErrors", value: stats.recyclingProcessErrors, color: "text-destructive" },
          { label: "Total Recycling\nProcess", value: stats.totalRecyclingProcess, color: "text-primary" },
          { label: "Total Recycling\nProcess without errors", value: stats.totalWithoutErrors, color: "text-primary" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-6 text-center">
            <p className="whitespace-pre-line text-sm font-bold text-card-foreground">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
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
