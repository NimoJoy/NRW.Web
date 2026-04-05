import type { AppRole } from "@/lib/auth/types";

export type NavigationSection = {
  title: string;
  items: Array<{
    href: string;
    label: string;
  }>;
};

const adminNavigationSections: NavigationSection[] = [
  {
    title: "General",
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin/accounts", label: "Accounts" },
      { href: "/admin/bills", label: "Bills" },
      { href: "/admin/users", label: "Users" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/map", label: "Map" },
      { href: "/reports", label: "Reports" },
    ],
  },
];

const meterReaderNavigationSections: NavigationSection[] = [
  {
    title: "Meter Reader",
    items: [
      { href: "/meter-reader/search", label: "Search" },
      { href: "/meter-reader/submit", label: "Submit" },
      { href: "/meter-reader/pressure", label: "Pressure" },
    ],
  },
];

export function getNavigationSections(role: AppRole): NavigationSection[] {
  return role === "admin" ? adminNavigationSections : meterReaderNavigationSections;
}
