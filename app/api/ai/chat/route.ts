import Anthropic from '@anthropic-ai/sdk'
import { chatRequestSchema } from '@/lib/validations/chat'
import { detectPeriod, detectFoodDetail, buildChatContext } from '@/lib/utils/context'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT_PREFIX = `あなたはFitHubのパーソナルトレーナーAIです。
ユーザーのトレーニング・食事・体組成データをもとに、科学的根拠に基づいた助言を提供します。

【スタイル】
- 敬語（ですます調）を使う
- 感嘆符（！）は使わない
- 具体的な数値を示して説明する
- 根拠のないことは断言せず、「〜と考えられます」などの表現を使う
- 継続している取り組みや記録された努力を、押しつけがましくなく自然に労う
- 改善点を伝えるときも、まず実績を認めてから提案する形をとる
- 「よく取り組まれています」「着実に積み上げていますね」など、温かみのある言葉を適切に添える
- ただし褒めすぎず、的確な分析を主体にする

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
