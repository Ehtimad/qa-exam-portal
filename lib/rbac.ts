export type UserRole = "student" | "admin" | "manager" | "reporter" | "worker";

export const ROLE_LABELS: Record<string, string> = {
  student:  "Tələbə",
  admin:    "Admin",
  manager:  "Menecer",
  reporter: "Reporter",
  worker:   "İşçi",
};

export const ROLE_COLORS: Record<string, string> = {
  admin:    "bg-purple-100 text-purple-700",
  manager:  "bg-blue-100 text-blue-700",
  reporter: "bg-teal-100 text-teal-700",
  worker:   "bg-orange-100 text-orange-700",
  student:  "bg-gray-100 text-gray-600",
};

export function isStaff(role: string | null | undefined): boolean {
  return ["admin", "manager", "reporter", "worker"].includes(role ?? "");
}

export function canManageUsers(role: string): boolean {
  return role === "admin";
}

export function canManageQuestions(role: string): boolean {
  return ["admin", "manager", "worker"].includes(role);
}

export function canManageGroups(role: string): boolean {
  return ["admin", "manager"].includes(role);
}

export function canManageExams(role: string): boolean {
  return ["admin", "manager"].includes(role);
}

export function canViewResults(role: string): boolean {
  return ["admin", "manager", "reporter"].includes(role);
}

export function canExportResults(role: string): boolean {
  return ["admin", "manager", "reporter"].includes(role);
}

export function canViewAnalytics(role: string): boolean {
  return ["admin", "manager", "reporter"].includes(role);
}

export function canDeleteUsers(role: string): boolean {
  return role === "admin";
}

export function canUploadQuestions(role: string): boolean {
  return ["admin", "manager", "worker"].includes(role);
}

export function canAssignRoles(role: string): boolean {
  return role === "admin";
}
