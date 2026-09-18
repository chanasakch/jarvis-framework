# React / TypeScript Coding Standards

Purpose: enforce type safety, predictable state ownership, and accessible, performant UI.
Scope: all code under `apps/web/src/`.
Out of scope: build tooling, CSS methodology, backend code (see `coding-go.md`).

### RX-01 — No `any` (MUST)
TypeScript runs in `strict` mode and no file declares `: any` or casts with `as any`.

✅
```tsx
function getUserName(user: User): string {
  return user.name;
}
```
❌
```tsx
function getUserName(user: any): string {
  return user.name;
}
```

### RX-02 — Feature-folder structure (MUST)
Every feature lives under `apps/web/src/features/<feature>/` with its own `components`, `hooks`, `api`, `schemas`, `__tests__`, per `.jarvis/standards/structure.md`.

✅
```tsx
// apps/web/src/features/invoices/hooks/useInvoice.ts
export function useInvoice(id: string) { /* ... */ }
```
❌
```tsx
// apps/web/src/components/InvoiceStuffMisc.tsx
export function useInvoice(id: string) { /* ... */ }
```

### RX-03 — TanStack Query for server state (MUST)
All server data is fetched and cached through TanStack Query; no server-derived data is written into Zustand, Redux, or any other global store.

✅
```tsx
function useInvoices() {
  return useQuery({ queryKey: invoiceKeys.list(), queryFn: fetchInvoices });
}
```
❌
```tsx
const useInvoiceStore = create<InvoiceStore>((set) => ({
  invoices: [],
  setInvoices: (invoices) => set({ invoices }), // server data in global store
}));
```

### RX-04 — Typed, centralised query keys (MUST)
Each feature exports one typed query-key factory (`<feature>/api/query-keys.ts`); no inline array literals as query keys elsewhere.

✅
```tsx
// features/invoices/api/query-keys.ts
export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (filter?: InvoiceFilter) => [...invoiceKeys.all, "list", filter] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};
```
❌
```tsx
useQuery({ queryKey: ["invoices", id], queryFn: () => fetchInvoice(id) });
```

### RX-05 — Zod at every boundary (MUST)
Every form input and every API response is parsed with a Zod schema at the boundary; the TS type is inferred from the schema, never hand-written alongside it.

✅
```tsx
export const invoiceSchema = z.object({ id: z.string(), total: z.number() });
export type Invoice = z.infer<typeof invoiceSchema>;

const invoice = invoiceSchema.parse(await res.json());
```
❌
```tsx
interface Invoice { id: string; total: number; }
const invoice = (await res.json()) as Invoice; // unparsed, unchecked
```

### RX-06 — Errors via message-key map only (MUST)
UI never renders a raw backend `error.message`; it maps the public error code to copy through `lib/error-messages.ts`, per `.jarvis/standards/error-handling.md`.

✅
```tsx
import { errorMessages } from "@/lib/error-messages";

toast.error(errorMessages[error.code] ?? errorMessages.UNKNOWN);
```
❌
```tsx
toast.error(error.message); // raw backend message shown to user
```

### RX-07 — `dangerouslySetInnerHTML` requires DOMPurify (MUST)
Any `dangerouslySetInnerHTML` usage sanitizes its input with `DOMPurify.sanitize` immediately before assignment; no unsanitized HTML string reaches it.

✅
```tsx
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```
❌
```tsx
<div dangerouslySetInnerHTML={{ __html: html }} />
```

### RX-08 — Stable list keys (MUST)
Lists that can reorder, filter, or insert/remove items use a stable unique id as `key`; array index is never used as `key` for such lists.

✅
```tsx
{items.map((item) => <Row key={item.id} item={item} />)}
```
❌
```tsx
{items.map((item, index) => <Row key={index} item={item} />)}
```

### RX-09 — `useMemo`/`useCallback` only with measured reason (MUST)
Every `useMemo`/`useCallback` carries a comment naming the profiler measurement or benchmark that justified it; no reflexive memoization.

✅
```tsx
// React Profiler: sort of 5k rows cost 42ms/render without memo (2026-03-01)
const sorted = useMemo(() => sortRows(rows), [rows]);
```
❌
```tsx
const sorted = useMemo(() => sortRows(rows), [rows]); // no measurement, added by habit
```

### RX-10 — Virtualize lists over 100 rows (MUST)
Any list or table that can render more than 100 rows uses a virtualization library (e.g. `@tanstack/react-virtual`); no unbounded DOM row mounting.

