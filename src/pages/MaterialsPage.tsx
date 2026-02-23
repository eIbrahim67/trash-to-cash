import { useState } from "react";
import type { Material } from "@/types";
import { MaterialStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MATERIALS: Material[] = [
  { id: "1", typeIcon: "🪟", name: "Glass", status: MaterialStatus.Active },
  { id: "2", typeIcon: "🧴", name: "Plastic", status: MaterialStatus.Active },
  { id: "3", typeIcon: "🥫", name: "Cans", status: MaterialStatus.Active },
];

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [materials] = useState<Material[]>(MATERIALS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button onClick={() => navigate("/profile")} className="rounded-full border p-2 text-muted-foreground hover:bg-muted transition-colors"><User size={18} /></button>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Materials</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium text-card-foreground">{m.id}</td>
                  <td className="py-3 pr-4 text-2xl">{m.typeIcon}</td>
                  <td className="py-3 pr-4 text-card-foreground">{m.name}</td>
                  <td className="py-3"><StatusBadge status={m.status} type="material" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
