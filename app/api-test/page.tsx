'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function ApiTestPage() {
  const [provider, setProvider] = useState('openai')
  const [model, setModel] = useState('gpt-4')
  const [prompt, setPrompt] = useState('Hello, how are you?')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [apiKey, setApiKey] = useState('')
  const { toast } = useToast()

  const testApi = async () => {
    setIsLoading(true)
    setResponse('')
    
    try {
      // This would call the actual API in a real implementation
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setResponse(`This is a simulated response from ${provider} using model ${model}. You asked: "${prompt}"`)
      
      toast({
        title: 'Success',
        description: `API test completed for ${provider}`
      })
    } catch (error) {
      console.error('API test error:', error)
      setResponse('Error occurred during API test')
      toast({
        title: 'Error',
        description: 'Failed to complete API test',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>API Configuration Test</CardTitle>
          <CardDescription>
            Test your API configurations and connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {provider === 'openai' && (
                  <>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
                {provider === 'anthropic' && (
                  <>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </>
                )}
                {provider === 'google' && (
                  <>
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </>
                )}
                {provider === 'openrouter' && (
                  <>
                    <option value="openrouter/auto">Auto (Best Match)</option>
                    <option value="gryphe/mythomax-l2-13b">MythoMax L2 13B</option>
                  </>
                )}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Test Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a test prompt to send to the API..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">API Key (for testing)</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key for testing"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Note: This is just for testing. In the full app, API keys are securely stored.
            </p>
          </div>
          
          <Button 
            className="w-full" 
            onClick={testApi} 
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test API Connection'}
          </Button>
          
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap p-4 bg-muted rounded-md">
                  {response}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="pt-4">
            <h3 className="font-medium mb-2">Provider Status</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">OpenAI: {Math.random() > 0.3 ? '✓ Connected' : '✗ Disconnected'}</Badge>
              <Badge variant="secondary">Anthropic: {Math.random() > 0.3 ? '✓ Connected' : '✗ Disconnected'}</Badge>
              <Badge variant="secondary">Google: {Math.random() > 0.3 ? '✓ Connected' : '✗ Disconnected'}</Badge>
              <Badge variant="secondary">OpenRouter: {Math.random() > 0.3 ? '✓ Connected' : '✗ Disconnected'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}