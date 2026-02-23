export enum EmployeeStatus {
  Shift = 0,
  Absent = 1,
  Break = 2
}

export enum RecyclingStatus {
  Done = 0,
  Pending = 1,
  Error = 2
}

export enum MaterialStatus {
  Active = 0,
  Inactive = 1
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  warehouse: string;
  date: string;
  status: EmployeeStatus;
}

export interface RecyclingProcess {
  id: string;
  employeeId: string;
  userId: string;
  amountGlass: number;
  amountPlastic: number;
  amountCans: number;
  points: number;
  date: string;
  time: string;
  status: RecyclingStatus;
}

export interface Review {
  id: string;
  userName: string;
  email: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Material {
  id: string;
  typeIcon: string;
  name: string;
  status: MaterialStatus;
}

export interface DashboardStats {
  totalEmployees: number;
  recyclingProcessErrors: number;
  totalRecyclingProcess: number;
  starDistribution: number[];
  materialBreakdown: { name: string; value: number; color: string }[];
}

export interface ReportStats {
  recyclingProcessErrors: number;
  totalRecyclingProcess: number;
  totalWithoutErrors: number;
}

export interface ReviewsAnalysis {
  monthly: { month: string; positive: number; negative: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
