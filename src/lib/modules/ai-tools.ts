/**
 * AI Tools module (3 placeholders — Pro/Agency)
 *
 * These demonstrate the architecture. Wire to real LLM APIs by replacing
 * the handler's "placeholder" section with a fetch call to your LLM.
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'ai-meta-description',
  title: 'AI Meta Description Generator',
  category: 'ai-tools',
  description: 'Generate SEO-optimized meta descriptions with AI.',
  icon: 'Sparkles',
  accessLevel: 'pro',
  module: 'ai-tools',
  sortOrder: 1,
  fields: [
    { name: 'title', label: 'Page title', type: 'text', required: true },
    { name: 'content', label: 'Content summary', type: 'textarea', rows: 6 },
    {
      name: 'tone', label: 'Tone', type: 'select', defaultValue: 'professional',
      options: [
        { value: 'professional', label: 'Professional' },
        { value: 'casual', label: 'Casual' },
        { value: 'persuasive', label: 'Persuasive' },
        { value: 'informative', label: 'Informative' },
      ],
    },
    { name: 'count', label: 'Number of variations', type: 'number', defaultValue: 3, min: 1, max: 10 },
  ],
  handler: async (input) => {
    const title = input.title || ''
    const count = Math.min(10, Math.max(1, parseInt(input.count || '3', 10)))
    // TODO: Replace with real LLM call (OpenAI, Anthropic, Gemini)
    const suggestions = [
      `Discover ${title} — expert insights and actionable tips. Click to learn more.`,
      `${title} explained in plain English. Free guide, examples, and best practices inside.`,
      `Looking for ${title}? Get the complete 2025 guide with proven strategies. Read now.`,
      `${title} made simple. Step-by-step advice from industry pros. Start here.`,
      `The ultimate resource on ${title}. Practical guidance, real examples, and tools.`,
    ].slice(0, count)
    let out = `AI-generated meta descriptions for: "${title}"\n\n`
    suggestions.forEach((s, i) => {
      const len = s.length
      const tag = len > 160 ? ' [TOO LONG]' : len < 120 ? ' [short]' : ' ✓'
      out += `${i + 1}. [${len} chars${tag}]\n   "${s}"\n\n`
    })
    out += `Note: Placeholder output. Connect your LLM API key in admin settings to enable real AI generation.`
    return { output: out }
  },
})

registerTool({
  slug: 'ai-blog-outline',
  title: 'AI Blog Outline Generator',
  category: 'ai-tools',
  description: 'Generate structured blog post outlines with AI.',
  icon: 'ListTree',
  accessLevel: 'pro',
  module: 'ai-tools',
  sortOrder: 2,
  fields: [
    { name: 'topic', label: 'Blog topic', type: 'text', required: true },
    { name: 'keyword', label: 'Target keyword', type: 'text' },
    {
      name: 'audience', label: 'Target audience', type: 'select', defaultValue: 'general',
      options: [
        { value: 'general', label: 'General audience' },
        { value: 'beginners', label: 'Beginners' },
        { value: 'professionals', label: 'Professionals' },
        { value: 'technical', label: 'Technical readers' },
      ],
    },
    { name: 'sections', label: 'Number of sections', type: 'number', defaultValue: 7, min: 3, max: 15 },
  ],
  handler: async (input) => {
    const t = input.topic || 'your topic'
    const audience = input.audience || 'general'
    const sections = Math.min(15, Math.max(3, parseInt(input.sections || '7', 10)))
    // TODO: Replace with real LLM call
    const outline = [
      `1. Introduction — what is ${t} and why it matters in 2025`,
      `2. The fundamentals of ${t} (for ${audience})`,
      `3. Common challenges and how to overcome them`,
      `4. Best practices for ${t} — what actually works`,
      `5. Tools and resources to help you succeed`,
      `6. Real-world case studies and examples`,
      `7. Common myths and misconceptions about ${t}`,
      `8. Future trends — where ${t} is heading`,
      `9. Step-by-step getting started guide`,
      `10. Expert interviews and quotes`,
      `11. Comparison: top approaches to ${t}`,
      `12. Mistakes to avoid`,
      `13. Measuring success — KPIs and benchmarks`,
      `14. FAQ — answering the top questions`,
      `15. Conclusion — key takeaways and next steps`,
    ].slice(0, sections)
    let out = `# Blog outline: ${t}\n`
    out += `Target audience: ${audience}\n`
    if (input.keyword) out += `Target keyword: ${input.keyword}\n`
    out += `\n`
    out += outline.join('\n') + '\n'
    out += `\nNote: Placeholder output. Connect your LLM API to generate personalised, keyword-rich outlines.`
    return { output: out }
  },
})

registerTool({
  slug: 'ai-image-alt-text',
  title: 'AI Image Alt Text Generator',
  category: 'ai-tools',
  description: 'Generate accessibility-friendly alt text for images.',
  icon: 'ImagePlus',
  accessLevel: 'agency',
  module: 'ai-tools',
  sortOrder: 3,
  fields: [
    { name: 'file', label: 'Image (JPG/PNG/WebP)', type: 'file', required: true, accept: 'image/*' },
    { name: 'context', label: 'Surrounding context (optional)', type: 'text' },
    {
      name: 'style', label: 'Alt text style', type: 'select', defaultValue: 'concise',
      options: [
        { value: 'concise', label: 'Concise (1 sentence)' },
        { value: 'detailed', label: 'Detailed (2-3 sentences)' },
        { value: 'decorative', label: 'Mark as decorative' },
      ],
    },
  ],
  handler: async (input) => {
    // TODO: Replace with real vision LLM call (GPT-4 Vision, Claude 3 Vision, Gemini Vision)
    return {
      output: `AI Image Alt Text — demo mode

Real implementation:
1. Upload image to a temp storage (S3, local /tmp)
2. Send to vision LLM with prompt:
   "Describe this image for accessibility. Style: ${input.style}. Context: ${input.context || 'none'}"
3. Return the LLM's description as alt text

This tool requires an Agency subscription.`,
    }
  },
})
