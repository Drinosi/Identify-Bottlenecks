export type Workspace = {
  user: {
    id: string
    name: string
    email: string
  }
  organization: {
    id: string
    name: string
    slug: string
    created_at: string
    role: string
  } | null
  github: {
    connected: boolean
    accountLogin: string | null
    installationId: string | null
    repositories: Repository[]
    pullRequests: {
      total: number
      waitingForReview: number
      averageHoursToFirstReview: number | null
    }
  }
}

export type Repository = {
  id: string
  owner: string
  name: string
  full_name: string
  default_branch: string
  private: boolean
  updated_at: string
}
