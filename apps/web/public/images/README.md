# Imagens da landing page

A landing page espera **5 imagens** nesta pasta:

| Arquivo | Uso | Proporção sugerida | Peso alvo |
|---|---|---|---|
| `hero-portrait.jpg` | Hero, coluna direita (card vertical) | 4:5 (ex. 1200×1500px) | ≤ 250KB |
| `manifesto-bg.jpg` | Fundo do manifesto (com overlay escuro 65%) | 16:9 (ex. 1920×1080px) | ≤ 300KB |
| `method-01.jpg` | Método §02 — card **Diagnóstico** (celular/quiz/avaliação inicial) | 4:5 (ex. 1000×1250px) | ≤ 150KB |
| `method-02.jpg` | Método §02 — card **Plano** (calendário/periodização/planejamento) | 4:5 (ex. 1000×1250px) | ≤ 150KB |
| `method-03.jpg` | Método §02 — card **Execução** (atleta treinando em ação) | 4:5 (ex. 1000×1250px) | ≤ 150KB |

Se as imagens não existirem, a landing continua funcionando — aparece um fundo `var(--s2)` (cinza escuro) no lugar. Nenhum broken icon.

> **Dica**: se escolher fotos de pessoas, varie etnia/gênero/idade para representar a base brasileira. As 3 imagens do Método não precisam ser as mesmas do hero — tons um pouco mais claros ajudam a contrastar com o card preto.

## Como baixar do Unsplash (grátis, uso comercial permitido)

1. Abra uma das buscas abaixo e escolha uma foto de qualidade:
   - https://unsplash.com/s/photos/calisthenics
   - https://unsplash.com/s/photos/bodyweight-training
   - https://unsplash.com/s/photos/home-workout
   - https://unsplash.com/s/photos/pull-up
   - https://unsplash.com/s/photos/muscle-up

2. Critérios de seleção:
   - **Hero portrait**: pessoa única, vertical, iluminação dramática, preferência por tons escuros/neutros pra combinar com a paleta
   - **Manifesto bg**: ambiente caseiro ou urbano, horizontal, sem texto sobreposto

3. Baixe em **"Large"** (ou maior), salve nesta pasta com os nomes exatos da tabela acima.

4. Otimize antes de commitar (recomendado):
   - https://squoosh.app → exportar como MozJPEG 75-80% de qualidade
   - Ou via CLI: `npx @squoosh/cli --mozjpeg '{quality:78}' hero-portrait.jpg`

## Alternativas

- **Pexels**: https://www.pexels.com/search/calisthenics/ (mesma licença)
- **Foto própria**: se você tiver foto do seu próprio treino, melhor ainda — autenticidade vende

## Atribuição

Unsplash e Pexels não exigem atribuição, mas é elegante creditar o fotógrafo:
crie um arquivo `CREDITS.md` com `[Nome do fotógrafo](url-do-perfil)` para cada foto usada.

## Licença das imagens neste diretório

Coloque as imagens reais que você baixar aqui. Elas ficam versionadas junto com o código. Para imagens do Unsplash/Pexels isso é permitido pela licença.
