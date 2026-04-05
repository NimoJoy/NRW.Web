import { requireRole } from "@/lib/auth/session";

type MeterReaderLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function MeterReaderLayout({ children }: MeterReaderLayoutProps) {
  await requireRole("meter_reader");
  return children;
}
