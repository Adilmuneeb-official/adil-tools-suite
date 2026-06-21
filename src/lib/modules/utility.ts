/**
 * Utility Tools module (6 tools, all free)
 */
import { registerTool } from '../tools/registry'
import crypto from 'crypto'

registerTool({
  slug: 'password-generator',
  title: 'Password Generator',
  category: 'utility',
  description: 'Generate a strong random password.',
  icon: 'Key',
  accessLevel: 'free',
  module: 'utility',
  sortOrder: 1,
  fields: [
    { name: 'length', label: 'Length', type: 'number', defaultValue: 16, min: 4, max: 128 },
    { name: 'upper', label: 'Uppercase (A-Z)', type: 'checkbox', defaultValue: true },
    { name: 'lower', label: 'Lowercase (a-z)', type: 'checkbox', defaultValue: true },
    { name: 'numbers', label: 'Numbers (0-9)', type: 'checkbox', defaultValue: true },
    { name: 'symbols', label: 'Symbols (!@#$…)', type: 'checkbox', defaultValue: true },
    { name: 'excludeAmbiguous', label: 'Exclude ambiguous (0/O, 1/l, I)', type: 'checkbox' },
    { name: 'count', label: 'Generate count', type: 'number', defaultValue: 5, min: 1, max: 50 },
  ],
  handler: async (input) => {
    const len = Math.max(4, Math.min(128, parseInt(input.length || '16', 10)))
    const count = Math.max(1, Math.min(50, parseInt(input.count || '5', 10)))
    let chars = ''
    if (input.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (input.lower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (input.numbers) chars += '0123456789'
    if (input.symbols) chars += '!@#$%^&*()-_=+[]{};:,.<>?'
    if (input.excludeAmbiguous) chars = chars.replace(/[0O1lI|]/g, '')
    if (!chars) return { output: 'Select at least one character set.' }
    const passwords: string[] = []
    for (let n = 0; n < count; n++) {
      let pw = ''
      const bytes = crypto.randomBytes(len)
      for (let i = 0; i < len; i++) pw += chars[bytes[i] % chars.length]
      passwords.push(pw)
    }
    let out = `Generated ${count} password(s) of length ${len}:\n\n`
    passwords.forEach((p, i) => { out += `${(i + 1).toString().padStart(2)}. ${p}\n` })
    // Strength check on first password
    const sample = passwords[0]
    let variety = 0
    if (/[A-Z]/.test(sample)) variety++
    if (/[a-z]/.test(sample)) variety++
    if (/[0-9]/.test(sample)) variety++
    if (/[^A-Za-z0-9]/.test(sample)) variety++
    out += `\nStrength: ${len >= 12 && variety === 4 ? 'Strong ✓' : len >= 8 && variety >= 3 ? 'Good' : 'Weak — increase length / variety'}`
    return { output: out }
  },
})

registerTool({
  slug: 'qr-generator',
  title: 'QR Code Generator',
  category: 'utility',
  description: 'Generate a QR code from text or URL.',
  icon: 'QrCode',
  accessLevel: 'free',
  module: 'utility',
  sortOrder: 2,
  fields: [
    { name: 'data', label: 'Text / URL', type: 'text', required: true },
    { name: 'size', label: 'Size (px)', type: 'number', defaultValue: 300, min: 100, max: 1000 },
    {
      name: 'ecc', label: 'Error correction', type: 'select', defaultValue: 'M',
      options: [
        { value: 'L', label: 'L (Low, 7%)' },
        { value: 'M', label: 'M (Medium, 15%)' },
        { value: 'Q', label: 'Q (Quartile, 25%)' },
        { value: 'H', label: 'H (High, 30%)' },
      ],
    },
  ],
  handler: async (input) => {
    const data = input.data || ''
    const size = parseInt(input.size || '300', 10)
    const ecc = input.ecc || 'M'
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&ecc=${ecc}&data=${encodeURIComponent(data)}`
    return {
      output: `QR Code URL:\n${url}\n\nEmbed HTML:\n<img src="${url}" alt="QR Code" width="${size}" height="${size}">\n\nMarkdown:\n![QR Code](${url})`,
      extra: { qrUrl: url, size },
    }
  },
})

registerTool({
  slug: 'age-calculator',
  title: 'Age Calculator',
  category: 'utility',
  description: 'Calculate age from a birthdate.',
  icon: 'Cake',
  accessLevel: 'free',
  module: 'utility',
  sortOrder: 3,
  fields: [
    { name: 'birthdate', label: 'Birthdate', type: 'date', required: true },
    { name: 'targetDate', label: 'Target date (default: today)', type: 'date' },
  ],
  handler: async (input) => {
    const bd = input.birthdate
    if (!bd) return { output: 'Birthdate required.' }
    const target = input.targetDate ? new Date(input.targetDate) : new Date()
    const birth = new Date(bd)
    if (isNaN(birth.getTime())) return { output: 'Invalid date.' }
    if (birth > target) return { output: 'Birthdate is after target date.' }
    let years = target.getFullYear() - birth.getFullYear()
    let months = target.getMonth() - birth.getMonth()
    let days = target.getDate() - birth.getDate()
    if (days < 0) {
      months--
      const prev = new Date(target.getFullYear(), target.getMonth(), 0)
      days += prev.getDate()
    }
    if (months < 0) { years--; months += 12 }
    const totalDays = Math.floor((target.getTime() - birth.getTime()) / 86400000)
    return {
      output: `Birthdate:    ${bd}
Target date:  ${target.toISOString().slice(0, 10)}

Age:          ${years} years, ${months} months, ${days} days
Total months: ${years * 12 + months}
Total weeks:  ${Math.floor(totalDays / 7)}
Total days:   ${totalDays}
Total hours:  ${totalDays * 24}
Total minutes: ${totalDays * 24 * 60}`,
    }
  },
})

registerTool({
  slug: 'timestamp-converter',
  title: 'Timestamp Converter',
  category: 'utility',
  description: 'Convert between Unix timestamps and human-readable dates.',
  icon: 'Clock',
  accessLevel: 'free',
  module: 'utility',
  sortOrder: 4,
  fields: [
    {
      name: 'input', label: 'Input (Unix timestamp or date YYYY-MM-DD HH:MM:SS)', type: 'text', required: true,
      placeholder: '1719500000 or 2025-06-20 15:30:00',
    },
    {
      name: 'tz', label: 'Timezone', type: 'select', defaultValue: 'utc',
      options: [
        { value: 'utc', label: 'UTC' },
        { value: 'local', label: 'Server local' },
      ],
    },
  ],
  handler: async (input) => {
    const inStr = (input.input || '').trim()
    if (!inStr) return { output: 'No input.' }
    const isNumeric = /^\d+$/.test(inStr)
    let out = ''
    if (isNumeric) {
      const ts = parseInt(inStr, 10)
      const tsLen = inStr.length
      // Auto-detect seconds vs milliseconds
      const tsSec = tsLen > 10 ? ts / 1000 : ts
      const d = new Date(tsSec * 1000)
      out = `Timestamp: ${ts}\n${tsLen > 10 ? '(milliseconds — converted to seconds)' : '(seconds)'}\n\n`
      out += `UTC:           ${d.toISOString()}\n`
      out += `Local:         ${d.toLocaleString()}\n`
      out += `ISO 8601:      ${d.toISOString()}\n`
      out += `RFC 2822:      ${d.toUTCString()}\n`
      const now = Date.now()
      const diff = tsSec * 1000 - now
      out += `\nRelative: ${diff > 0 ? 'in ' : ''}${Math.abs(Math.round(diff / 86400000))} days ${diff > 0 ? 'from now' : 'ago'}\n`
    } else {
      const d = new Date(inStr)
      if (isNaN(d.getTime())) return { output: 'Could not parse. Use YYYY-MM-DD or a Unix timestamp.' }
      out = `Date: ${inStr}\n\n`
      out += `Unix timestamp (sec):      ${Math.floor(d.getTime() / 1000)}\n`
      out += `Unix timestamp (ms):       ${d.getTime()}\n`
      out += `UTC:                       ${d.toISOString()}\n`
    }
    return { output: out }
  },
})

registerTool({
  slug: 'unit-converter',
  title: 'Unit Converter',
  category: 'utility',
  description: 'Convert length, weight, temperature, data, and speed units.',
  icon: 'Ruler',
  accessLevel: 'free',
  module: 'utility',
  sortOrder: 5,
  fields: [
    { name: 'value', label: 'Value', type: 'number', required: true, defaultValue: 1 },
    {
      name: 'category', label: 'Category', type: 'select', defaultValue: 'length',
      options: [
        { value: 'length', label: 'Length' },
        { value: 'weight', label: 'Weight' },
        { value: 'temperature', label: 'Temperature' },
        { value: 'data', label: 'Data size' },
        { value: 'speed', label: 'Speed' },
      ],
    },
    { name: 'from', label: 'From unit', type: 'text', placeholder: 'm, kg, C, MB, kmh' },
    { name: 'to', label: 'To unit', type: 'text', placeholder: 'ft, lb, F, GB, mph' },
  ],
  handler: async (input) => {
    const v = parseFloat(input.value || '0')
    const cat = input.category || 'length'
    const from = (input.from || '').toLowerCase().trim()
    const to = (input.to || '').toLowerCase().trim()
    if (!from || !to) return { output: 'Specify both from and to units.' }
    let result = 0
    if (cat === 'length') {
      const factors: Record<string, number> = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144, nauticalmile: 1852 }
      if (!factors[from] || !factors[to]) return { output: `Invalid length unit. Valid: ${Object.keys(factors).join(', ')}` }
      result = (v * factors[from]) / factors[to]
    } else if (cat === 'weight') {
      const factors: Record<string, number> = { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.453592, oz: 0.0283495, stone: 6.35029 }
      if (!factors[from] || !factors[to]) return { output: `Invalid weight unit. Valid: ${Object.keys(factors).join(', ')}` }
      result = (v * factors[from]) / factors[to]
    } else if (cat === 'temperature') {
      if (from === to) result = v
      else if (from === 'c' && to === 'f') result = v * 9/5 + 32
      else if (from === 'f' && to === 'c') result = (v - 32) * 5/9
      else if (from === 'c' && to === 'k') result = v + 273.15
      else if (from === 'k' && to === 'c') result = v - 273.15
      else if (from === 'f' && to === 'k') result = (v - 32) * 5/9 + 273.15
      else if (from === 'k' && to === 'f') result = (v - 273.15) * 9/5 + 32
      else return { output: 'Use C, F, or K for temperature.' }
    } else if (cat === 'data') {
      const factors: Record<string, number> = { b: 1, kb: 1024, mb: 1024**2, gb: 1024**3, tb: 1024**4, pb: 1024**5, bit: 0.125, kbit: 125, mbit: 125000, gbit: 1.25e8 }
      if (!factors[from] || !factors[to]) return { output: `Invalid data unit. Valid: ${Object.keys(factors).join(', ')}` }
      result = (v * factors[from]) / factors[to]
    } else if (cat === 'speed') {
      const factors: Record<string, number> = { ms: 1, kmh: 0.277778, mph: 0.44704, knots: 0.514444, ftps: 0.3048 }
      if (!factors[from] || !factors[to]) return { output: `Invalid speed unit. Valid: ${Object.keys(factors).join(', ')}` }
      result = (v * factors[from]) / factors[to]
    }
    return {
      output: `${v} ${from} = ${result.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}`,
    }
  },
})

registerTool({
  slug: 'bmi-calculator',
  title: 'BMI Calculator',
  category: 'utility',
  description: 'Calculate Body Mass Index.',
  icon: 'Scale',
  accessLevel: 'free',
  module: 'utility',
  sortOrder: 6,
  fields: [
    {
      name: 'system', label: 'Measurement system', type: 'select', defaultValue: 'metric',
      options: [
        { value: 'metric', label: 'Metric (kg, cm)' },
        { value: 'imperial', label: 'Imperial (lb, in)' },
      ],
    },
    { name: 'weight', label: 'Weight', type: 'number', required: true, min: 1 },
    { name: 'height', label: 'Height', type: 'number', required: true, min: 1 },
  ],
  handler: async (input) => {
    const sys = input.system || 'metric'
    let weight = parseFloat(input.weight || '0')
    let height = parseFloat(input.height || '0')
    if (weight <= 0 || height <= 0) return { output: 'Enter valid weight and height.' }
    if (sys === 'imperial') {
      // weight in lb, height in inches → BMI = 703 * lb / in²
      const bmi = (703 * weight) / (height * height)
      return formatBmi(bmi, `${weight} lb`, `${height} in`)
    } else {
      const h = height / 100
      const bmi = weight / (h * h)
      return formatBmi(bmi, `${weight} kg`, `${height} cm`)
    }
  },
})

function formatBmi(bmi: number, weightStr: string, heightStr: string): { output: string } {
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : bmi < 35 ? 'Obese (Class I)' : bmi < 40 ? 'Obese (Class II)' : 'Obese (Class III)'
  const idealMin = 18.5
  const idealMax = 24.9
  let out = `Weight: ${weightStr}\nHeight: ${heightStr}\n\n`
  out += `BMI: ${bmi.toFixed(1)}\n`
  out += `Category: ${cat}\n\n`
  out += `BMI Categories:\n`
  out += `  < 18.5   Underweight\n`
  out += `  18.5-24.9 Normal weight\n`
  out += `  25-29.9   Overweight\n`
  out += `  30-34.9   Obese (Class I)\n`
  out += `  35-39.9   Obese (Class II)\n`
  out += `  ≥ 40      Obese (Class III)\n\n`
  out += `Ideal BMI range: ${idealMin} - ${idealMax}`
  return { output: out }
}