✅
```tsx
const virtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current });
```
❌
```tsx
{rows.map((row) => <Row key={row.id} row={row} />)} // 5,000 rows, no virtualization
```

### RX-11 — Route-level code splitting (MUST)
Every top-level route component is loaded via `React.lazy` and rendered inside a `Suspense` boundary; no route imports its page eagerly at module scope.

✅
```tsx
const InvoicesPage = React.lazy(() => import("./pages/InvoicesPage"));

<Suspense fallback={<PageSkeleton />}>
  <InvoicesPage />
</Suspense>
```
❌
```tsx
import InvoicesPage from "./pages/InvoicesPage"; // pulled into the main bundle
```

### RX-12 — ESLint clean with `react-hooks` and `jsx-a11y` (MUST)
CI runs ESLint with `eslint-plugin-react-hooks` and `eslint-plugin-jsx-a11y` enabled, and the build fails on any error.

✅
```tsx
function useCounter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = String(count); }, [count]); // deps complete
  return count;
}
```
❌
```tsx
function useCounter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = String(count); }, []); // react-hooks/exhaustive-deps violation
  return count;
}
```

### RX-13 — No business logic in components [ADDED] (MUST)
Data transforms, validation, and orchestration live in hooks or `lib/`, not in component bodies or JSX; a component wires hooks to markup.

✅
```tsx
function InvoiceTotal({ invoiceId }: { invoiceId: string }) {
  const total = useInvoiceTotal(invoiceId); // logic in hook
  return <span>{formatCurrency(total)}</span>;
}
```
❌
```tsx
function InvoiceTotal({ invoice }: { invoice: Invoice }) {
  const total = invoice.lines.reduce((sum, l) => sum + l.qty * l.price * (1 - l.discount), 0);
  return <span>{total}</span>;
}
```

### RX-14 — Controlled inputs [ADDED] (MUST)
Form inputs are controlled through state or a form library (React Hook Form); no ref-only, uncontrolled input backing submitted data.

✅
```tsx
<input value={email} onChange={(e) => setEmail(e.target.value)} />
```
❌
```tsx
<input ref={emailRef} defaultValue="" /> // read via ref on submit, no controlled state
```

### RX-15 — `aria-*` on interactive non-semantic elements [ADDED] (MUST)
A `div` or `span` acting as a button, tab, or toggle carries the matching `role` and `aria-*` attributes and is keyboard operable.

✅
```tsx
<div role="button" tabIndex={0} aria-pressed={active} onClick={toggle} onKeyDown={onEnterOrSpace}>
  Toggle
</div>
```
❌
```tsx
<div onClick={toggle}>Toggle</div> // no role, not focusable, no keyboard handler
```

### RX-16 — No `useEffect` for derived state [ADDED] (MUST)
Values computable from props/state during render are computed during render (optionally memoized), never synced into state via `useEffect`.

✅
```tsx
const fullName = `${first} ${last}`;
```
❌
```tsx
const [fullName, setFullName] = useState("");
useEffect(() => setFullName(`${first} ${last}`), [first, last]);
```

### RX-17 — Absolute imports [ADDED] (SHOULD)
Cross-folder imports use the configured path alias (`@/...`) instead of relative chains of `../../..`.

✅
```tsx
import { errorMessages } from "@/lib/error-messages";
```
❌
```tsx
import { errorMessages } from "../../../../lib/error-messages";
```

### RX-18 — `AbortSignal` on fetches [ADDED] (SHOULD)
Fetches issued through TanStack Query forward the `signal` argument so in-flight requests cancel on unmount or refetch.

✅
```tsx
useQuery({
  queryKey: invoiceKeys.detail(id),
  queryFn: ({ signal }) => fetchInvoice(id, { signal }),
});
```
❌
```tsx
useQuery({ queryKey: invoiceKeys.detail(id), queryFn: () => fetchInvoice(id) }); // ignores signal
```

### RX-19 — No feature barrel re-exports [ADDED] (SHOULD)
A feature folder does not ship an `index.ts` that re-exports its entire public surface; consumers import the specific module they need.

✅
```tsx
import { useInvoice } from "@/features/invoices/hooks/useInvoice";
```
❌
```tsx
// features/invoices/index.ts
export * from "./hooks";
export * from "./components";
export * from "./api";
```

## ESLint Configuration

```js
// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "dangerouslySetInnerHTML requires DOMPurify.sanitize() at the assignment site (RX-07).",
        },
      ],
    },
  },
);
```

## Exceptions
Any deviation from a rule in this file requires an ADR in `docs/adr/` that references the rule ID (e.g. `[RX-04]`) and is approved before the code merges.
