import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { getRecentReviews, getReviewStats, type RecentReview } from "@/lib/reviews";

export const metadata: Metadata = {
  title: "Calistenia em casa por 12 meses",
  description:
    "Programa brasileiro de calistenia periodizada: 4 fases, 56 habilidades, coach IA em português e nutrição pt-BR. Mês 1 gratuito, sem cartão.",
  alternates: { canonical: "/" },
};

const SPECS: Array<[string, string]> = [
  ["Duração", "12 meses"],
  ["Fases", "04"],
  ["Exercícios", "200+"],
  ["Habilidades mapeadas", "56"],
  ["Idioma", "pt-BR"],
  ["Modo offline", "Incluído"],
];

const PILLARS: Array<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Periodização automática",
    body: "Quatro fases progressivas com microciclos de deload. O plano é construído uma vez, se recalibra a cada semana.",
  },
  {
    n: "02",
    title: "Coach IA em português",
    body: "Consulta 24/7 sobre execução, dor, substituição e carga. Respostas contextualizadas no seu programa.",
  },
  {
    n: "03",
    title: "Skill tree direcional",
    body: "Cinquenta e seis habilidades organizadas em grafo — do primeiro push-up ao muscle-up, planche e handstand.",
  },
  {
    n: "04",
    title: "Nutrição brasileira",
    body: "Receitas, quantidades e substituições baseadas na safra nacional. Feita para o mercado que você frequenta.",
  },
  {
    n: "05",
    title: "Desafios semanais",
    body: "Metas rotativas com XP extra e ranking nacional. Estrutura pensada para quem treina sozinho.",
  },
  {
    n: "06",
    title: "Offline-first",
    body: "PWA instalável no celular. O treino de hoje não depende de sinal. Sincroniza quando você voltar.",
  },
];

const STEPS: Array<{ n: string; title: string; body: string; image: string }> = [
  {
    n: "01",
    title: "Diagnóstico",
    body: "Dois minutos para calibrar nível, objetivo e equipamento disponível.",
    image: "/images/method-01.jpg",
  },
  {
    n: "02",
    title: "Plano",
    body: "Doze meses de periodização montados automaticamente a partir do diagnóstico.",
    image: "/images/method-02.jpg",
  },
  {
    n: "03",
    title: "Execução",
    body: "Vídeo por exercício, timer de descanso, registro de sets e coach IA sempre ao lado.",
    image: "/images/method-03.jpg",
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "É necessário equipamento?",
    a: "Os primeiros meses dependem apenas do peso do corpo. A barra fixa entra na fase 2 e sempre há variação para quem não tem uma disponível.",
  },
  {
    q: "Funciona em iPhone?",
    a: "Sim. O FORTE 365 é um PWA — roda em iOS e Android e pode ser instalado na tela inicial como aplicativo nativo.",
  },
  {
    q: "E se eu parar de treinar por alguns dias?",
    a: "O programa se ajusta. A continuidade é opcional e não gera penalização; a próxima sessão aguarda o retorno.",
  },
  {
    q: "O cancelamento é simples?",
    a: "Um clique. O acesso permanece até o fim do período já pago, sem cláusulas adicionais.",
  },
  {
    q: "Existe garantia?",
    a: "Sete dias no plano anual. Caso não faça sentido, o valor é devolvido integralmente.",
  },
  {
    q: "O coach responde em português?",
    a: "Sim. A base de conhecimento é em pt-BR e as respostas cobrem execução, dor, substituição e progressão.",
  },
];

export default async function Home() {
  const stats = await getReviewStats();
  const reviews = stats.count >= 3 ? await getRecentReviews(3) : [];
  const showReviews = stats.count >= 3;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <SiteHeader />

      <main id="main-content">
        <JsonLd stats={stats} />
        <Hero />
        <Divider />
        <Pillars />
        <Divider />
        <Method />
        <Divider />
        <Pricing />
        <Divider />
        <Manifesto />
        {showReviews && (
          <>
            <Divider />
            <Reviews stats={stats} reviews={reviews} />
          </>
        )}
        <Divider />
        <Faq index={showReviews ? "06" : "05"} />
        <Divider />
        <FinalCta index={showReviews ? "07" : "06"} />
      </main>

      <SiteFooter />
    </div>
  );
}

