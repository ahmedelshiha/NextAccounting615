'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

export interface IntegrationInfo {
  name: string
  description: string
  enabled: boolean
  configured: boolean
  features: string[]
  icon: string
  docs: string
}

export interface IntegrationStatus {
  platform: 'slack' | 'zapier' | 'webhook' | 'teams'
  enabled: boolean
  connected: boolean
  lastTestedAt?: string
  error?: string
}

export interface IntegrationConfig {
  slack?: {
    webhookUrl: string
    enabled?: boolean
  }
  zapier?: {
    webhookUrl: string
    enabled?: boolean
  }
  webhook?: {
    url: string
    secret?: string
    enabled?: boolean
  }
  teams?: {
    webhookUrl: string
    enabled?: boolean
  }
}

export function useIntegrations() {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<Record<string, IntegrationInfo>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load integrations list
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/users/integrations')
        if (!response.ok) throw new Error('Failed to load integrations')

        const data = await response.json()
        setIntegrations(data.data || {})
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        toast({
          title: 'Error',
          description: `Failed to load integrations: ${message}`,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadIntegrations()
  }, [toast])

  // Configure integration
  const configureIntegration = useCallback(
    async (config: IntegrationConfig) => {
      try {
        const response = await fetch('/api/admin/users/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        })

        if (!response.ok) {
          throw new Error('Failed to configure integration')
        }

        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Integration configured successfully',
        })

        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast({
          title: 'Error',
          description: `Failed to configure integration: ${message}`,
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast]
  )

  // Test integration connection
  const testIntegration = useCallback(
    async (platform: 'slack' | 'zapier' | 'webhook' | 'teams', webhookUrl: string) => {
      try {
        const response = await fetch('/api/admin/users/integrations/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, webhookUrl }),
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: 'Success',
            description: `${platform} webhook test successful (${data.responseTime}ms)`,
          })
        } else {
          toast({
            title: 'Connection Failed',
            description: data.message || `Failed to connect to ${platform}`,
            variant: 'destructive',
          })
        }

        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        toast({
          title: 'Error',
          description: `Integration test failed: ${message}`,
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast]
  )

  return {
    integrations,
    loading,
    error,
    configureIntegration,
    testIntegration,
  }
}

/**
 * Hook for Slack integration
 */
export function useSlackIntegration() {
  const [config, setConfig] = useState<{webhookUrl: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const configure = useCallback(async (webhookUrl: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slack: { webhookUrl } }),
      })

      if (!response.ok) throw new Error('Failed to configure')
      const data = await response.json()

      setConfig({ webhookUrl })
      toast({
        title: 'Success',
        description: 'Slack integration configured',
      })

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to configure Slack',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  const test = useCallback(async (webhookUrl: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'slack', webhookUrl }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Slack connection test successful',
        })
      } else {
        toast({
          title: 'Failed',
          description: data.message || 'Connection test failed',
          variant: 'destructive',
        })
      }

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  return { config, loading, configure, test }
}

/**
 * Hook for Teams integration
 */
export function useTeamsIntegration() {
  const [config, setConfig] = useState<{webhookUrl: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const configure = useCallback(async (webhookUrl: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: { webhookUrl } }),
      })

      if (!response.ok) throw new Error('Failed to configure')
      const data = await response.json()

      setConfig({ webhookUrl })
      toast({
        title: 'Success',
        description: 'Teams integration configured',
      })

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to configure Teams',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  const test = useCallback(async (webhookUrl: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'teams', webhookUrl }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Teams connection test successful',
        })
      } else {
        toast({
          title: 'Failed',
          description: data.message || 'Connection test failed',
          variant: 'destructive',
        })
      }

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  return { config, loading, configure, test }
}

/**
 * Hook for Zapier integration
 */
export function useZapierIntegration() {
  const [config, setConfig] = useState<{webhookUrl: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const configure = useCallback(async (webhookUrl: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zapier: { webhookUrl } }),
      })

      if (!response.ok) throw new Error('Failed to configure')
      const data = await response.json()

      setConfig({ webhookUrl })
      toast({
        title: 'Success',
        description: 'Zapier integration configured',
      })

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to configure Zapier',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  const test = useCallback(async (webhookUrl: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'zapier', webhookUrl }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Zapier connection test successful',
        })
      } else {
        toast({
          title: 'Failed',
          description: data.message || 'Connection test failed',
          variant: 'destructive',
        })
      }

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  return { config, loading, configure, test }
}

/**
 * Hook for Webhook integration
 */
export function useWebhookIntegration() {
  const [config, setConfig] = useState<{url: string; secret?: string} | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const configure = useCallback(async (url: string, secret?: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook: { url, secret } }),
      })

      if (!response.ok) throw new Error('Failed to configure')
      const data = await response.json()

      setConfig({ url, secret })
      toast({
        title: 'Success',
        description: 'Webhook integration configured',
      })

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to configure webhook',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  const test = useCallback(async (url: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'webhook', webhookUrl: url }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Webhook connection test successful',
        })
      } else {
        toast({
          title: 'Failed',
          description: data.message || 'Connection test failed',
          variant: 'destructive',
        })
      }

      return data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      })
      throw error
    } finally {
      setLoading(false)
    }
  }, [toast])

  return { config, loading, configure, test }
}
