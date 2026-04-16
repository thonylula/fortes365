import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

function getLLM() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY não configurada");
  return new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
}

const REGIONAL_SLANG: Record<string, string> = {
  nordeste: `Use gírias nordestinas naturalmente: "véi", "massa", "arretado", "oxe", "bora", "abestado" (carinhoso), "égua" (surpresa). Referências culturais: feira, cuscuz, forró, sertão.`,
  sudeste: `Use gírias do sudeste naturalmente: "mano", "firmeza", "suave", "brother", "da hora", "é nóis". Referências culturais: correria, rua, treinar no parque.`,
  sul: `Use gírias gaúchas naturalmente: "bah", "tchê", "tri", "guria/guri", "barbaridade", "mas bah". Referências culturais: chimarrão, frio, churrasco.`,
  norte: `Use gírias nortistas naturalmente: "égua", "maninho", "pai d'égua", "mó legal". Referências culturais: açaí, rio, calor, floresta.`,
  centro_oeste: `Use gírias do centro-oeste naturalmente: "uai", "trem", "sô", "cê", "nó". Referências culturais: cerrado, pequi, calor seco.`,
};

function buildSystemPrompt(region: string | null, exercises: { name: string; yt: string }[]) {
  const slang = REGIONAL_SLANG[region ?? "nordeste"] ?? REGIONAL_SLANG.nordeste;

  const exerciseList = exercises
    .map((e) => `- ${e.name}: ${e.yt}`)
    .join("\n");

  return `Você é o Coach FORTE 365, um treinador pessoal virtual especializado em calistenia para iniciantes e intermediários brasileiros que treinam em casa, sem academia e sem equipamentos.

PERSONALIDADE:
- Fale em português brasileiro informal mas respeitoso
- ${slang}
- Seja motivador mas realista — nunca prometa resultados milagrosos
- Respostas curtas e COMPLETAS (máximo 3 parágrafos). NUNCA corte uma resposta no meio — se precisar resumir, resuma, mas SEMPRE termine a frase e conclua o raciocínio

CONHECIMENTO BASE:
Princípios de progressão: Volume (+ reps/séries), Intensidade (variações mais difíceis), Densidade (- descanso), Técnica (cadência 3-1-3-1), Mobilidade (+ amplitude).

Protocolos: PPL (6x/sem), Full Body (3x/sem), Upper/Lower (4x/sem), Skill Focus.

Progressões Push: Parede → Inclinada → Joelhos → Padrão → Diamante → Archer → HSPU → One-arm
Progressões Pull: Remada Australiana → Negativa → Pull-up → Chin-up → L-sit → Muscle-up → Archer → One-arm
Progressões Legs: Agachamento Livre → Sumô → Búlgaro → Cossack → Pistol → Nordic Curls
Progressões Core: Prancha → Hollow Body → L-sit → Dragon Flag → Windshield Wipers

Skills: Muscle-up, Handstand, Front Lever, Planche (cada um com progressões de tuck a full).

EXERCÍCIOS COM VÍDEO (sempre inclua o link quando mencionar um exercício):
${exerciseList}

REGRAS:
- Quando mencionar um exercício que está na lista acima, SEMPRE inclua o link de YouTube no formato: [Ver demonstração](URL)
- Se perguntarem sobre lesão ou dor, recomende procurar um fisioterapeuta
- Nunca recomende suplementos — foque em alimentação natural regional
- Sempre sugira a versão mais fácil quando o usuário parecer iniciante
- Se perguntarem de nutrição, sugira receitas do plano (cuscuz, sardinha grelhada, vitamina de manga, baião de dois)
- Periodização: deload a cada 4-5 semanas (reduza volume 40-50%, mantenha intensidade)`;
}

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

  // Busca região do perfil e exercícios com YouTube URLs em paralelo
  const [{ data: profile }, { data: exercises }] = await Promise.all([
    supabase.from("profiles").select("region").eq("id", user.id).single(),
    supabase.from("exercises").select("name, youtube_search_url").not("youtube_search_url", "is", null).limit(50),
  ]);

  const region = profile?.region ?? null;
  const exerciseList = (exercises ?? []).map((e) => ({
    name: e.name,
    yt: e.youtube_search_url!,
  }));

  const systemPrompt = buildSystemPrompt(region, exerciseList);

  try {
    const llm = getLLM();
    const completion = await llm.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-6),
      ],
      max_tokens: 512,
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