/* ============================================================ */
/* Layout primitives                                            */
/* ============================================================ */

function Divider() {
  return (
    <div aria-hidden="true" className="mx-auto h-px w-full max-w-6xl bg-[color:var(--bd)]" />
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[3px] text-[color:var(--tx3)]">
      <span className="text-[color:var(--or)]">§{index}</span>
      <span>{label}</span>
    </div>
  );
}

/* ============================================================ */
/* Header                                                       */
/* ============================================================ */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--bd)] bg-[color:var(--bg)]/92 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="logo">
          FORT<span>E</span>
          <sub>365</sub>
        </div>
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navegação principal"
        >
          <HeaderLink href="#produto">Produto</HeaderLink>
          <HeaderLink href="#planos">Planos</HeaderLink>
          <HeaderLink href="#faq">FAQ</HeaderLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-sm px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[2px] text-[color:var(--tx2)] transition-colors hover:text-[color:var(--tx)] sm:inline-flex"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center rounded-sm bg-[color:var(--or)] px-3.5 py-1.5 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[2px] text-black transition-colors hover:bg-[#ff7733]"
          >
            Começar
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[2px] text-[color:var(--tx2)] transition-colors hover:text-[color:var(--tx)]"
    >
      {children}
    </a>
  );
}

/* ============================================================ */
/* Hero                                                         */
/* ============================================================ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <HeroBackdrop />
      <div className="relative mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7 md:pr-8">
            <div className="flex items-center gap-3 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[3px] text-[color:var(--or)]">
              <span className="h-px w-8 bg-[color:var(--or)]" aria-hidden="true" />
              Programa de calistenia · 2026
            </div>

            <h1 className="mt-6 font-[family-name:var(--font-display)] text-[44px] leading-[0.96] tracking-[0.01em] sm:text-7xl">
              UM ANO DE
              <br />
              <span className="text-[color:var(--or)]">FORÇA</span> SEM
              <br />
              ACADEMIA.
            </h1>

            <p className="mt-7 max-w-xl text-[15px] leading-[1.7] text-[color:var(--tx2)] sm:text-base">
              Doze meses de periodização, coach IA nativo em português,
              nutrição adaptada à safra brasileira e uma skill tree com
              cinquenta e seis habilidades. Projetado para quem treina em
              casa e espera seriedade de um aplicativo.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/cadastro"
                className="group inline-flex h-12 items-center justify-between gap-6 rounded-sm bg-[color:var(--or)] px-5 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[2.5px] text-black transition-colors hover:bg-[#ff7733]"
              >
                <span>Começar · Mês 1 gratuito</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <a
                href="#planos"
                className="inline-flex h-12 items-center justify-center px-3 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[2.5px] text-[color:var(--tx)] underline decoration-[color:var(--bd)] decoration-1 underline-offset-[6px] transition-colors hover:decoration-[color:var(--or)]"
              >
                Ver planos
              </a>
            </div>

            <p className="mt-6 font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[2px] text-[color:var(--tx3)]">
              Sem cartão no cadastro · Pix, cartão ou boleto · Cancela em 1 clique
            </p>
          </div>

          <aside className="md:col-span-5">
            <figure
              className="relative aspect-[4/5] overflow-hidden rounded-sm"
              style={{
                backgroundColor: "var(--s2)",
                backgroundImage: "url(/images/hero-portrait.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
                }}
              />
              <div
                aria-hidden="true"
                className="absolute left-0 top-6 h-16 w-[2px] bg-[color:var(--or)]"
              />
              <figcaption className="absolute bottom-5 left-6 right-6">
                <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2.5px] text-[color:var(--or)]">
                  Cap. 02 · Hollow body
                </div>
                <div className="mt-1 font-[family-name:var(--font-display)] text-base tracking-[2px] text-white">
                  Tensão isométrica · Fase 2
                </div>
              </figcaption>
            </figure>
          </aside>
        </div>

        {/* Spec strip */}
        <div className="mt-16 border-t border-[color:var(--bd)] pb-20 pt-8 sm:pb-24">
          <div className="mb-4 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[3px] text-[color:var(--tx3)]">
            Ficha técnica
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:grid-cols-6">
            {SPECS.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dd className="font-[family-name:var(--font-display)] text-2xl tracking-wider text-[color:var(--tx)]">
                  {v}
                </dd>
                <dt className="mt-1 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
                  {k}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,85,0,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,85,0,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
        maskImage:
          "radial-gradient(ellipse at top left, black 0%, transparent 70%)",
      }}
    />
  );
}

