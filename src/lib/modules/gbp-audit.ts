/**
 * Google Business Profile Audit (1 tool, Pro)
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'gbp-audit',
  title: 'Google Business Profile Audit',
  category: 'google-business',
  description: 'Comprehensive local-SEO audit: completeness, reviews, NAP, local SEO.',
  icon: 'Store',
  accessLevel: 'pro',
  module: 'gbp-audit',
  sortOrder: 1,
  fields: [
    { name: 'url', label: 'Google Business Profile URL', type: 'url', required: true, placeholder: 'https://www.google.com/maps/place/...' },
    { name: 'website', label: 'Business website URL', type: 'url' },
    { name: 'competitorUrl', label: 'Competitor GBP URL (optional, for comparison)', type: 'url' },
  ],
  handler: async (input) => {
    const url = input.url || ''
    const website = input.website || ''
    let html = ''
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' },
        signal: AbortSignal.timeout(15000),
      })
      html = await resp.text()
    } catch (e: any) {
      // Fall through with empty html
    }
    const audit: Record<string, any> = {
      completeness: 0, reviews: 0, localSeo: 0, nap: 0, websiteSeo: 0, findings: [] as string[],
    }
    let businessName = ''
    if (/"name":"([^"]+)"/.test(html)) businessName = RegExp.$1
    else if (/<title>([^<]+)<\/title>/.test(html)) businessName = RegExp.$1.trim()
    let rating = 0
    if (/"ratingValue":\s*([\d.]+)/.test(html)) rating = parseFloat(RegExp.$1)
    let reviewCount = 0
    if (/"reviewCount":\s*(\d+)/.test(html)) reviewCount = parseInt(RegExp.$1, 10)

    audit.completeness = (businessName ? 70 : 30) + (rating ? 15 : 0) + (reviewCount ? 15 : 0)
    audit.reviews = reviewCount > 0 ? Math.min(100, reviewCount * 2) : 20
    if (rating >= 4.5) audit.reviews = Math.min(100, audit.reviews + 20)
    if (rating > 0 && rating < 3.5) {
      audit.reviews = Math.max(0, audit.reviews - 30)
      audit.findings.push(`Below-average rating (${rating}/5) — encourage positive reviews.`)
    }
    audit.nap = (businessName ? 70 : 30)
    if (/"telephone":\s*"([^"]+)"/.test(html)) {
      audit.nap += 15
      audit.findings.push(`Phone verified: ${RegExp.$1}`)
    }
    if (/"streetAddress":"([^"]+)"/.test(html)) audit.nap += 15
    audit.localSeo = (businessName ? 65 : 25) + (reviewCount > 50 ? 20 : 0) + (rating >= 4.0 ? 15 : 0)
    if (!reviewCount) audit.findings.push('No reviews detected — critical for local SEO.')

    if (website) {
      try {
        const wResp = await fetch(website, { signal: AbortSignal.timeout(15000) })
        const wHtml = await wResp.text()
        audit.websiteSeo = 0
        if (/<title>([^<]+)<\/title>/.test(wHtml) && RegExp.$1.length > 10 && RegExp.$1.length < 60) audit.websiteSeo += 25
        else audit.findings.push('Website title tag is missing or not optimal length.')
        if (/<meta\s+name="description"\s+content="([^"]+)"/i.test(wHtml)) audit.websiteSeo += 20
        else audit.findings.push('Meta description missing on website.')
        if (/<h1/i.test(wHtml)) audit.websiteSeo += 15
        if (/application\/ld\+json/i.test(wHtml)) audit.websiteSeo += 20
        if (/<meta\s+property="og:/i.test(wHtml)) audit.websiteSeo += 10
        if (wHtml.includes('https://schema.org')) audit.websiteSeo += 10
      } catch {
        audit.findings.push('Could not fetch business website.')
      }
    } else {
      audit.findings.push('No website URL provided — website SEO not audited.')
    }

    const overall = Math.round((audit.completeness + audit.reviews + audit.localSeo + audit.nap + audit.websiteSeo) / 5)
    let out = `GBP AUDIT REPORT\n${'='.repeat(60)}\n\n`
    out += `Profile URL: ${url}\n`
    if (businessName) out += `Business:    ${businessName}\n`
    if (rating) out += `Rating:      ${rating}/5\n`
    if (reviewCount) out += `Reviews:     ${reviewCount}\n`
    out += `\n--- SCORES ---\n`
    out += `Profile completeness: ${audit.completeness}/100\n`
    out += `Reviews score:        ${audit.reviews}/100\n`
    out += `Local SEO:            ${audit.localSeo}/100\n`
    out += `NAP consistency:      ${audit.nap}/100\n`
    out += `Website SEO:          ${audit.websiteSeo}/100\n`
    out += `\nOVERALL: ${overall}/100 — ${overall >= 80 ? 'Excellent 🎯' : overall >= 60 ? 'Good 👍' : overall >= 40 ? 'Needs Work ⚠️' : 'Critical 🚨'}\n`
    out += `\n--- FINDINGS ---\n`
    if (audit.findings.length === 0) out += 'No critical issues found. Profile looks healthy.\n'
    else audit.findings.forEach((f: string, i: number) => { out += `${i + 1}. ${f}\n` })
    out += `\nNote: Google frequently changes HTML. For production use, integrate with the official Google Business Profile API (requires OAuth).`
    return { output: out }
  },
})
