import { Resend } from "resend";
import { SITE_URL } from "@/lib/site";

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = "FORTE 365 <onboarding@resend.dev>";

type SendParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function sendEmail({ to, subject, html, text }: SendParams): Promise<void> {
  if (!resendClient) {
    console.warn(
      `[email] RESEND_API_KEY missing — skipping: "${subject}" -> ${to}`,
    );
    return;
  }
  try {
    const from = process.env.EMAIL_FROM || DEFAULT_FROM;
    const { error } = await resendClient.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      console.error(`[email] send failed for "${subject}" -> ${to}:`, error);
    }
  } catch (err) {
    console.error(`[email] unexpected error sending "${subject}":`, err);
  }
}

/* ============================================================ */
/* Shared layout                                                */
/* ============================================================ */

function baseLayout(opts: {
  preheader: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}): string {
  const { preheader, heading, body, ctaLabel, ctaHref } = opts;
  const ctaBlock =
    ctaLabel && ctaHref
      ? `
    <tr>
      <td style="padding:24px 32px 8px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#ff5500;border-radius:4px;">
              <a href="${ctaHref}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#000000;text-decoration:none;">${ctaLabel}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
      : "";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="x-ua-compatible" content="ie=edge">
<title>FORTE 365</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f4f4f4;">${preheader}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f4;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden;">
        <tr>
          <td style="background:#ff5500;height:4px;line-height:4px;font-size:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px 32px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;letter-spacing:3px;color:#ff5500;">
              FORT<span style="color:#1a1a1a;">E</span><span style="font-size:11px;color:#888;letter-spacing:1px;font-weight:700;margin-left:4px;">365</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 0 32px;">
            <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.25;color:#1a1a1a;font-weight:800;letter-spacing:-0.3px;">${heading}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#333333;">
            ${body}
          </td>
        </tr>
        ${ctaBlock}
        <tr>
          <td style="padding:32px 32px 16px 32px;">
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:0;">
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#888888;">
            FORTE 365 · Calistenia periodizada em português<br>
            <a href="${SITE_URL}/sobre" style="color:#888888;text-decoration:underline;">Sobre</a> ·
            <a href="${SITE_URL}/privacidade" style="color:#888888;text-decoration:underline;">Privacidade</a> ·
            <a href="${SITE_URL}/termos" style="color:#888888;text-decoration:underline;">Termos</a>
          </td>
        </tr>
      </table>
      <div style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#aaaaaa;">
        Você está recebendo este email porque tem conta no FORTE 365.
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/* ============================================================ */
/* 1. Welcome                                                   */
/* ============================================================ */

export async function sendWelcomeEmail(
  to: string,
  opts: { name?: string } = {},
): Promise<void> {
  const greeting = opts.name ? `Bem-vindo, ${opts.name}.` : "Bem-vindo.";
  const subject = "Bem-vindo ao FORTE 365";
  const preheader =
    "Sua conta foi confirmada. Programa em 12 níveis pronto pra começar.";

  const body = `
    <p style="margin:0 0 16px 0;">Sua conta foi confirmada e o programa em doze níveis está pronto.</p>
    <p style="margin:0 0 16px 0;">O Nível 1 (Despertar) é gratuito. Aqui vai o roteiro sugerido:</p>
    <ol style="margin:0 0 16px 20px;padding:0;">
      <li style="margin-bottom:6px;">Abra a aba <strong>Treino</strong> e comece pela Semana 1 do <strong>Nível I — Despertar</strong>.</li>
      <li style="margin-bottom:6px;">Respeite o tempo de descanso — o timer é seu aliado, não um obstáculo.</li>
      <li style="margin-bottom:6px;">Quando bater dúvida, o <strong>Coach IA</strong> responde 24/7 em português.</li>
    </ol>
    <p style="margin:0 0 16px 0;">Você pode instalar o app no celular (ícone de compartilhar → Adicionar à Tela Inicial).</p>
    <p style="margin:0;">Bons treinos.</p>`;

  const text = `${greeting}

Sua conta foi confirmada e o programa em doze níveis está pronto.

O Nível 1 (Despertar) é gratuito. Roteiro sugerido:
1. Abra a aba Treino e comece pela Semana 1 do Nível I — Despertar.
2. Respeite o tempo de descanso — o timer é seu aliado.
3. Use o Coach IA para tirar dúvidas em português.

Você pode instalar o app no celular (Adicionar à Tela Inicial).

Acesse: ${SITE_URL}/treino

— FORTE 365`;

  await sendEmail({
    to,
    subject,
    html: baseLayout({
      preheader,
      heading: greeting,
      body,
      ctaLabel: "Ir para o primeiro treino",
      ctaHref: `${SITE_URL}/treino`,
    }),
    text,
  });
}

/* ============================================================ */
/* 2. Payment confirmed                                         */
/* ============================================================ */

export async function sendPaymentConfirmedEmail(
  to: string,
  opts: { plan: string; amountBRL: number; nextChargeDate?: Date },
): Promise<void> {
  const amount = opts.amountBRL.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const nextDate = opts.nextChargeDate
    ? opts.nextChargeDate.toLocaleDateString("pt-BR")
    : null;

  const subject = "Pagamento confirmado · FORTE 365";
  const preheader = `Assinatura ${opts.plan} ativa. Acesso liberado.`;
  const heading = "Pagamento confirmado";

  const nextChargeLine = nextDate
    ? `<p style="margin:0 0 16px 0;">Próxima cobrança prevista: <strong>${nextDate}</strong>.</p>`
    : "";

  const body = `
    <p style="margin:0 0 16px 0;">Sua assinatura <strong>${opts.plan}</strong> está ativa e o acesso ao programa completo foi liberado.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;background:#fafafa;border:1px solid #e5e5e5;border-radius:4px;width:100%;">
      <tr>
        <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;">
          Valor cobrado <strong style="color:#1a1a1a;float:right;">${amount}</strong>
        </td>
      </tr>
    </table>
    ${nextChargeLine}
    <p style="margin:0 0 16px 0;">Você pode gerenciar ou cancelar sua assinatura a qualquer momento em <a href="${SITE_URL}/conta" style="color:#ff5500;">Minha conta</a>. Cancelamento é em um clique, sem taxa.</p>
    <p style="margin:0;">Obrigado por confiar no projeto.</p>`;

  const text = `Pagamento confirmado.

Sua assinatura ${opts.plan} está ativa.
Valor: ${amount}
${nextDate ? `Próxima cobrança: ${nextDate}` : ""}

Gerenciar assinatura: ${SITE_URL}/conta

— FORTE 365`;

  await sendEmail({
    to,
    subject,
    html: baseLayout({
      preheader,
      heading,
      body,
      ctaLabel: "Gerenciar assinatura",
      ctaHref: `${SITE_URL}/conta`,
    }),
    text,
  });
}

/* ============================================================ */
/* 3. Account deleted                                           */
/* ============================================================ */

export async function sendAccountDeletedEmail(to: string): Promise<void> {
  const subject = "Sua conta no FORTE 365 foi excluída";
  const preheader = "Todos os seus dados foram removidos dos nossos servidores.";
  const heading = "Conta excluída";

  const body = `
    <p style="margin:0 0 16px 0;">Conforme solicitado, sua conta no FORTE 365 foi <strong>excluída permanentemente</strong>.</p>
    <p style="margin:0 0 16px 0;">Todos os dados vinculados foram removidos dos nossos servidores, incluindo:</p>
    <ul style="margin:0 0 16px 20px;padding:0;">
      <li style="margin-bottom:4px;">Perfil, progresso e conquistas</li>
      <li style="margin-bottom:4px;">Histórico de sessões de treino</li>
      <li style="margin-bottom:4px;">Credenciais de autenticação</li>
    </ul>
    <p style="margin:0 0 16px 0;">Se a exclusão foi um engano ou se você quiser voltar no futuro, é só criar uma conta nova — sem nenhuma penalidade.</p>
    <p style="margin:0;">Dúvidas ou feedback sobre o que poderíamos melhorar: <a href="mailto:contato@fortes365.com.br" style="color:#ff5500;">contato@fortes365.com.br</a>.</p>`;

  const text = `Conta excluída.

Conforme solicitado, sua conta no FORTE 365 foi permanentemente excluída.

Todos os dados vinculados foram removidos: perfil, progresso, conquistas, histórico de treinos e credenciais de autenticação.

Se quiser voltar no futuro, é só criar uma conta nova em ${SITE_URL}/cadastro.

Dúvidas: contato@fortes365.com.br

— FORTE 365`;

  await sendEmail({
    to,
    subject,
    html: baseLayout({ preheader, heading, body }),
    text,
  });
}
