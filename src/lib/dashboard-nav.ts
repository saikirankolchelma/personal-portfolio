export const dashboardNav = [
  { href: "/dashboard", label: "Overview", icon: "layout" },
  { href: "/dashboard/tasks", label: "Tasks", icon: "checklist" },
  { href: "/dashboard/assistant", label: "Work assistant", icon: "bot" },
  { href: "/dashboard/inquiries", label: "Inquiries", icon: "inbox" },
] as const;

export type DashboardNavItem = (typeof dashboardNav)[number];

/** Enum values paired with the labels shown in the UI. */
export const taskStatusLabels = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
  ARCHIVED: "Archived",
} as const;

export const taskCategoryLabels = {
  WORK: "Work",
  LEARNING: "Learning",
  FREELANCING: "Freelancing",
  PERSONAL_PROJECT: "Personal project",
  DSA: "DSA",
  AI_ML: "AI/ML",
  RESEARCH: "Research",
  OTHER: "Other",
} as const;

export const taskPriorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
} as const;
