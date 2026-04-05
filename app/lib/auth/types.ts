export const appRoles = ["admin", "meter_reader"] as const;

export type AppRole = (typeof appRoles)[number];

export const companyContextCookieName = "nrw_company";

export const supportedCompanies = [
  {
    id: "NRW-WATER-001",
    name: "NRW Water Utility",
  },
] as const;

export type SupportedCompany = (typeof supportedCompanies)[number];
export type SupportedCompanyId = SupportedCompany["id"];

export type UserProfile = {
  userId: string;
  role: AppRole;
  orgId: string | null;
};

export function isAppRole(role: unknown): role is AppRole {
  return typeof role === "string" && appRoles.includes(role as AppRole);
}

export function isSupportedCompanyId(companyId: unknown): companyId is SupportedCompanyId {
  return (
    typeof companyId === "string" && supportedCompanies.some((company) => company.id === companyId)
  );
}

export function getSupportedCompany(companyId: SupportedCompanyId): SupportedCompany {
  return supportedCompanies.find((company) => company.id === companyId) ?? supportedCompanies[0];
}

export function getHomePathForRole(role: AppRole) {
  return role === "admin" ? "/dashboard" : "/meter-reader/search";
}
