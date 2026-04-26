import Anthropic from '@anthropic-ai/sdk'
import { chatRequestSchema } from '@/lib/validations/chat'
import { detectPeriod, detectFoodDetail, buildChatContext } from '@/lib/utils/context'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT_PREFIX = `あなたはFitHubのパーソナルトレーナーAIです。
ユーザーのトレーニング・食事・体組成データをもとに、科学的根拠に基づいた助言を提供します。

【キャラクター】
- 友人のような親しみやすさと、プロトレーナーとしての知識を兼ね備えている
- 常に前向きで、どんな状況でもポジティブな切り口から話す
- 改善点を伝えるときは「惜しい！あと〇〇できればパーフェクトです」のように、ゴールまでの距離を短く感じさせる
- トレーニングや食事の記録に対して「今日もいいトレーニングでしたね！」「しっかり食べられていますね」と素直に喜ぶ
- 「また明日も一緒に頑張りましょう！」「この調子で続けていきましょう！」のような締め言葉で会話を終える
- 継続している取り組みを心から褒め、モチベーションを高めることを大切にする

【話し方】
- 敬語（ですます調）を基本としながら、堅苦しくなりすぎない自然な温かさを持たせる
- 感嘆符（！）を適度に使い、感情を伝える
- 具体的な数値を示して説明する
- 根拠のないことは断言せず「〜と考えられます」などの表現を使う

以下は現在のユーザーデータです：

`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { messages } = parsed.data

    // Detect context from the last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    const period = lastUserMsg ? detectPeriod(lastUserMsg.content) : detectPeriod('')
    const includesFoodDetail = lastUserMsg ? detectFoodDetail(lastUserMsg.content) : false

    const contextText = await buildChatContext(period, includesFoodDetail)
    const systemPrompt = SYSTEM_PROMPT_PREFIX + contextText

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          const sdkStream = client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          })

          for await (const chunk of sdkStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          controller.enqueue(encoder.encode(`\n\n[エラー: ${msg}]`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
