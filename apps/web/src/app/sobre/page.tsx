import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, LegalSection } from "@/components/marketing-shell";

export const metadata: Metadata = {
  title: "Sobre · FORTE 365",
  description:
    "A história do FORTE 365 — programa de calistenia periodizada feito por quem treina em casa.",
};

export default function SobrePage() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="border-b border-[color:var(--bd)]">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex items-center gap-3 font-[family-name:var(--font-condensed)] text-[11px] font-bold uppercase tracking-[3px] text-[color:var(--or)]">
            <span className="h-px w-8 bg-[color:var(--or)]" aria-hidden="true" />
            Sobre o projeto
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl leading-[0.98] tracking-wide sm:text-6xl">
            Um programa feito por
            <br />
            quem <span className="text-[color:var(--or)]">treina em casa</span>.
          </h1>
          <p className="mt-8 max-w-2xl text-[17px] leading-[1.7] text-[color:var(--tx2)]">
            FORTE 365 é um programa de calistenia periodizada, em
            português, independente. Foi escrito linha por linha — plano,
            nutrição, código — para resolver um problema específico:
            treinar com seriedade em casa, sem academia e sem aplicativo
            genérico.
          </p>
        </div>
      </section>

      <LegalSection index="01" title="A origem">
        <p>
          O projeto começou como um caderno. Doze níveis divididos em quatro
          fases, progressão semanal, exercícios descritos em detalhe,
          substituições para dias de dor ou cansaço.
        </p>
        <p>
          Não existia aplicativo brasileiro de calistenia com periodização
          real. Os de fora estavam em inglês e ignoravam nossa cultura
          alimentar. Os daqui vendiam treinos genéricos que não respeitavam
          fase, intensidade nem descanso. Se a ferramenta não existia, era
          hora de construir.
        </p>
      </LegalSection>

      <LegalSection index="02" title="O que é">
        <p>
          Um aplicativo web (PWA) com quatro blocos principais:
        </p>
        <ul className="list-none space-y-2 border-l border-[color:var(--bd)] pl-5">
          <li>
            <strong className="text-[color:var(--tx)]">Treino</strong> —
            doze níveis de periodização automatizada com vídeo por
            exercício, timer de descanso e registro de sets.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Nutrição</strong> —
            receitas e planos alimentares adaptados à safra brasileira.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Skill Tree</strong>{" "}
            — cinquenta e seis habilidades mapeadas em grafo, do primeiro
            push-up ao muscle-up, planche e handstand.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Coach IA</strong> —
            perguntas e respostas 24/7 em português sobre execução, dor,
            substituição e carga.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="03" title="O que não é">
        <p>
          Não é um feed social, não é um marketplace de personal trainers e
          não é um &ldquo;app de emagrecimento&rdquo; que mede calorias
          obsessivamente. É um programa — como se você tivesse um
          periódico de treino impresso e ele respondesse às suas dúvidas.
        </p>
        <p>
          Não promete resultado em trinta dias. Calistenia séria leva meses
          para mostrar efeito e anos para dominar. O aplicativo acompanha
          esse tempo.
        </p>
      </LegalSection>

      <LegalSection index="04" title="Metodologia">
        <p>
          A periodização segue o padrão clássico de preparação física
          adaptado para calistenia doméstica: ciclos de volume crescente,
          deload planejado e transição suave entre fases. Cada fase
          introduz progressões específicas — isometria, explosão, unilateral.
        </p>
        <p>
          A Skill Tree é um grafo direcional (DAG): para desbloquear uma
          habilidade, você precisa dominar as pré-requisitas. Muscle-up
          exige pull-up e dip consistentes. Handstand exige hollow body e
          bastante tempo de parada. Nada de atalho.
        </p>
      </LegalSection>

      <LegalSection index="05" title="Quem está por trás">
        <p>
          FORTE 365 é desenvolvido de forma independente por um único
          autor, sem investidores nem publicidade. Isso significa decisões
          rápidas, respostas diretas por email e um produto que evolui com
          o uso real — não com métricas de engajamento artificiais.
        </p>
        <p>
          Dúvidas, sugestões, críticas e feedback sobre execução são
          sempre bem-vindos:{" "}
          <a
            href="mailto:contato@fortes365.com.br"
            className="text-[color:var(--or)] hover:underline"
          >
            contato@fortes365.com.br
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection index="06" title="Para onde vai">
        <p>
          Na pauta dos próximos meses: correção de forma por webcam,
          sincronização com Google Fit e Apple Health, comunidade
          brasileira, programas derivados (mobilidade, força explosiva,
          cardio em casa).
        </p>
        <p>
          A direção é sempre a mesma: seriedade, português, sem encheção
          de linguiça.
        </p>
      </LegalSection>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="rounded-sm border border-[color:var(--or)] bg-[color:var(--ord)] p-8 sm:p-12">
            <h2 className="font-[family-name:var(--font-display)] text-3xl leading-tight tracking-wide sm:text-4xl">
              Mês 1 gratuito.
              <br />
              <span className="text-[color:var(--or)]">Sem cartão.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[color:var(--tx2)]">
              Trinta dias completos para ver se o programa faz sentido
              para o seu ritmo.
            </p>
            <Link
              href="/cadastro"
              className="mt-8 inline-flex h-12 items-center gap-3 rounded-sm bg-[color:var(--or)] px-6 font-[family-name:var(--font-condensed)] text-[12px] font-bold uppercase tracking-[2.5px] text-black transition-colors hover:bg-[#ff7733]"
            >
              <span>Começar grátis</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
