'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import ApiKeyForm from '@/components/api-key-form'
import { ProviderConfig } from '@/lib/config-schemas'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()
  const [providerConfigs, setProviderConfigs] = useState<Record<string, ProviderConfig>>({
    openai: {
      apiKey: '',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      rateLimits: { requests: 60, window: 60000 },
      isActive: false,
    },
    anthropic: {
      apiKey: '',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      rateLimits: { requests: 50, window: 60000 },
      isActive: false,
    },
    google: {
      apiKey: '',
      models: ['gemini-pro', 'gemini-1.5-pro'],
      rateLimits: { requests: 60, window: 60000 },
      isActive: false,
    },
    openrouter: {
      apiKey: '',
      models: ['openrouter/auto', 'gryphe/mythomax-l2-13b'],
      rateLimits: { requests: 60, window: 60000 },
      isActive: false,
    },
  })

  useEffect(() => {
    setIsClient(true)
    loadProviderConfigs()
  }, [])

  const loadProviderConfigs = async () => {
    try {
      // Check for stored configurations
      const storedConfigs = localStorage.getItem('providerConfigs')
      if (storedConfigs) {
        const configs = JSON.parse(storedConfigs)
        // Decrypt API keys
        const decryptedConfigs = Object.entries(configs).reduce((acc, [provider, config]: [string, any]) => {
          return {
            ...acc,
            [provider]: {
              ...config,
              apiKey: config.apiKey ? decryptApiKey(config.apiKey) : ''
            }
          }
        }, {})
        setProviderConfigs(decryptedConfigs)
      }
    } catch (error) {
      console.error('Failed to load provider configs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load provider configurations',
        variant: 'destructive'
      })
    }
  }

  const saveProviderConfig = async (provider: string, config: ProviderConfig) => {
    try {
      const encryptedConfig = {
        ...config,
        apiKey: config.apiKey ? encryptApiKey(config.apiKey) : ''
      }
      
      const updatedConfigs = {
        ...providerConfigs,
        [provider]: encryptedConfig
      }
      
      localStorage.setItem('providerConfigs', JSON.stringify(updatedConfigs))
      setProviderConfigs(updatedConfigs)
      
      toast({
        title: 'Success',
        description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} configuration saved`
      })
    } catch (error) {
      console.error('Failed to save provider config:', error)
      toast({
        title: 'Error',
        description: `Failed to save ${provider} configuration`,
        variant: 'destructive'
      })
    }
  }

  if (!isClient) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Configure your account preferences and API providers</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="providers">API Providers</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your.email@example.com" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Provider Configuration</CardTitle>
              <CardDescription>Configure your LLM provider API keys and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex space-x-4">
                  <Button variant="outline">Light</Button>
                  <Button variant="default">Dark</Button>
                  <Button variant="outline">System</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Font Size</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Small</Button>
                  <Button variant="default" size="sm">Normal</Button>
                  <Button variant="outline" size="sm">Large</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Analytics</Label>
                  <p className="text-sm text-muted-foreground">Send anonymous usage data to improve the platform</p>
                </div>
                <Button variant="outline" size="sm">Toggle</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Export Data</Label>
                  <p className="text-sm text-muted-foreground">Export all your data in JSON format</p>
                </div>
                <Button variant="outline" size="sm">Export</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Reset Configuration</Label>
                  <p className="text-sm text-muted-foreground">Reset all settings to default values</p>
                </div>
                <Button variant="destructive" size="sm">Reset</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}