export default function LoginPage() {
  return (
    <section className="space-y-5 rounded-lg border border-black/10 p-6">
      <h2 className="text-xl font-semibold">Sign in</h2>

      <form className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-md border border-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <button
          type="button"
          className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Continue
        </button>
      </form>
    </section>
  );
}