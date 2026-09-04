export default function InvoiceLoading() {
  return (
    <section aria-busy="true" aria-labelledby="invoice-loading-heading" aria-live="polite">
      <p className="text-primary-700 text-sm font-semibold tracking-[0.14em] uppercase">
        Workspace
      </p>
      <h1
        className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl"
        id="invoice-loading-heading"
      >
        Loading invoices
      </h1>
      <p className="mt-3 text-base leading-7 text-neutral-600" role="status">
        Fetching the latest invoices for this list state.
      </p>

      <div
        aria-hidden="true"
        className="mt-7 rounded-lg bg-white p-4 shadow-md ring-1 ring-neutral-950/5 sm:p-5"
      >
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-200 motion-reduce:animate-none" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="h-11 animate-pulse rounded-md bg-neutral-100 motion-reduce:animate-none"
              key={item}
            />
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="mt-8 space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-200 motion-reduce:animate-none" />
        {[0, 1, 2].map((item) => (
          <div
            className="h-28 animate-pulse rounded-lg bg-white ring-1 ring-neutral-950/5 motion-reduce:animate-none"
            key={item}
          />
        ))}
      </div>
    </section>
  );
}
