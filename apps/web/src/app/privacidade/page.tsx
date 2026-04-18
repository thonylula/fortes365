import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, LegalHeader, LegalSection } from "@/components/marketing-shell";

export const metadata: Metadata = {
  title: "Política de Privacidade · FORTE 365",
  description:
    "Como o FORTE 365 coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <MarketingShell>
      <LegalHeader
        eyebrow="Documento legal · LGPD"
        title="Política de Privacidade"
        updated="17 de abril de 2026"
      />

      <LegalSection index="01" title="Quem somos">
        <p>
          FORTE 365 é um aplicativo independente de calistenia periodizada
          desenvolvido no Brasil. Este documento descreve quais dados
          pessoais coletamos, por que coletamos e como você pode exercer
          seus direitos conforme a Lei Geral de Proteção de Dados (Lei nº
          13.709/2018 — LGPD).
        </p>
        <p>
          Controlador dos dados: FORTE 365 · Contato:{" "}
          <a
            href="mailto:contato@fortes365.com.br"
            className="text-[color:var(--or)] hover:underline"
          >
            contato@fortes365.com.br
          </a>
        </p>
      </LegalSection>

      <LegalSection index="02" title="Dados que coletamos">
        <p>Coletamos apenas o necessário para operar o serviço:</p>
        <ul className="list-none space-y-2 border-l border-[color:var(--bd)] pl-5">
          <li>
            <strong className="text-[color:var(--tx)]">Conta:</strong> email,
            senha (armazenada com hash) e nome.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Perfil:</strong> nível
            fitness, peso, altura, região (UF) e objetivos — informados
            voluntariamente no onboarding.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Progresso:</strong>{" "}
            sessões de treino concluídas, exercícios marcados, XP acumulado,
            streak, conquistas e habilidades dominadas.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Pagamento:</strong>{" "}
            quando aplicável, processado exclusivamente pelo MercadoPago.
            Não armazenamos dados de cartão nos nossos servidores.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Uso:</strong> dados
            anônimos de navegação (páginas visitadas, eventos de clique)
            para melhorar a experiência.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="03" title="Por que coletamos">
        <p>Cada categoria de dado tem uma finalidade específica:</p>
        <ul className="list-none space-y-2 border-l border-[color:var(--bd)] pl-5">
          <li>
            Conta e perfil — autenticar o acesso e personalizar o programa
            de treino.
          </li>
          <li>
            Progresso — permitir que você acompanhe sua evolução, gerar
            rankings, desbloquear conquistas e desafios.
          </li>
          <li>
            Pagamento — processar sua assinatura e emitir recibo.
          </li>
          <li>
            Uso — entender quais funcionalidades são mais utilizadas e
            priorizar melhorias.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="04" title="Com quem compartilhamos">
        <p>
          Não vendemos seus dados. Compartilhamos informações estritamente
          necessárias com os seguintes operadores:
        </p>
        <ul className="list-none space-y-2 border-l border-[color:var(--bd)] pl-5">
          <li>
            <strong className="text-[color:var(--tx)]">Supabase</strong> —
            banco de dados e autenticação. Dados armazenados em
            infraestrutura AWS.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Vercel</strong> —
            hospedagem do aplicativo e serviços serverless.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">MercadoPago</strong>{" "}
            — processamento de pagamentos (quando aplicável).
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">OpenAI</strong> —
            geração de respostas do Coach IA. As conversas podem conter
            informações do seu treino atual; não compartilhamos email nem
            dados pessoais identificáveis.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">PostHog</strong> —
            análise de uso anônima.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">YouTube</strong> —
            vídeos de exercícios carregados via iframe; o YouTube aplica
            sua própria política de cookies ao reproduzir vídeos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="05" title="Seus direitos">
        <p>
          Como titular dos dados, você tem direito a qualquer momento a:
        </p>
        <ul className="list-none space-y-2 border-l border-[color:var(--bd)] pl-5">
          <li>
            <strong className="text-[color:var(--tx)]">Acessar</strong> os
            dados que temos sobre você — exportação em JSON disponível em{" "}
            <Link
              href="/conta"
              className="text-[color:var(--or)] hover:underline"
            >
              /conta
            </Link>
            .
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Corrigir</strong>{" "}
            dados incorretos a qualquer momento no perfil.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Excluir</strong> sua
            conta e todos os dados associados em{" "}
            <Link
              href="/conta/excluir"
              className="text-[color:var(--or)] hover:underline"
            >
              /conta/excluir
            </Link>
            . Exclusão é imediata e permanente.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">
              Portabilidade
            </strong>{" "}
            — o arquivo de exportação está em formato JSON legível por
            qualquer aplicativo.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Revogar</strong>{" "}
            consentimento — basta excluir a conta.
          </li>
        </ul>
        <p>
          Solicitações adicionais podem ser enviadas para{" "}
          <a
            href="mailto:contato@fortes365.com.br"
            className="text-[color:var(--or)] hover:underline"
          >
            contato@fortes365.com.br
          </a>
          . Respondemos em até 15 dias úteis.
        </p>
      </LegalSection>

      <LegalSection index="06" title="Retenção">
        <p>
          Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir
          a conta, todos os registros são apagados imediatamente, incluindo
          histórico de treinos, progresso, conquistas e perfil. Dados
          agregados e anônimos (ex. média de treinos por semana em uma
          região) podem ser retidos para análise.
        </p>
      </LegalSection>

      <LegalSection index="07" title="Cookies">
        <p>
          Utilizamos apenas cookies essenciais para manter sua sessão ativa
          (autenticação) e preferências de navegação. Não utilizamos cookies
          de rastreamento de terceiros para publicidade.
        </p>
      </LegalSection>

      <LegalSection index="08" title="Segurança">
        <p>
          Todas as comunicações são criptografadas via HTTPS. Senhas são
          armazenadas com hash bcrypt. O acesso aos dados é restrito por
          Row Level Security (RLS) no banco — cada usuário só consegue ler
          seus próprios registros.
        </p>
      </LegalSection>

      <LegalSection index="09" title="Alterações nesta política">
        <p>
          Quando houver alteração material, avisaremos por email. A data de
          última atualização sempre fica no topo deste documento.
        </p>
      </LegalSection>

      <LegalSection index="10" title="Dúvidas">
        <p>
          Qualquer dúvida sobre privacidade:{" "}
          <a
            href="mailto:contato@fortes365.com.br"
            className="text-[color:var(--or)] hover:underline"
          >
            contato@fortes365.com.br
          </a>
          .
        </p>
      </LegalSection>
    </MarketingShell>
  );
}
