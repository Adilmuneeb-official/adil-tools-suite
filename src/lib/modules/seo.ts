/**
 * SEO Tools module (7 tools, all free)
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'meta-tag-generator',
  title: 'Meta Tag Generator',
  category: 'seo',
  description: 'Generate title, description, keywords, robots, canonical, OG meta tags.',
  icon: 'Tags',
  accessLevel: 'free',
  module: 'seo',
  sortOrder: 1,
  fields: [
    { name: 'title', label: 'Page title', type: 'text', required: true },
    { name: 'description', label: 'Meta description', type: 'textarea', rows: 3 },
    { name: 'keywords', label: 'Keywords (comma-separated)', type: 'text' },
    { name: 'url', label: 'Canonical URL', type: 'url' },
    {
      name: 'robots', label: 'Robots', type: 'select', defaultValue: 'index,follow',
      options: [
        { value: 'index,follow', label: 'index, follow' },
        { value: 'noindex,nofollow', label: 'noindex, nofollow' },
        { value: 'index,nofollow', label: 'index, nofollow' },
        { value: 'noindex,follow', label: 'noindex, follow' },
      ],
    },
    { name: 'ogImage', label: 'OG Image URL', type: 'url' },
    { name: 'author', label: 'Author', type: 'text' },
  ],
  handler: async (input) => {
    const esc = (s: string) => (s || '').replace(/"/g, '&quot;')
    let out = ''
    if (input.title) out += `<title>${input.title}</title>\n`
    if (input.description) out += `<meta name="description" content="${esc(input.description)}">\n`
    if (input.keywords) out += `<meta name="keywords" content="${esc(input.keywords)}">\n`
    out += `<meta name="robots" content="${input.robots || 'index,follow'}">\n`
    if (input.author) out += `<meta name="author" content="${esc(input.author)}">\n`
    if (input.url) out += `<link rel="canonical" href="${input.url}">\n`
    out += '\n<!-- Open Graph -->\n'
    out += `<meta property="og:title" content="${esc(input.title || '')}">\n`
    if (input.description) out += `<meta property="og:description" content="${esc(input.description)}">\n`
    if (input.url) out += `<meta property="og:url" content="${input.url}">\n`
    if (input.ogImage) out += `<meta property="og:image" content="${input.ogImage}">\n`
    out += `<meta property="og:type" content="website">\n`
    out += `\n<!-- Twitter Card -->\n`
    out += `<meta name="twitter:card" content="summary_large_image">\n`
    out += `<meta name="twitter:title" content="${esc(input.title || '')}">\n`
    if (input.description) out += `<meta name="twitter:description" content="${esc(input.description)}">\n`
    if (input.ogImage) out += `<meta name="twitter:image" content="${input.ogImage}">\n`
    return { output: out }
  },
})

registerTool({
  slug: 'schema-generator',
  title: 'Schema Generator',
  category: 'seo',
  description: 'JSON-LD for Article, LocalBusiness, FAQ, Product, Person.',
  icon: 'Sitemap',
  accessLevel: 'free',
  module: 'seo',
  sortOrder: 2,
  fields: [
    {
      name: 'type', label: 'Schema type', type: 'select', defaultValue: 'Article',
      options: [
        { value: 'Article', label: 'Article' },
        { value: 'LocalBusiness', label: 'LocalBusiness' },
        { value: 'FAQPage', label: 'FAQ Page' },
        { value: 'Product', label: 'Product' },
        { value: 'Person', label: 'Person' },
        { value: 'Recipe', label: 'Recipe' },
        { value: 'Event', label: 'Event' },
      ],
    },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'url', label: 'URL', type: 'url' },
    { name: 'image', label: 'Image URL', type: 'url' },
    { name: 'author', label: 'Author name (for Article)', type: 'text' },
    { name: 'datePublished', label: 'Date published (YYYY-MM-DD)', type: 'date' },
    { name: 'price', label: 'Price (for Product)', type: 'number' },
    { name: 'currency', label: 'Currency (for Product)', type: 'text', defaultValue: 'USD' },
  ],
  handler: async (input) => {
    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': input.type,
      name: input.name,
    }
    if (input.description) schema.description = input.description
    if (input.url) schema.url = input.url
    if (input.image) schema.image = input.image
    if (input.author && input.type === 'Article') {
      schema.author = { '@type': 'Person', name: input.author }
    }
    if (input.datePublished) schema.datePublished = input.datePublished
    if (input.type === 'Product' && input.price) {
      schema.offers = {
        '@type': 'Offer',
        price: String(input.price),
        priceCurrency: input.currency || 'USD',
        availability: 'https://schema.org/InStock',
      }
    }
    if (input.type === 'FAQPage') {
      schema.mainEntity = [{
        '@type': 'Question',
        name: 'Example question?',
        acceptedAnswer: { '@type': 'Answer', text: 'Example answer.' },
      }]
    }
    if (input.type === 'LocalBusiness') {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: '123 Main St',
        addressLocality: 'Dubai',
        addressCountry: 'AE',
      }
      schema.telephone = '+971500000000'
      schema.openingHours = 'Mo-Fr 09:00-17:00'
    }
    if (input.type === 'Person') {
      schema.jobTitle = 'Professional'
    }
    if (input.type === 'Recipe') {
      schema.cookTime = 'PT30M'
      schema.recipeYield = '4 servings'
      schema.ingredients = ['ingredient 1', 'ingredient 2']
    }
    return { output: `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>` }
  },
})

registerTool({
  slug: 'robots-txt-generator',
  title: 'Robots.txt Generator',
  category: 'seo',
  description: 'Generate robots.txt with allow/disallow + sitemap URL.',
  icon: 'Bot',
  accessLevel: 'free',
  module: 'seo',
  sortOrder: 3,
  fields: [
    { name: 'sitemap', label: 'Sitemap URL', type: 'url', placeholder: 'https://yoursite.com/sitemap.xml' },
    { name: 'disallow', label: 'Disallow paths (one per line)', type: 'textarea', rows: 6, defaultValue: '/wp-admin/\n/wp-includes/\n/cgi-bin/\n/*?s=\n/search/', help: 'These paths will be blocked from all crawlers' },
    {
      name: 'crawlDelay', label: 'Crawl delay (seconds)', type: 'number', min: 0, max: 30, defaultValue: 0,
      help: 'Set 0 to disable. Some search engines honor this.',
    },
  ],
  handler: async (input) => {
    let out = `User-agent: *\n`
    if (input.crawlDelay && parseInt(input.crawlDelay, 10) > 0) {
      out += `Crawl-delay: ${input.crawlDelay}\n`
    }
    const paths = (input.disallow || '').split('\n').map(s => s.trim()).filter(Boolean)
    for (const p of paths) out += `Disallow: ${p}\n`
    if (input.sitemap) {
      out += `\nSitemap: ${input.sitemap}\n`
    }
    return { output: out }
  },
})

registerTool({
  slug: 'sitemap-generator',
  title: 'Sitemap Generator',
  category: 'seo',
  description: 'Generate XML sitemap from URL list.',
  icon: 'Network',
  accessLevel: 'free',
  module: 'seo',
  sortOrder: 4,
  fields: [
    {
      name: 'urls', label: 'URLs (one per line)', type: 'textarea', rows: 10, required: true,
      placeholder: 'https://yoursite.com/\nhttps://yoursite.com/about',
    },
    {
      name: 'changefreq', label: 'Change frequency', type: 'select', defaultValue: 'monthly',
      options: ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map(v => ({ value: v, label: v })),
    },
    {
      name: 'priority', label: 'Priority', type: 'select', defaultValue: '0.8',
      options: ['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1'].map(v => ({ value: v, label: v })),
    },
  ],
  handler: async (input) => {
    const urls = (input.urls || '').split('\n').map(s => s.trim()).filter(Boolean)
    const cf = input.changefreq || 'monthly'
    const pr = input.priority || '0.8'
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    for (const url of urls) {
      try {
        new URL(url)
        xml += `  <url>\n    <loc>${url}</loc>\n    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>\n    <changefreq>${cf}</changefreq>\n    <priority>${pr}</priority>\n  </url>\n`
      } catch {}
    }
    xml += `</urlset>`
    return { output: xml }
  },
})

registerTool({
  slug: 'serp-preview',
  title: 'SERP Preview',
  category: 'seo',
  description: 'Preview how your page appears in Google search results.',
  icon: 'Search',
  accessLevel: 'free',
  module: 'seo',
  sortOrder: 5,
  fields: [
    { name: 'title', label: 'Title (max 60 chars)', type: 'text', required: true, maxLength: 60 },
    { name: 'url', label: 'URL', type: 'url', required: true },
    { name: 'description', label: 'Meta description (max 160 chars)', type: 'textarea', rows: 3 },
  ],
  handler: async (input) => {
    const title = (input.title || '').slice(0, 60)
    const url = input.url || ''
    const desc = (input.description || '').slice(0, 160)
    let out = `=== Google SERP Preview ===\n\n`
    out += `${url}\n`
    out += `${title}\n`
    out += `${desc}\n\n`
    out += `=== Lengths ===\n`
    out += `Title:       ${title.length} / 60 chars ${title.length > 60 ? '(TRUNCATED!)' : '✓'}\n`
    out += `Description: ${desc.length} / 160 chars ${desc.length > 160 ? '(TRUNCATED!)' : '✓'}\n`
    if (title.length < 30) out += `\n⚠ Title is short. Aim for 40-60 chars.\n`
    if (desc.length < 70) out += `⚠ Description is short. Aim for 120-160 chars.\n`
    return { output: out }
  },
})

registerTool({
  slug: 'keyword-density-checker',
  title: 'Keyword Density Checker',
  category: 'seo',
  description: 'Analyze text for keyword frequency and density.',
  icon: 'Percent',
  accessLevel: 'free',
  module: 'seo',
  sortOrder: 6,
  fields: [
    { name: 'text', label: 'Text to analyze', type: 'textarea', rows: 12, required: true },
    { name: 'minLength', label: 'Minimum word length', type: 'number', defaultValue: 3, min: 1, max: 10 },
    { name: 'topN', label: 'Show top N keywords', type: 'number', defaultValue: 20, min: 5, max: 100 },
  ],
  handler: async (input) => {
    const text = (input.text || '').toLowerCase()
    const minLen = parseInt(input.minLength || '3', 10)
    const topN = parseInt(input.topN || '20', 10)
    const stopWords = new Set(['the','a','an','and','or','but','of','to','in','for','on','at','by','with','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','can','this','that','these','those','i','you','he','she','it','we','they','them','their','his','her','its','our','your','my','me','him','us','as','if','so','not','no','yes','also','than','then','too','very','just','only','about','into','from','up','down','out','over','under','again','further','here','there','when','where','why','how','all','each','every','both','few','more','most','other','some','such','any','because','while','during','before','after','above','below','off','through'])
    const words = text.match(/\b[a-z]+\b/g) || []
    const total = words.length
    if (total === 0) return { output: 'No words found.' }
    const counts: Record<string, number> = {}
    for (const w of words) {
      if (w.length < minLen) continue
      if (stopWords.has(w)) continue
      counts[w] = (counts[w] || 0) + 1
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topN)
    let out = `Total words: ${total}\nAnalyzed words (after filtering): ${Object.values(counts).reduce((a, b) => a + b, 0)}\n\nTop ${sorted.length} keywords:\n\n`
    out += `Word`.padEnd(25) + `Count`.padStart(8) + `Density`.padStart(12) + `\n`
    out += `-`.repeat(45) + `\n`
    for (const [w, c] of sorted) {
      const d = ((c / total) * 100).toFixed(2)
      out += w.padEnd(25) + String(c).padStart(8) + (d + '%').padStart(12) + `\n`
    }
    return { output: out }
  },
})

registerTool({
  slug: 'og-generator',
  title: 'Open Graph Generator',
  category: 'seo',
  description: 'Generate Open Graph + Twitter Card meta tags.',
  icon: 'Share2',
  accessLevel: 'free',
  module: 'seo',
  sortOrder: 7,
  fields: [
    { name: 'title', label: 'OG Title', type: 'text', required: true },
    { name: 'description', label: 'OG Description', type: 'textarea', rows: 3 },
    { name: 'url', label: 'OG URL', type: 'url' },
    { name: 'image', label: 'OG Image URL (1200x630)', type: 'url' },
    {
      name: 'type', label: 'OG Type', type: 'select', defaultValue: 'website',
      options: ['website', 'article', 'product', 'profile', 'video.movie'].map(v => ({ value: v, label: v })),
    },
    {
      name: 'twitterCard', label: 'Twitter Card type', type: 'select', defaultValue: 'summary_large_image',
      options: ['summary', 'summary_large_image', 'player', 'app'].map(v => ({ value: v, label: v })),
    },
    { name: 'siteName', label: 'Site name', type: 'text' },
    { name: 'twitterHandle', label: 'Twitter @handle', type: 'text', placeholder: '@yoursite' },
  ],
  handler: async (input) => {
    const esc = (s: string) => (s || '').replace(/"/g, '&quot;')
    let out = `<!-- Open Graph -->\n`
    out += `<meta property="og:title" content="${esc(input.title)}">\n`
    if (input.description) out += `<meta property="og:description" content="${esc(input.description)}">\n`
    if (input.url) out += `<meta property="og:url" content="${input.url}">\n`
    if (input.image) out += `<meta property="og:image" content="${input.image}">\n`
    out += `<meta property="og:type" content="${input.type || 'website'}">\n`
    if (input.siteName) out += `<meta property="og:site_name" content="${esc(input.siteName)}">\n`
    out += `\n<!-- Twitter Card -->\n`
    out += `<meta name="twitter:card" content="${input.twitterCard || 'summary_large_image'}">\n`
    out += `<meta name="twitter:title" content="${esc(input.title)}">\n`
    if (input.description) out += `<meta name="twitter:description" content="${esc(input.description)}">\n`
    if (input.image) out += `<meta name="twitter:image" content="${input.image}">\n`
    if (input.twitterHandle) out += `<meta name="twitter:site" content="${input.twitterHandle}">\n`
    return { output: out }
  },
})
