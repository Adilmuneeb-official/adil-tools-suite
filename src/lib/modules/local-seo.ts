/**
 * Local SEO Tools module (3 tools, all free)
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'citation-checker',
  title: 'Citation Checker',
  category: 'local-seo',
  description: 'Check NAP consistency across major directories (demo data).',
  icon: 'ListChecks',
  accessLevel: 'free',
  module: 'local-seo',
  sortOrder: 1,
  fields: [
    { name: 'business', label: 'Business name', type: 'text', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'address', label: 'Address', type: 'text' },
  ],
  handler: async (input) => {
    const business = input.business || 'Your Business'
    const dirs = [
      { name: 'Google Business Profile', found: true,  nap: 'Match',    note: 'Verified, accurate.' },
      { name: 'Yelp',                    found: true,  nap: 'Partial',  note: 'Phone number outdated.' },
      { name: 'Facebook',                found: true,  nap: 'Match',    note: 'Address matches.' },
      { name: 'Bing Places',             found: false, nap: '—',        note: 'Not listed. Add listing.' },
      { name: 'Apple Maps',              found: true,  nap: 'Mismatch', note: 'Old address shown.' },
      { name: 'YellowPages',             found: true,  nap: 'Match',    note: 'Accurate.' },
      { name: 'TripAdvisor',             found: false, nap: '—',        note: 'Not applicable for this category.' },
      { name: 'Foursquare',              found: true,  nap: 'Partial',  note: 'Phone missing.' },
      { name: 'Trustpilot',              found: true,  nap: 'Match',    note: 'Accurate.' },
      { name: 'Better Business Bureau',  found: false, nap: '—',        note: 'Not registered. Recommended.' },
    ]
    const found = dirs.filter(d => d.found).length
    const matches = dirs.filter(d => d.nap === 'Match').length
    const issues = dirs.filter(d => d.found && d.nap !== 'Match').length
    let out = `Citation check for: ${business}\n${'='.repeat(60)}\n\n`
    out += `SUMMARY: ${found}/${dirs.length} directories found, ${matches} full NAP matches, ${issues} need attention\n\n`
    out += `Directory`.padEnd(28) + `Found`.padStart(7) + `NAP`.padStart(12) + `  Notes\n`
    out += `-`.repeat(80) + `\n`
    for (const d of dirs) {
      out += d.name.padEnd(28) + (d.found ? 'Yes'.padStart(7) : 'No'.padStart(7)) + d.nap.padStart(12) + `  ${d.note}\n`
    }
    out += `\nNote: This is a demo with simulated data. For live citation checks, integrate with directory APIs (BrightLocal, Yext, Whitespark).`
    return { output: out }
  },
})

registerTool({
  slug: 'nap-consistency-checker',
  title: 'NAP Consistency Checker',
  category: 'local-seo',
  description: 'Analyze name/address/phone data for consistency.',
  icon: 'ClipboardCheck',
  accessLevel: 'free',
  module: 'local-seo',
  sortOrder: 2,
  fields: [
    { name: 'nap1', label: 'NAP variant 1 (name, address, phone)', type: 'textarea', rows: 4, required: true },
    { name: 'nap2', label: 'NAP variant 2', type: 'textarea', rows: 4, required: true },
    { name: 'nap3', label: 'NAP variant 3 (optional)', type: 'textarea', rows: 4 },
  ],
  handler: async (input) => {
    const variants = [input.nap1 || '', input.nap2 || '', input.nap3 || ''].filter(v => v.trim())
    if (variants.length < 2) return { output: 'Provide at least 2 NAP variants.' }
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[.,]/g, '').trim()
    let out = `Comparing ${variants.length} NAP variants:\n${'='.repeat(60)}\n\n`
    let avgSim = 0
    let comparisons = 0
    for (let i = 0; i < variants.length; i++) {
      for (let j = i + 1; j < variants.length; j++) {
        const a = normalize(variants[i])
        const b = normalize(variants[j])
        const longer = a.length > b.length ? a : b
        const shorter = a.length > b.length ? b : a
        const dist = Array(shorter.length + 1).fill(0).map(() => Array(longer.length + 1).fill(0))
        for (let x = 0; x <= shorter.length; x++) dist[x][0] = x
        for (let y = 0; y <= longer.length; y++) dist[0][y] = y
        for (let x = 1; x <= shorter.length; x++) {
          for (let y = 1; y <= longer.length; y++) {
            const cost = shorter[x - 1] === longer[y - 1] ? 0 : 1
            dist[x][y] = Math.min(dist[x - 1][y] + 1, dist[x][y - 1] + 1, dist[x - 1][y - 1] + cost)
          }
        }
        const lev = dist[shorter.length][longer.length]
        const sim = Math.max(0, ((longer.length - lev) / longer.length) * 100)
        avgSim += sim
        comparisons++
        out += `Variant ${i + 1} vs Variant ${j + 1}: ${sim.toFixed(1)}% similar\n`
      }
    }
    avgSim = avgSim / comparisons
    const verdict = avgSim >= 95 ? 'Consistent ✓' : avgSim >= 80 ? 'Mostly consistent' : avgSim >= 60 ? 'Inconsistent — fix discrepancies' : 'Highly inconsistent — critical'
    out += `\nAverage similarity: ${avgSim.toFixed(1)}%\nVerdict: ${verdict}\n\n`
    out += `=== Variants ===\n`
    variants.forEach((v, i) => { out += `\nVariant ${i + 1}:\n${v}\n` })
    return { output: out }
  },
})

registerTool({
  slug: 'local-schema-generator',
  title: 'Local Schema Generator',
  category: 'local-seo',
  description: 'Generate LocalBusiness JSON-LD schema markup.',
  icon: 'Store',
  accessLevel: 'free',
  module: 'local-seo',
  sortOrder: 3,
  fields: [
    { name: 'name', label: 'Business name', type: 'text', required: true },
    { name: 'street', label: 'Street address', type: 'text', required: true },
    { name: 'city', label: 'City', type: 'text', required: true },
    { name: 'region', label: 'State/Region', type: 'text' },
    { name: 'postal', label: 'Postal code', type: 'text' },
    { name: 'country', label: 'Country', type: 'text', defaultValue: 'AE' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'url', label: 'Website', type: 'url' },
    { name: 'hours', label: 'Opening hours', type: 'text', defaultValue: 'Mo-Fr 09:00-17:00' },
    { name: 'lat', label: 'Latitude', type: 'text' },
    { name: 'lng', label: 'Longitude', type: 'text' },
    { name: 'priceRange', label: 'Price range', type: 'text', placeholder: '$$, $$$' },
    {
      name: 'businessType', label: 'Business type', type: 'select', defaultValue: 'LocalBusiness',
      options: [
        { value: 'LocalBusiness', label: 'LocalBusiness (generic)' },
        { value: 'Restaurant', label: 'Restaurant' },
        { value: 'Store', label: 'Store' },
        { value: 'HealthAndBeautyBusiness', label: 'Health & Beauty' },
        { value: 'ProfessionalService', label: 'Professional Service' },
        { value: 'AutomotiveBusiness', label: 'Automotive' },
        { value: 'LodgingBusiness', label: 'Lodging / Hotel' },
      ],
    },
  ],
  handler: async (input) => {
    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': input.businessType || 'LocalBusiness',
      name: input.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: input.street,
        addressLocality: input.city,
        addressRegion: input.region || '',
        postalCode: input.postal || '',
        addressCountry: input.country || '',
      },
      telephone: input.phone || '',
      url: input.url || '',
      openingHours: input.hours || '',
    }
    if (input.priceRange) schema.priceRange = input.priceRange
    if (input.lat && input.lng) {
      schema.geo = { '@type': 'GeoCoordinates', latitude: parseFloat(input.lat), longitude: parseFloat(input.lng) }
    }
    return { output: `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>` }
  },
})