/* ============================================================ */
/* Pillars (features)                                           */
/* ============================================================ */

function Pillars() {
  return (
    <section id="produto" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-10 md:grid-cols-12">
          <header className="md:col-span-4">
            <SectionLabel index="01" label="Produto" />
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide sm:text-4xl">
              Seis pilares
              <br />
              que sustentam o programa.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[color:var(--tx2)]">
              Cada pilar resolve um problema específico de quem treina em
              casa sem acompanhamento profissional.
            </p>
          </header>

          <ol className="md:col-span-8 md:border-l md:border-[color:var(--bd)] md:pl-10">
            {PILLARS.map((p, i) => (
              <li
                key={p.n}
                className={`grid grid-cols-[56px_1fr] gap-6 py-7 ${
                  i === 0 ? "pt-0" : "border-t border-[color:var(--bd)]"
                }`}
              >
                <span className="font-[family-name:var(--font-display)] text-2xl tracking-wider text-[color:var(--or)]">
                  {p.n}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-[2px] text-[color:var(--tx)]">
                    {p.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-[1.7] text-[color:var(--tx2)]">
                    {p.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Method (como funciona)                                       */
/* ============================================================ */

function Method() {
  return (
    <section className="bg-[color:var(--s1)]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <SectionLabel index="02" label="Método" />
          <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide sm:text-4xl">
            Três etapas
            <br />
            até o primeiro treino.
          </h2>
        </div>

        <div className="mt-14 grid gap-px bg-[color:var(--bd)] sm:grid-cols-3">
          {STEPS.map((s) => (
            <article
              key={s.n}
              className="flex flex-col bg-[color:var(--s1)] p-8 transition-colors hover:bg-[color:var(--s2)]"
            >
              <figure
                className="relative mb-7 aspect-[4/5] overflow-hidden rounded-sm"
                style={{
                  backgroundColor: "var(--s2)",
                  backgroundImage: `url(${s.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                aria-label={`Ilustração — ${s.title}`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-5 h-10 w-[2px] bg-[color:var(--or)]"
                />
              </figure>
              <div className="flex items-center gap-3">
                <span className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-wider text-[color:var(--or)]">
                  {s.n}
                </span>
                <span className="h-px flex-1 bg-[color:var(--bd)]" aria-hidden="true" />
              </div>
              <h3 className="mt-6 font-[family-name:var(--font-condensed)] text-sm font-bold uppercase tracking-[2.5px]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.7] text-[color:var(--tx2)]">
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Pricing                                                      */
/* ============================================================ */

function Pricing() {
  return (
    <section id="planos" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="03" label="Planos" />
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide sm:text-4xl">
              Preço direto.
              <br />
              Sem pegadinha.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[color:var(--tx2)]">
            Mês 1 gratuito em todos os planos. Pagamento via MercadoPago.
            Cancelamento em qualquer momento, sem retenção.
          </p>
        </div>

        <div className="mt-12 grid gap-px bg-[color:var(--bd)] md:grid-cols-3">
          <PlanCard
            label="Gratuito"
            price="R$ 0"
            suffix=""
            caption="Mês 1 completo, sem cartão."
            features={[
              "Primeiros 30 dias do programa",
              "Vídeo por exercício",
              "Timer de descanso",
              "Registro de sets",
            ]}
            cta="Iniciar"
          />
          <PlanCard
            label="Mensal"
            price="R$ 14,90"
            suffix="/mês"
            caption="Programa completo, flexibilidade total."
            features={[
              "Doze meses de programa",
              "Coach IA em português",
              "Skill tree + desafios semanais",
              "Nutrição e receitas pt-BR",
              "Cancelamento em 1 clique",
            ]}
            cta="Assinar mensal"
            highlight
          />
          <PlanCard
            label="Anual"
            price="R$ 99,90"
            suffix="/ano"
            caption="Aproximadamente R$ 8,30/mês · 44% de economia."
            features={[
              "Tudo do plano mensal",
              "Economia de R$ 78,90 no ano",
              "Prioridade no suporte",
              "Garantia de 7 dias",
            ]}
            cta="Assinar anual"
          />
        </div>

        <p className="mt-6 text-center font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[2px] text-[color:var(--tx3)]">
          Pix · Cartão · Boleto · Sem taxa de adesão
        </p>
      </div>
    </section>
  );
}

function PlanCard({
  label,
  price,
  suffix,
  caption,
  features,
  cta,
  highlight,
}: {
  label: string;
  price: string;
  suffix: string;
  caption: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-6 p-8"
      style={{
        background: highlight ? "var(--s2)" : "var(--bg)",
        borderTop: highlight ? "2px solid var(--or)" : "2px solid transparent",
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2.5px] text-[color:var(--tx3)]">
          {label}
        </span>
        {highlight && (
          <span className="font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
            Recomendado
          </span>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-[family-name:var(--font-display)] text-4xl tracking-wider text-[color:var(--tx)]">
            {price}
          </span>
          {suffix && (
            <span className="text-[13px] text-[color:var(--tx2)]">{suffix}</span>
          )}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--tx2)]">
          {caption}
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-[color:var(--bd)] border-y border-[color:var(--bd)]">
        {features.map((f) => (
          <li
            key={f}
            className="grid grid-cols-[auto_1fr] items-start gap-3 py-3 text-[13px] text-[color:var(--tx)]"
          >
            <span className="mt-2 h-px w-3 bg-[color:var(--or)]" aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/cadastro"
        className="inline-flex h-11 items-center justify-center rounded-sm font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[2.5px] transition-colors"
        style={{
          background: highlight ? "var(--or)" : "transparent",
          color: highlight ? "#000" : "var(--tx)",
          border: highlight ? "none" : "1px solid var(--bd)",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

/* ============================================================ */
/* Manifesto                                                    */
/* ============================================================ */

function Manifesto() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--s1)]">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--s1)",
          backgroundImage: "url(/images/manifesto-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(11,11,11,0.95) 0%, rgba(11,11,11,0.85) 45%, rgba(11,11,11,0.55) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-24">
        <SectionLabel index="04" label="Nota do autor" />
        <blockquote className="mt-6 border-l border-[color:var(--or)] pl-6 sm:pl-10">
          <p className="font-[family-name:var(--font-display)] text-2xl leading-[1.25] tracking-wide text-[color:var(--tx)] sm:text-3xl">
            FORTE 365 nasceu de um plano pessoal de doze meses para treinar
            calistenia em casa, sem academia. Cada fase, cada exercício e
            cada receita foram testados antes de virar aplicativo.
          </p>
          <p className="mt-5 text-[15px] leading-[1.7] text-[color:var(--tx2)]">
            Se você procura um programa sério, em português, e que respeita
            o tempo de quem treina sozinho — foi feito para você.
          </p>
        </blockquote>
      </div>
    </section>
  );
}

/* ============================================================ */
/* FAQ                                                          */
/* ============================================================ */

function Faq({ index = "05" }: { index?: string }) {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionLabel index={index} label="Dúvidas" />
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide sm:text-4xl">
              Perguntas
              <br />
              frequentes.
            </h2>
          </div>

          <div className="md:col-span-8">
            <dl className="divide-y divide-[color:var(--bd)] border-y border-[color:var(--bd)]">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group py-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-6">
                    <span className="font-[family-name:var(--font-condensed)] text-[13px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx)]">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-[family-name:var(--font-display)] text-xl leading-none text-[color:var(--or)] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl text-[14px] leading-[1.7] text-[color:var(--tx2)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Final CTA                                                    */
/* ============================================================ */

function FinalCta({ index = "06" }: { index?: string }) {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <SectionLabel index={index} label="Começar" />
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-[1.02] tracking-wide sm:text-6xl">
              Comece hoje.
              <br />O <span className="text-[color:var(--or)]">primeiro mês</span> é gratuito.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-[color:var(--tx2)]">
              Sem cartão no cadastro. Trinta dias completos para decidir se
              o programa combina com o seu ritmo.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <Link
              href="/cadastro"
              className="group inline-flex h-14 w-full items-center justify-between gap-6 rounded-sm bg-[color:var(--or)] px-6 font-[family-name:var(--font-condensed)] text-[13px] font-bold uppercase tracking-[2.5px] text-black transition-colors hover:bg-[#ff7733] sm:w-auto"
            >
              <span>Começar grátis</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Reviews (condicional — so renderiza com >= 3 avaliacoes)     */
/* ============================================================ */

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <span
      aria-label={`${rating.toFixed(1)} de 5 estrelas`}
      style={{ fontSize: size, lineHeight: 1, letterSpacing: 1 }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= full ? "var(--or)" : "var(--tx3)" }}>
          {n <= full ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function Reviews({
  stats,
  reviews,
}: {
  stats: { count: number; average: number };
  reviews: RecentReview[];
}) {
  return (
    <section id="avaliacoes" className="scroll-mt-20 bg-[color:var(--s1)]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="05" label="Avaliações" />
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide sm:text-4xl">
              O que dizem
              <br />
              quem usa.
            </h2>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <div className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-wider text-[color:var(--or)]">
                {stats.average.toFixed(1)}
              </div>
              <div className="mt-2">
                <Stars rating={stats.average} size={20} />
              </div>
            </div>
            <div className="pb-1 font-[family-name:var(--font-condensed)] text-[11px] uppercase tracking-[2px] text-[color:var(--tx3)]">
              {stats.count} avaliações
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-px bg-[color:var(--bd)] md:grid-cols-3">
          {reviews.map((r, i) => (
            <article
              key={i}
              className="flex flex-col gap-4 bg-[color:var(--s1)] p-6"
            >
              <Stars rating={r.rating} size={18} />
              {r.body && (
                <p className="text-[14px] leading-[1.7] text-[color:var(--tx2)]">
                  &ldquo;{r.body}&rdquo;
                </p>
              )}
              <div className="mt-auto font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[2px] text-[color:var(--or)]">
                — {r.firstName}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[2px] text-[color:var(--tx3)]">
          Tem conta? Deixe a sua em{" "}
          <Link href="/conta" className="text-[color:var(--or)] hover:underline">
            /conta
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ============================================================ */
/* Footer                                                       */
/* ============================================================ */

function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--bd)] bg-[color:var(--s1)]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="logo">
              FORT<span>E</span>
              <sub>365</sub>
            </div>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[color:var(--tx3)]">
              Programa de calistenia periodizada em português. Produto
              independente, feito no Brasil.
            </p>
          </div>

          <FooterColumn
            title="Produto"
            items={[
              ["Cadastro", "/cadastro"],
              ["Entrar", "/login"],
              ["Planos", "/assinar"],
              ["FAQ", "#faq"],
            ]}
          />

          <FooterColumn
            title="Empresa"
            items={[
              ["Sobre", "/sobre"],
              ["Contato", "mailto:contato@fortes365.com.br"],
              ["Privacidade", "/privacidade"],
              ["Termos", "/termos"],
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[color:var(--bd)] pt-6 font-[family-name:var(--font-condensed)] text-[10px] uppercase tracking-[2px] text-[color:var(--tx3)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 FORTE 365 · Todos os direitos reservados</span>
          <span>Brasil · pt-BR</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <nav className="md:col-span-3" aria-label={title}>
      <div className="font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-[2.5px] text-[color:var(--tx3)]">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-[13px] text-[color:var(--tx2)] transition-colors hover:text-[color:var(--or)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
