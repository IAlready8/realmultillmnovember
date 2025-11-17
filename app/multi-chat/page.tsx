'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, RotateCcw, Settings } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { streamChatMessage } from '@/services/api-service'
import { ProviderConfig } from '@/lib/config-schemas'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  provider?: string
}

interface ChatState {
  messages: Message[]
  input: string
  isLoading: boolean
  activeProviders: string[]
}

export default function MultiChatPage() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    input: '',
    isLoading: false,
    activeProviders: ['openai', 'anthropic', 'google']
  })

  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({})
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    google: ['gemini-pro', 'gemini-1.5-pro'],
    openrouter: ['openrouter/auto', 'gryphe/mythomax-l2-13b']
  })

  useEffect(() => {
    loadProviderConfigs()
    scrollToBottom()
  }, [chatState.messages])

  const loadProviderConfigs = async () => {
    try {
      const stored = localStorage.getItem('providerConfigs')
      if (stored) {
        const configs = JSON.parse(stored)
        setProviderConfigs(configs)

        // Set default models based on provider configs
        const defaults: Record<string, string> = {}
        Object.keys(configs).forEach(provider => {
          if (configs[provider].models && configs[provider].models.length > 0) {
            defaults[provider] = configs[provider].models[0]
          }
        })
        setSelectedModels(defaults)
      }
    } catch (error) {
      console.error('Failed to load provider configs:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatState(prev => ({ ...prev, input: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatState.input.trim() || chatState.isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: chatState.input,
      timestamp: new Date()
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      input: '',
      isLoading: true
    }))

    // Add "typing" indicators for each provider
    const initialAssistantMessages = chatState.activeProviders.map(provider => ({
      id: `typing-${provider}-${Date.now()}`,
      role: 'assistant' as const,
      content: 'Thinking...',
      timestamp: new Date(),
      provider
    }))

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, ...initialAssistantMessages]
    }))

    // Call each provider
    const providerPromises = chatState.activeProviders.map(provider =>
      callProvider(provider, chatState.messages.concat(userMessage))
    )

    try {
      await Promise.all(providerPromises)
    } catch (error) {
      console.error('Error calling providers:', error)
      toast({
        title: 'Error',
        description: 'Failed to get responses from providers',
        variant: 'destructive'
      })
    } finally {
      setChatState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const callProvider = async (provider: string, messages: Message[]) => {
    try {
      const model = selectedModels[provider] || availableModels[provider]?.[0]
      if (!model) {
        throw new Error(`No model available for provider ${provider}`)
      }

      const fullMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Since streamChatMessage returns void, we don't need to assign its result
      await streamChatMessage(
        provider as any,
        fullMessages,
        (chunk) => {
          // Update the message content as we receive chunks
          setChatState(prev => {
            const updatedMessages = prev.messages.map(msg => {
              if (msg.provider === provider && msg.id.includes('typing-')) {
                return {
                  ...msg,
                  content: msg.content === 'Thinking...' ? chunk : msg.content + chunk
                }
              }
              return msg
            })
            return { ...prev, messages: updatedMessages }
          })
        },
        { model }
      )

      // After streaming is complete, we don't need to update content again since it's already updated via chunks
      // The message content is already updated in real-time as chunks arrive
    } catch (error) {
      console.error(`Error calling provider ${provider}:`, error)
      
      setChatState(prev => {
        const updatedMessages = prev.messages.map(msg => {
          if (msg.provider === provider && msg.id.includes('typing-')) {
            return {
              ...msg,
              content: `Error: ${(error as Error).message || 'Failed to get response'}`,
              timestamp: new Date()
            }
          }
          return msg
        })
        return { ...prev, messages: updatedMessages }
      })
      
      toast({
        title: 'Provider Error',
        description: `Failed to get response from ${provider}: ${(error as Error).message || 'Unknown error'}`,
        variant: 'destructive'
      })
    }
  }

  const clearChat = () => {
    setChatState({
      messages: [],
      input: '',
      isLoading: false,
      activeProviders: chatState.activeProviders
    })
  }

  const toggleProvider = (provider: string) => {
    setChatState(prev => {
      if (prev.activeProviders.includes(provider)) {
        return {
          ...prev,
          activeProviders: prev.activeProviders.filter(p => p !== provider)
        }
      } else {
        return {
          ...prev,
          activeProviders: [...prev.activeProviders, provider]
        }
      }
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Multi-LLM Chat</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {chatState.activeProviders.map(provider => (
                  <Badge key={provider} variant="secondary" className="capitalize">
                    {provider}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 mb-4 rounded-md border p-4 bg-muted/20 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-4">
              {chatState.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 mr-2" />
                      ) : (
                        <Bot className="h-4 w-4 mr-2" />
                      )}
                      {message.provider && (
                        <span className="text-xs font-medium capitalize">{message.provider}</span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={chatState.input}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              disabled={chatState.isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={chatState.isLoading || !chatState.input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="w-full md:w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['openai', 'anthropic', 'google', 'openrouter'].map(provider => (
                  <div key={provider} className="flex items-center justify-between">
                    <span className="capitalize text-sm">{provider}</span>
                    <Button
                      variant={chatState.activeProviders.includes(provider) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleProvider(provider)}
                    >
                      {chatState.activeProviders.includes(provider) ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Models</CardTitle>
            </CardHeader>
            <CardContent>
              {chatState.activeProviders.map(provider => (
                <div key={provider} className="mb-3 last:mb-0">
                  <label className="text-xs capitalize block mb-1">{provider} model</label>
                  <select
                    value={selectedModels[provider] || ''}
                    onChange={(e) => setSelectedModels(prev => ({
                      ...prev,
                      [provider]: e.target.value
                    }))}
                    className="w-full p-2 border rounded mt-1 text-sm"
                    disabled={chatState.isLoading}
                  >
                    {availableModels[provider]?.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}