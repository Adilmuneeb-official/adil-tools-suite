/**
 * Tool registry — the heart of the 500+ tool architecture.
 *
 * Each tool defines:
 *  - slug (unique, kebab-case)
 *  - title, description, icon (Lucide name), category
 *  - accessLevel: 'free' | 'pro' | 'agency'
 *  - fields: complete form definition (every option the tool needs)
 *  - handler: pure function that takes inputs, returns { output, extra? }
 *
 * To add a new tool: register it in /src/lib/modules/*.ts, it auto-loads.
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'url' | 'select' | 'checkbox' | 'file' | 'date' | 'password'

export interface ToolField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  defaultValue?: string | number | boolean
  help?: string
  options?: { value: string; label: string }[]
  rows?: number
  accept?: string // for file inputs
  multiple?: boolean
  min?: number
  max?: number
  step?: number
}

export interface ToolCategory {
  slug: string
  name: string
  icon: string
  sortOrder: number
  description?: string
}

export interface ToolDefinition {
  slug: string
  title: string
  category: string
  description: string
  icon: string
  accessLevel: 'free' | 'pro' | 'agency'
  module: string
  fields: ToolField[]
  handler: (input: Record<string, any>) => Promise<{ output: string; extra?: Record<string, any> }>
  tags?: string[]
  sortOrder?: number
}

// ----- In-memory registry (rebuilt on each server start) -----

const categories: Map<string, ToolCategory> = new Map()
const tools: Map<string, ToolDefinition> = new Map()

export function registerCategory(cat: Omit<ToolCategory, never>): void {
  if (!categories.has(cat.slug)) {
    categories.set(cat.slug, { ...cat })
  }
}

export function registerTool(tool: ToolDefinition): void {
  if (tools.has(tool.slug)) return // first registered wins
  tools.set(tool.slug, tool)
}

export function getTool(slug: string): ToolDefinition | undefined {
  return tools.get(slug)
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(tools.values()).sort((a, b) => {
    const ca = categories.get(a.category)?.sortOrder ?? 999
    const cb = categories.get(b.category)?.sortOrder ?? 999
    if (ca !== cb) return ca - cb
    return (a.sortOrder || 0) - (b.sortOrder || 0)
  })
}

export function getCategories(): ToolCategory[] {
  return Array.from(categories.values()).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getToolsByCategory(catSlug: string): ToolDefinition[] {
  return getAllTools().filter(t => t.category === catSlug)
}

export function searchTools(query: string): ToolDefinition[] {
  const q = query.toLowerCase().trim()
  if (!q) return getAllTools()
  return getAllTools().filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.slug.toLowerCase().includes(q) ||
    (t.tags || []).some(tag => tag.toLowerCase().includes(q))
  )
}

// ----- Default categories -----
registerCategory({ slug: 'developer', name: 'Developer', icon: 'Code', sortOrder: 10, description: 'Tools for everyday developer tasks' })
registerCategory({ slug: 'seo', name: 'SEO', icon: 'Search', sortOrder: 20, description: 'Search engine optimization tools' })
registerCategory({ slug: 'marketing', name: 'Marketing', icon: 'Megaphone', sortOrder: 30, description: 'Marketing calculators and builders' })
registerCategory({ slug: 'content', name: 'Content', icon: 'PenTool', sortOrder: 40, description: 'Content writing helpers' })
registerCategory({ slug: 'local-seo', name: 'Local SEO', icon: 'MapPin', sortOrder: 50, description: 'Local business SEO tools' })
registerCategory({ slug: 'it-tools', name: 'IT Tools', icon: 'Server', sortOrder: 60, description: 'Network & server utilities' })
registerCategory({ slug: 'utility', name: 'Utility', icon: 'Wrench', sortOrder: 70, description: 'General-purpose utilities' })
registerCategory({ slug: 'pdf-tools', name: 'PDF Tools', icon: 'FileText', sortOrder: 80, description: 'PDF manipulation (Pro)' })
registerCategory({ slug: 'google-business', name: 'Google Business', icon: 'Store', sortOrder: 90, description: 'GBP audit tools' })
registerCategory({ slug: 'ai-tools', name: 'AI Tools', icon: 'Sparkles', sortOrder: 100, description: 'AI-powered utilities' })
