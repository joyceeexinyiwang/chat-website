export type ChatProvider = 'openai' | 'zhipu'
export type ZhipuModel = 'glm-4' | 'glm-4-flash' | 'chatglm_turbo' | 'chatglm_std' | 'chatglm_lite'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: string
  error?: string
} 