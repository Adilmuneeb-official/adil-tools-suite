/**
 * Marketing Tools module (6 tools, all free)
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'utm-builder',
  title: 'UTM Builder',
  category: 'marketing',
  description: 'Build URLs with UTM tracking parameters.',
  icon: 'Link',
  accessLevel: 'free',
  module: 'marketing',
  sortOrder: 1,
  fields: [
    { name: 'url', label: 'Destination URL', type: 'url', required: true, placeholder: 'https://yoursite.com/landing' },
    { name: 'source', label: 'Campaign Source', type: 'text', required: true, placeholder: 'google, facebook, newsletter' },
    { name: 'medium', label: 'Campaign Medium', type: 'text', required: true, placeholder: 'cpc, social, email' },
    { name: 'campaign', label: 'Campaign Name', type: 'text', placeholder: 'spring_sale' },
    { name: 'term', label: 'Campaign Term (paid keywords)', type: 'text' },
    { name: 'content', label: 'Campaign Content (A/B variant)', type: 'text' },
  ],
  handler: async (input) => {
    try {
      const url = new URL(input.url)
      if (input.source) url.searchParams.set('utm_source', input.source)
      if (input.medium) url.searchParams.set('utm_medium', input.medium)
      if (input.campaign) url.searchParams.set('utm_campaign', input.campaign)
      if (input.term) url.searchParams.set('utm_term', input.term)
      if (input.content) url.searchParams.set('utm_content', input.content)
      return { output: url.toString() }
    } catch {
      return { output: 'Invalid URL.' }
    }
  },
})

registerTool({
  slug: 'roi-calculator',
  title: 'ROI Calculator',
  category: 'marketing',
  description: 'Calculate Return on Investment from revenue and cost.',
  icon: 'TrendingUp',
  accessLevel: 'free',
  module: 'marketing',
  sortOrder: 2,
  fields: [
    { name: 'revenue', label: 'Revenue ($)', type: 'number', required: true, min: 0 },
    { name: 'cost', label: 'Cost ($)', type: 'number', required: true, min: 0 },
  ],
  handler: async (input) => {
    const rev = parseFloat(input.revenue || '0')
    const cost = parseFloat(input.cost || '0')
    if (cost === 0) return { output: 'Cost must be greater than zero.' }
    const profit = rev - cost
    const roi = (profit / cost) * 100
    return {
      output: `Revenue:        $${rev.toFixed(2)}
Cost:           $${cost.toFixed(2)}
Profit:         $${profit.toFixed(2)}
ROI:            ${roi.toFixed(2)}%
${roi >= 100 ? 'Excellent return!' : roi >= 50 ? 'Good return.' : roi >= 0 ? 'Modest return.' : 'Loss — review strategy.'}`,
    }
  },
})

registerTool({
  slug: 'ctr-calculator',
  title: 'CTR Calculator',
  category: 'marketing',
  description: 'Calculate click-through rate from clicks and impressions.',
  icon: 'MousePointerClick',
  accessLevel: 'free',
  module: 'marketing',
  sortOrder: 3,
  fields: [
    { name: 'clicks', label: 'Clicks', type: 'number', required: true, min: 0 },
    { name: 'impressions', label: 'Impressions', type: 'number', required: true, min: 1 },
  ],
  handler: async (input) => {
    const c = parseFloat(input.clicks || '0')
    const i = parseFloat(input.impressions || '0')
    if (i === 0) return { output: 'Impressions must be > 0.' }
    const ctr = (c / i) * 100
    return {
      output: `Clicks:       ${c.toLocaleString()}
Impressions:  ${i.toLocaleString()}
CTR:          ${ctr.toFixed(2)}%
${ctr >= 5 ? 'Excellent CTR!' : ctr >= 2 ? 'Good CTR.' : ctr >= 1 ? 'Average CTR.' : 'Below average — optimize your creative.'}`,
    }
  },
})

registerTool({
  slug: 'cpc-calculator',
  title: 'CPC Calculator',
  category: 'marketing',
  description: 'Calculate cost per click.',
  icon: 'Coins',
  accessLevel: 'free',
  module: 'marketing',
  sortOrder: 4,
  fields: [
    { name: 'cost', label: 'Total Cost ($)', type: 'number', required: true, min: 0 },
    { name: 'clicks', label: 'Clicks', type: 'number', required: true, min: 1 },
  ],
  handler: async (input) => {
    const cost = parseFloat(input.cost || '0')
    const clicks = parseFloat(input.clicks || '0')
    if (clicks === 0) return { output: 'Clicks must be > 0.' }
    const cpc = cost / clicks
    return {
      output: `Cost:    $${cost.toFixed(2)}
Clicks:  ${clicks.toLocaleString()}
CPC:     $${cpc.toFixed(4)}
${cpc < 0.5 ? 'Excellent CPC!' : cpc < 2 ? 'Good CPC.' : cpc < 5 ? 'Average CPC.' : 'High CPC — review targeting.'}`,
    }
  },
})

registerTool({
  slug: 'conversion-calculator',
  title: 'Conversion Calculator',
  category: 'marketing',
  description: 'Calculate conversion rate.',
  icon: 'Target',
  accessLevel: 'free',
  module: 'marketing',
  sortOrder: 5,
  fields: [
    { name: 'conversions', label: 'Conversions', type: 'number', required: true, min: 0 },
    { name: 'visitors', label: 'Visitors', type: 'number', required: true, min: 1 },
  ],
  handler: async (input) => {
    const c = parseFloat(input.conversions || '0')
    const v = parseFloat(input.visitors || '0')
    if (v === 0) return { output: 'Visitors must be > 0.' }
    const rate = (c / v) * 100
    return {
      output: `Conversions:  ${c.toLocaleString()}
Visitors:     ${v.toLocaleString()}
Conv. rate:   ${rate.toFixed(2)}%
${rate >= 5 ? 'Excellent conversion!' : rate >= 2 ? 'Good conversion.' : rate >= 1 ? 'Average conversion.' : 'Below average — A/B test your CTA.'}`,
    }
  },
})

registerTool({
  slug: 'budget-calculator',
  title: 'Budget Calculator',
  category: 'marketing',
  description: 'Calculate daily/monthly budget from total budget and period.',
  icon: 'Wallet',
  accessLevel: 'free',
  module: 'marketing',
  sortOrder: 6,
  fields: [
    { name: 'total', label: 'Total Budget ($)', type: 'number', required: true, min: 0 },
    { name: 'days', label: 'Duration (days)', type: 'number', required: true, min: 1 },
  ],
  handler: async (input) => {
    const total = parseFloat(input.total || '0')
    const days = parseInt(input.days || '0', 10)
    if (days <= 0) return { output: 'Days must be > 0.' }
    const daily = total / days
    const weekly = daily * 7
    const monthly = daily * 30
    return {
      output: `Total budget:        $${total.toFixed(2)}
Duration:            ${days} days
Daily budget:        $${daily.toFixed(2)}
Weekly budget:       $${weekly.toFixed(2)}
Monthly budget (30d): $${monthly.toFixed(2)}`,
    }
  },
})
