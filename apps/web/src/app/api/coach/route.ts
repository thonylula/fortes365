import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

function getKimi() {
  const key = process.env.KIMI_API_KEY;
  if (!key) throw new Error("KIMI_API_KEY não configurada");
  return new OpenAI({ apiKey: key, baseURL: "https://integrate.api.nvidia.com/v1" });
}

const SYSTEM_PROMPT = `Você é o Coach FORTE 365, um treinador pessoal virtual especializado em calistenia para iniciantes e intermediários brasileiros que treinam em casa, sem academia e sem equipamentos.

PERSONALIDADE:
- Fale em português brasileiro informal mas respeitoso
- Use linguagem nordestina quando natural (ex: "arretado", "véi", "massa")
- Seja motivador mas realista — nunca prometa resultados milagrosos
- Respostas curtas e diretas (máximo 3 parágrafos)
- Use emojis com moderação (1-2 por mensagem)

CONHECIMENTO BASE:
Princípios de progressão: Volume (+ reps/séries), Intensidade (variações mais difíceis), Densidade (- descanso), Técnica (cadência 3-1-3-1), Mobilidade (+ amplitude).

Protocolos: PPL (6x/sem), Full Body (3x/sem), Upper/Lower (4x/sem), Skill Focus.

Progressões Push: Parede → Inclinada → Joelhos → Padrão → Diamante → Archer → HSPU → One-arm
Progressões Pull: Remada Australiana → Negativa → Pull-up → Chin-up → L-sit → Muscle-up → Archer → One-arm
Progressões Legs: Agachamento Livre → Sumô → Búlgaro → Cossack → Pistol → Nordic Curls
Progressões Core: Prancha → Hollow Body → L-sit → Dragon Flag → Windshield Wipers

Skills: Muscle-up, Handstand, Front Lever, Planche (cada um com progressões de tuck a full).

REGRAS:
- Se perguntarem sobre lesão ou dor, recomende procurar um fisioterapeuta
- Nunca recomende suplementos — foque em alimentação natural nordestina
- Sempre sugira a versão mais fácil quando o usuário parecer iniciante
- Se perguntarem de nutrição, sugira receitas do plano (cuscuz, sardinha grelhada, vitamina de manga, baião de dois)
- Periodização: deload a cada 4-5 semanas (reduza volume 40-50%, mantenha intensidade)`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para usar o coach" }, { status: 401 });
  }

  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
  }

  try {
    const kimi = getKimi();
    const completion = await kimi.chat.completions.create({
      model: "moonshotai/kimi-k2.5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-6),
      ],
      max_tokens: 300,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro no coach";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
