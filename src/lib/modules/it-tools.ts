/**
 * IT Tools module (6 tools, all free)
 */
import { registerTool } from '../tools/registry'
import dns from 'dns/promises'

registerTool({
  slug: 'dns-lookup',
  title: 'DNS Lookup',
  category: 'it-tools',
  description: 'Fetch DNS records for a domain.',
  icon: 'Server',
  accessLevel: 'free',
  module: 'it-tools',
  sortOrder: 1,
  fields: [
    { name: 'domain', label: 'Domain', type: 'text', required: true, placeholder: 'example.com' },
    {
      name: 'types', label: 'Record types', type: 'select', defaultValue: 'all',
      options: [
        { value: 'all', label: 'All' },
        { value: 'A', label: 'A (IPv4)' },
        { value: 'AAAA', label: 'AAAA (IPv6)' },
        { value: 'MX', label: 'MX (mail)' },
        { value: 'NS', label: 'NS (nameserver)' },
        { value: 'TXT', label: 'TXT' },
        { value: 'SOA', label: 'SOA' },
        { value: 'CNAME', label: 'CNAME' },
      ],
    },
  ],
  handler: async (input) => {
    let domain = (input.domain || '').replace(/^https?:\/\//, '').trim().replace(/\/.*$/, '')
    if (!domain) return { output: 'No domain provided.' }
    const types = input.types === 'all' ? ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CNAME'] : [input.types]
    let out = `DNS records for ${domain}\n${'='.repeat(50)}\n\n`
    let found = 0
    for (const t of types) {
      try {
        const records = await dns.resolve(domain, t as any)
        if (records && records.length > 0) {
          out += `[${t}]\n`
          for (const r of records) {
            out += `  ${typeof r === 'object' ? JSON.stringify(r) : r}\n`
          }
          out += '\n'
          found++
        }
      } catch (e: any) {
        if (e.code !== 'ENODATA' && e.code !== 'ENOTFOUND') {
          // silent
        }
      }
    }
    if (found === 0) out += 'No records found.'
    return { output: out }
  },
})

registerTool({
  slug: 'whois-lookup',
  title: 'WHOIS Lookup',
  category: 'it-tools',
  description: 'WHOIS for domains (via RDAP) and IPs (via ARIN).',
  icon: 'CircleHelp',
  accessLevel: 'free',
  module: 'it-tools',
  sortOrder: 2,
  fields: [
    { name: 'target', label: 'Domain or IP', type: 'text', required: true, placeholder: 'example.com or 8.8.8.8' },
  ],
  handler: async (input) => {
    const target = (input.target || '').trim()
    if (!target) return { output: 'No target provided.' }
    const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(target)
    const url = isIP
      ? `https://whois.arin.net/rest/ip/${target}.txt`
      : `https://rdap.org/domain/${target}`
    try {
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })
      if (!resp.ok) return { output: `Lookup failed (HTTP ${resp.status}).` }
      const text = await resp.text()
      try {
        const json = JSON.parse(text)
        return { output: JSON.stringify(json, null, 2) }
      } catch {
        return { output: text }
      }
    } catch (e: any) {
      return { output: `Lookup failed: ${e.message}` }
    }
  },
})

registerTool({
  slug: 'ip-lookup',
  title: 'IP Lookup',
  category: 'it-tools',
  description: 'Geolocate an IP address.',
  icon: 'MapPin',
  accessLevel: 'free',
  module: 'it-tools',
  sortOrder: 3,
  fields: [
    { name: 'ip', label: 'IP address', type: 'text', required: true, placeholder: '8.8.8.8' },
  ],
  handler: async (input) => {
    const ip = (input.ip || '').trim()
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return { output: 'Invalid IPv4 address.' }
    try {
      const resp = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(15000) })
      if (!resp.ok) return { output: `Lookup failed (HTTP ${resp.status}).` }
      const data = await resp.json() as any
      let out = `IP: ${ip}\n\n`
      const fields = ['city', 'region', 'country_name', 'postal', 'latitude', 'longitude', 'timezone', 'org', 'asn', 'network']
      for (const f of fields) {
        if (data[f] !== undefined && data[f] !== null) {
          out += `${f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}: ${data[f]}\n`
        }
      }
      return { output: out }
    } catch (e: any) {
      return { output: `Lookup failed: ${e.message}` }
    }
  },
})

registerTool({
  slug: 'port-checker',
  title: 'Port Checker',
  category: 'it-tools',
  description: 'Check if a TCP port is open on a host.',
  icon: 'Plug',
  accessLevel: 'free',
  module: 'it-tools',
  sortOrder: 4,
  fields: [
    { name: 'host', label: 'Host', type: 'text', required: true, placeholder: 'example.com' },
    { name: 'port', label: 'Port', type: 'number', required: true, defaultValue: 80, min: 1, max: 65535 },
    { name: 'timeout', label: 'Timeout (ms)', type: 'number', defaultValue: 3000, min: 500, max: 10000 },
  ],
  handler: async (input) => {
    const host = (input.host || '').trim()
    const port = parseInt(input.port || '80', 10)
    const timeout = parseInt(input.timeout || '3000', 10)
    if (!host) return { output: 'Host required.' }
    const net = await import('net')
    return new Promise((resolve) => {
      const start = Date.now()
      const sock = new net.Socket()
      sock.setTimeout(timeout)
      sock.on('connect', () => {
        const elapsed = Date.now() - start
        sock.destroy()
        resolve({ output: `✓ Port ${port} on ${host} is OPEN\nResponse time: ${elapsed}ms` })
      })
      sock.on('timeout', () => {
        sock.destroy()
        resolve({ output: `✕ Port ${port} on ${host} is CLOSED or unreachable (timeout after ${timeout}ms)` })
      })
      sock.on('error', (err) => {
        sock.destroy()
        resolve({ output: `✕ Port ${port} on ${host} is CLOSED or unreachable\nError: ${err.message}` })
      })
      sock.connect(port, host)
    })
  },
})

