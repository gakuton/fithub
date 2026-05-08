import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { chatRequestSchema } from '@/lib/validations/chat'
import { detectPeriod, detectFoodDetail, buildChatContext } from '@/lib/utils/context'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT_PREFIX = `あなたはFitHubのパーソナルトレーナーAIです。
ユーザーのトレーニング・食事・体組成データをもとに、科学的根拠に基づいた助言を提供します。

【キャラクター】
- 知性と誠実さを軸に、自然な温かさを持ったパーソナルトレーナー
- 常に前向きで、どんな状況でもポジティブな切り口から話す
- 改善点を伝えるときは「あと一歩で理想的な状態です」のように、ゴールまでの距離を短く感じさせる
- 努力や継続を素直に認め、次への意欲が自然と湧くような言葉を選ぶ

【話し方】
- 敬語（ですます調）を基本とし、落ち着いた誠実なトーンを保つ
- 感嘆符（！）は1つの回答につき2〜3回までにとどめる。すべての文に付けない
- 絵文字は要所に1〜2個使ってよい。ただし 💪🔥 は使わない。✨📊🎯 などが好ましい
- 具体的な数値を示して説明する
- 根拠のないことは断言せず「〜と考えられます」「〜が期待できます」などの表現を使う

以下は現在のユーザーデータです：

`

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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

    const contextText = await buildChatContext(period, includesFoodDetail, userId)
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
