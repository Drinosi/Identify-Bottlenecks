import { githubProvider } from '@/lib/integrations/providers/github'
import type {
  IntegrationProvider,
  IntegrationProviderId,
} from '@/lib/integrations/types'

const providers: Record<IntegrationProviderId, IntegrationProvider> = {
  github: githubProvider,
}

export function getIntegrationProvider(providerId: IntegrationProviderId) {
  return providers[providerId]
}
