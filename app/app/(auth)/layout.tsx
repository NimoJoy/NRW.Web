type AuthLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">{children}</div>
    </div>
  );
}
