'use client'

import { useState, useRef, useEffect } from 'react'
import type { ChatProvider, ChatMessage, ZhipuModel } from '@/types/chat'

const MAX_CHARS = 2000 // Adjust this limit as needed

export default function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<ChatProvider>('openai')
  const [zhipuModel, setZhipuModel] = useState<ZhipuModel>('glm-4')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const charCount = input.length
  const isOverLimit = charCount > MAX_CHARS

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || isOverLimit) return

    const newMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          provider,
          model: provider === 'zhipu' ? zhipuModel : undefined 
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <div className="p-4 bg-white border-b">
          <div className="flex gap-2">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as ChatProvider)}
              className="p-2 border rounded-md bg-white hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="openai" className="text-black">OpenAI</option>
              <option value="zhipu" className="text-black">Zhipu AI (ChatGLM)</option>
            </select>

            {provider === 'zhipu' && (
              <select
                value={zhipuModel}
                onChange={(e) => setZhipuModel(e.target.value as ZhipuModel)}
                className="p-2 border rounded-md bg-white hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="glm-4" className="text-black">GLM-4 (Most Capable)</option>
                <option value="glm-4-flash" className="text-black">GLM-4-Flash (Fast)</option>
                <option value="chatglm_turbo" className="text-black">ChatGLM Turbo (Balanced)</option>
                <option value="chatglm_std" className="text-black">ChatGLM Standard</option>
                <option value="chatglm_lite" className="text-black">ChatGLM Lite (Fast)</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Start a conversation by typing a message below
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div className="inline-flex items-start gap-2 max-w-[80%]">
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm mt-1">
                      AI
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    } whitespace-pre-wrap shadow-sm`}
                  >
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm mt-1">
                      You
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-left">
              <div className="inline-flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
                  AI
                </div>
                <div className="p-3 rounded-lg bg-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-black ${
                  isOverLimit ? 'border-red-500' : ''
                }`}
                disabled={isLoading}
              />
              <div className={`absolute bottom-2 right-2 text-sm ${
                isOverLimit ? 'text-red-500' : 'text-gray-400'
              }`}>
                {charCount}/{MAX_CHARS}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !input.trim() || isOverLimit}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 font-medium"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
} 