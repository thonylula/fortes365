import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, LegalHeader, LegalSection } from "@/components/marketing-shell";

export const metadata: Metadata = {
  title: "Termos de Uso · FORTE 365",
  description:
    "Condições de uso do FORTE 365, aplicativo de calistenia periodizada em português.",
};

export default function TermosPage() {
  return (
    <MarketingShell>
      <LegalHeader
        eyebrow="Documento legal"
        title="Termos de Uso"
        updated="17 de abril de 2026"
      />

      <LegalSection index="01" title="Sobre o serviço">
        <p>
          FORTE 365 é um aplicativo de planejamento e acompanhamento de
          treino de calistenia, distribuído na web como PWA (Progressive
          Web App). Ao criar uma conta, você concorda com os termos abaixo.
        </p>
        <p>
          Se não concordar com algum ponto, não utilize o serviço. Dúvidas
          podem ser enviadas para{" "}
          <a
            href="mailto:contato@fortes365.com.br"
            className="text-[color:var(--or)] hover:underline"
          >
            contato@fortes365.com.br
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection index="02" title="Idade mínima">
        <p>
          O serviço é destinado a maiores de 16 anos. Menores de idade
          devem ter autorização dos responsáveis legais.
        </p>
      </LegalSection>

      <LegalSection index="03" title="Responsabilidade sobre a prática">
        <p>
          FORTE 365 fornece sugestões de treino baseadas em metodologias
          consolidadas de calistenia, mas não substitui orientação médica
          ou acompanhamento de um profissional de educação física. Antes
          de iniciar qualquer programa de exercícios, consulte um médico,
          especialmente se houver histórico de lesões, doenças
          cardiovasculares, gravidez ou qualquer condição que possa ser
          afetada por atividade física.
        </p>
        <p>
          Você é o único responsável pela execução dos exercícios e por
          avaliar seus limites. O FORTE 365 não se responsabiliza por
          lesões decorrentes do uso do aplicativo.
        </p>
      </LegalSection>

      <LegalSection index="04" title="Conta e senha">
        <p>
          Você é responsável por manter a confidencialidade da sua senha e
          por todas as atividades realizadas na sua conta. Caso suspeite de
          acesso não autorizado, redefina a senha imediatamente e nos
          comunique.
        </p>
      </LegalSection>

      <LegalSection index="05" title="Assinatura e pagamento">
        <p>
          O primeiro mês é gratuito e não exige cadastro de cartão. Após o
          período gratuito, o acesso aos meses seguintes exige assinatura
          paga (mensal ou anual), processada pelo MercadoPago.
        </p>
        <ul className="list-none space-y-2 border-l border-[color:var(--bd)] pl-5">
          <li>
            <strong className="text-[color:var(--tx)]">Renovação</strong> —
            assinaturas se renovam automaticamente. Você pode cancelar a
            renovação a qualquer momento em{" "}
            <Link
              href="/conta"
              className="text-[color:var(--or)] hover:underline"
            >
              /conta
            </Link>
            .
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Cancelamento</strong>{" "}
            — efeito ao fim do período já pago. Não cobramos taxa de
            cancelamento.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Reembolso</strong>{" "}
            — plano anual tem garantia de 7 dias. Solicitações via email.
          </li>
          <li>
            <strong className="text-[color:var(--tx)]">Reajuste</strong>{" "}
            — preços podem ser ajustados anualmente. Mudanças só afetam
            renovações futuras; você será avisado com antecedência.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="06" title="Uso aceitável">
        <p>Você concorda em não:</p>
        <ul className="list-none space-y-2 border-l border-[color:var(--bd)] pl-5">
          <li>
            Utilizar o serviço para atividades ilegais ou que violem
            direitos de terceiros.
          </li>
          <li>
            Compartilhar sua conta com outras pessoas ou revender o acesso.
          </li>
          <li>
            Tentar acessar áreas restritas, burlar limites técnicos ou
            realizar engenharia reversa do aplicativo.
          </li>
          <li>
            Utilizar o Coach IA para gerar conteúdo que viole diretrizes
            legais, éticas ou direitos de terceiros.
          </li>
        </ul>
      </LegalSection>

      <LegalSection index="07" title="Propriedade intelectual">
        <p>
          O conteúdo do FORTE 365 (textos, planos de treino, receitas,
          design, código) é de propriedade do autor e protegido por lei.
          Você tem uma licença pessoal, não-exclusiva e intransferível para
          uso do aplicativo enquanto sua conta estiver ativa.
        </p>
        <p>
          Vídeos de exercícios são incorporados do YouTube e permanecem de
          propriedade dos respectivos criadores.
        </p>
      </LegalSection>

      <LegalSection index="08" title="Suspensão e encerramento">
        <p>
          Podemos suspender ou encerrar contas que violem estes termos, sem
          reembolso. Você pode encerrar sua conta a qualquer momento em{" "}
          <Link
            href="/conta/excluir"
            className="text-[color:var(--or)] hover:underline"
          >
            /conta/excluir
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection index="09" title="Limitação de responsabilidade">
        <p>
          O serviço é fornecido &ldquo;como está&rdquo;. Fazemos o possível
          para manter o aplicativo funcional e atualizado, mas não
          garantimos disponibilidade ininterrupta nem ausência de erros.
          Nossa responsabilidade máxima em qualquer caso fica limitada ao
          valor pago pela assinatura nos últimos 12 meses.
        </p>
      </LegalSection>

      <LegalSection index="10" title="Lei aplicável">
        <p>
          Estes termos são regidos pelas leis do Brasil. Disputas serão
          resolvidas no foro da comarca do contratante, salvo disposição
          legal em contrário.
        </p>
      </LegalSection>

      <LegalSection index="11" title="Alterações">
        <p>
          Podemos atualizar estes termos ocasionalmente. Mudanças
          significativas serão comunicadas por email com pelo menos 30 dias
          de antecedência.
        </p>
      </LegalSection>
    </MarketingShell>
  );
}
