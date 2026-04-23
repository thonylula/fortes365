import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient as createServer } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ensureAdmin } from "@/lib/admin";
import { SubscribersList, type SubscriberEntry } from "./subscribers-list";

export const dynamic = "force-dynamic";

type SubRow = {
  id: string;
  user_id: string;
  tier: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export default async function AdminAssinaturasPage() {
  const supabase = await createServer();
  const admin = await ensureAdmin(supabase);
  if (!admin.ok) redirect("/conta");

  const service = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: rows, error } = await service
    .from("subscriptions")
    .select(
      "id, user_id, tier, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
          <Link href="/treino" className="logo">
            FORT<span>E</span>
            <sub>365</sub>
          </Link>
          <Link
            href="/conta"
            className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
          >
            ← Conta
          </Link>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
          <p className="text-sm text-red-400">
            Erro ao carregar assinaturas: {error.message}
          </p>
        </main>
      </div>
    );
  }

  const subs: SubRow[] = rows ?? [];
  const uniqueIds = Array.from(new Set(subs.map((s) => s.user_id)));

  const emailByUserId = new Map<string, string>();
  await Promise.all(
    uniqueIds.map(async (uid) => {
      const { data } = await service.auth.admin.getUserById(uid);
      if (data?.user?.email) emailByUserId.set(uid, data.user.email);
    }),
  );

  const now = Date.now();
  const enriched: SubscriberEntry[] = subs.map((s) => {
    const periodEnd = s.current_period_end
      ? new Date(s.current_period_end).getTime()
      : null;
    const isExpired = periodEnd !== null && periodEnd < now;
    const daysRemaining =
      periodEnd !== null
        ? Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)))
        : null;

    let computedStatus: SubscriberEntry["computedStatus"];
    if (s.status === "pending") computedStatus = "pending";
    else if (isExpired) computedStatus = "expired";
    else if (s.cancel_at_period_end) computedStatus = "canceling";
    else if (s.status === "active") computedStatus = "active";
    else computedStatus = "other";

    return {
      id: s.id,
      user_id: s.user_id,
      email: emailByUserId.get(s.user_id) ?? "(user removido)",
      tier: s.tier,
      status: s.status,
      computedStatus,
      current_period_start: s.current_period_start,
      current_period_end: s.current_period_end,
      cancel_at_period_end: s.cancel_at_period_end,
      days_remaining: daysRemaining,
      created_at: s.created_at,
      updated_at: s.updated_at,
    };
  });

  const counts = {
    total: enriched.length,
    active: enriched.filter((e) => e.computedStatus === "active").length,
    canceling: enriched.filter((e) => e.computedStatus === "canceling").length,
    pending: enriched.filter((e) => e.computedStatus === "pending").length,
    expired: enriched.filter((e) => e.computedStatus === "expired").length,
  };

  const mrrBRL = enriched
    .filter((e) => e.computedStatus === "active" || e.computedStatus === "canceling")
    .reduce((sum, e) => {
      const amount = PLAN_AMOUNT[e.tier] ?? 0;
      const monthly =
        e.tier === "annual"
          ? amount / 12
          : e.tier === "couple_annual"
          ? amount / 12
          : amount;
      return sum + monthly;
    }, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[52px] items-center justify-between border-b border-[color:var(--bd)] bg-[color:var(--s1)] px-4">
        <Link href="/treino" className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </Link>
        <Link
          href="/conta"
          className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[1.5px] text-[color:var(--or)]"
        >
          ← Conta
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="mb-6 flex items-baseline justify-between gap-3">
          <div>
            <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
              🛠 Área DEV
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider">
              ASSINATURAS
            </h1>
          </div>
          <div className="text-right text-xs text-[color:var(--tx3)]">
            Admin: {admin.email}
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricBox label="Ativas" value={counts.active} color="var(--gn)" />
          <MetricBox
            label="Cancelando"
            value={counts.canceling}
            color="var(--yw)"
          />
          <MetricBox
            label="Expiradas"
            value={counts.expired}
            color="var(--tx3)"
          />
          <MetricBox
            label="MRR estimado"
            value={`R$ ${mrrBRL.toFixed(2).replace(".", ",")}`}
            color="var(--or)"
          />
        </div>

        <SubscribersList entries={enriched} counts={counts} />
      </main>
    </div>
  );
}

const PLAN_AMOUNT: Record<string, number> = {
  monthly: 14.9,
  annual: 99.9,
  couple_monthly: 19.9,
  couple_annual: 149,
};

function MetricBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--bd)] bg-[color:var(--s1)] p-4">
      <div
        className="font-[family-name:var(--font-display)] text-2xl"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
        {label}
      </div>
    </div>
  );
}