registerTool({
  slug: 'header-checker',
  title: 'HTTP Header Checker',
  category: 'it-tools',
  description: 'Inspect HTTP response headers.',
  icon: 'FileText',
  accessLevel: 'free',
  module: 'it-tools',
  sortOrder: 5,
  fields: [
    { name: 'url', label: 'URL', type: 'url', required: true },
    {
      name: 'method', label: 'Method', type: 'select', defaultValue: 'HEAD',
      options: [{ value: 'HEAD', label: 'HEAD' }, { value: 'GET', label: 'GET' }],
    },
  ],
  handler: async (input) => {
    const url = (input.url || '').trim()
    const method = input.method || 'HEAD'
    if (!url) return { output: 'URL required.' }
    try {
      const start = Date.now()
      const resp = await fetch(url, { method: method as any, redirect: 'follow', signal: AbortSignal.timeout(15000) })
      const elapsed = Date.now() - start
      let out = `HTTP headers for: ${url}\n${'='.repeat(60)}\n\n`
      out += `Status: ${resp.status} ${resp.statusText}\n`
      out += `Response time: ${elapsed}ms\n`
      out += `Final URL: ${resp.url}\n\n`
      out += `=== HEADERS ===\n`
      resp.headers.forEach((value, key) => {
        out += `${key}: ${value}\n`
      })
      out += `\n=== SECURITY ANALYSIS ===\n`
      const checks = [
        ['HTTPS in use', url.startsWith('https://')],
        ['Strict-Transport-Security (HSTS)', resp.headers.has('strict-transport-security')],
        ['X-Content-Type-Options: nosniff', resp.headers.get('x-content-type-options') === 'nosniff'],
        ['X-Frame-Options', !!resp.headers.get('x-frame-options')],
        ['Content-Security-Policy', !!resp.headers.get('content-security-policy')],
        ['Referrer-Policy', !!resp.headers.get('referrer-policy')],
      ]
      for (const [name, ok] of checks) {
        out += `${ok ? '✓' : '✕'} ${name}\n`
      }
      return { output: out }
    } catch (e: any) {
      return { output: `Request failed: ${e.message}` }
    }
  },
})

registerTool({
  slug: 'user-agent-analyzer',
  title: 'User-Agent Analyzer',
  category: 'it-tools',
  description: 'Parse a User-Agent string.',
  icon: 'Monitor',
  accessLevel: 'free',
  module: 'it-tools',
  sortOrder: 6,
  fields: [
    { name: 'ua', label: 'User-Agent string', type: 'textarea', rows: 3, required: true },
  ],
  handler: async (input) => {
    const ua = input.ua || ''
    if (!ua) return { output: 'No User-Agent provided.' }
    let browser = 'Unknown', browserVer = ''
    if (/Edg\/([\d.]+)/.test(ua)) { browser = 'Microsoft Edge'; browserVer = RegExp.$1 }
    else if (/Chrome\/([\d.]+)/.test(ua)) { browser = 'Google Chrome'; browserVer = RegExp.$1 }
    else if (/Firefox\/([\d.]+)/.test(ua)) { browser = 'Mozilla Firefox'; browserVer = RegExp.$1 }
    else if (/Version\/([\d.]+).*Safari/.test(ua)) { browser = 'Safari'; browserVer = RegExp.$1 }
    else if (/MSIE ([\d.]+)/.test(ua) || /Trident\/[\d.]+/.test(ua)) { browser = 'Internet Explorer' }
    let os = 'Unknown'
    if (/Windows NT 10/.test(ua)) os = 'Windows 10/11'
    else if (/Windows NT 6\.3/.test(ua)) os = 'Windows 8.1'
    else if (/Windows/.test(ua)) os = 'Windows'
    else if (/Mac OS X ([\d_]+)/.test(ua)) os = `macOS ${RegExp.$1.replace(/_/g, '.')}`
    else if (/Android ([\d.]+)/.test(ua)) os = `Android ${RegExp.$1}`
    else if (/iPhone OS ([\d_]+)/.test(ua) || /iPad.*OS ([\d_]+)/.test(ua)) os = `iOS ${RegExp.$1.replace(/_/g, '.')}`
    else if (/Linux/.test(ua)) os = 'Linux'
    let device = 'Desktop'
    if (/Mobile|Android|iPhone/.test(ua)) device = 'Mobile'
    else if (/iPad|Tablet/.test(ua)) device = 'Tablet'
    const isBot = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit/i.test(ua)
    let out = `=== USER-AGENT ANALYSIS ===\n\n`
    out += `Browser:    ${browser}${browserVer ? ` ${browserVer}` : ''}\n`
    out += `OS:          ${os}\n`
    out += `Device:      ${device}\n`
    out += `Is bot:      ${isBot ? 'Yes' : 'No'}\n\n`
    out += `=== FULL UA STRING ===\n${ua}\n`
    return { output: out }
  },
})
