import { cn } from "@/lib/utils";
import { EmployeeStatus, RecyclingStatus, MaterialStatus } from "@/types";

type StatusValue = EmployeeStatus | RecyclingStatus | MaterialStatus | string | number;

const statusMap: Record<string, { label: string; variant: string }> = {
  // Employee
  [`employee_${EmployeeStatus.Shift}`]: { label: "Shift", variant: "bg-primary text-primary-foreground" },
  [`employee_${EmployeeStatus.Absent}`]: { label: "Absent", variant: "bg-warning text-warning-foreground" },
  [`employee_${EmployeeStatus.Break}`]: { label: "Break", variant: "bg-warning text-warning-foreground" },
  // Recycling
  [`recycling_${RecyclingStatus.Done}`]: { label: "Done", variant: "bg-success text-success-foreground" },
  [`recycling_${RecyclingStatus.Pending}`]: { label: "Pending", variant: "bg-muted text-muted-foreground" },
  [`recycling_${RecyclingStatus.Error}`]: { label: "Error", variant: "bg-destructive text-destructive-foreground" },
  // Material
  [`material_${MaterialStatus.Active}`]: { label: "Active", variant: "bg-success text-success-foreground" },
  [`material_${MaterialStatus.Inactive}`]: { label: "Inactive", variant: "bg-muted text-muted-foreground" },
};

export default function StatusBadge({ status, type = "employee" }: { status: StatusValue; type?: "employee" | "recycling" | "material" }) {
  const key = `${type}_${status}`;
  const config = statusMap[key] || { label: String(status), variant: "bg-muted text-muted-foreground" };

  return (
    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-semibold", config.variant)}>
      {config.label}
    </span>
  );
}
