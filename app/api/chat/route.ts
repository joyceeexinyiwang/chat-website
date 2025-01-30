import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import type { ChatResponse } from '@/types/chat'

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

async function handleOpenAI(message: string): Promise<ChatResponse> {
  try {
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'gpt-3.5-turbo',
    })

    return { 
      message: completion.choices[0]?.message?.content || 'Sorry, I could not process that.'
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

async function handleZhipu(message: string, model: string = 'glm-4'): Promise<ChatResponse> {
  if (!process.env.ZHIPU_API_KEY) {
    throw new Error('Missing ZHIPU_API_KEY environment variable')
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        top_p: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Zhipu API error response:', errorData)
      throw new Error(`Zhipu API failed: ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return { message: data.choices[0].message.content }
  } catch (error) {
    console.error('Zhipu API error:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const { message, provider = 'openai', model } = await request.json()

    let response: ChatResponse

    switch (provider) {
      case 'openai':
        response = await handleOpenAI(message)
        break
      case 'zhipu':
        response = await handleZhipu(message, model)
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
} 