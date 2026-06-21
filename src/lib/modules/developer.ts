/**
 * Developer Tools module (7 tools, all free)
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'json-formatter',
  title: 'JSON Formatter',
  category: 'developer',
  description: 'Format, beautify, and validate JSON.',
  icon: 'Braces',
  accessLevel: 'free',
  module: 'developer',
  sortOrder: 1,
  fields: [
    { name: 'json', label: 'JSON input', type: 'textarea', rows: 10, required: true, placeholder: '{"key":"value"}' },
    {
      name: 'action', label: 'Action', type: 'select', defaultValue: 'beautify',
      options: [
        { value: 'beautify', label: 'Beautify (pretty print)' },
        { value: 'minify', label: 'Minify' },
        { value: 'validate', label: 'Validate only' },
      ],
    },
    { name: 'indent', label: 'Indent spaces', type: 'number', defaultValue: 2, min: 1, max: 8, help: 'Number of spaces per indent level' },
  ],
  handler: async (input) => {
    const raw = input.json || ''
    const action = input.action || 'beautify'
    const indent = parseInt(input.indent || '2', 10)
    try {
      const parsed = JSON.parse(raw)
      if (action === 'minify') return { output: JSON.stringify(parsed) }
      if (action === 'validate') return { output: 'Valid JSON ✓\n\nParsed structure:\n' + Object.keys(parsed).join(', ') }
      return { output: JSON.stringify(parsed, null, indent) }
    } catch (e: any) {
      return { output: `Invalid JSON: ${e.message}` }
    }
  },
})

registerTool({
  slug: 'base64-encode',
  title: 'Base64 Encode',
  category: 'developer',
  description: 'Encode a string to Base64.',
  icon: 'Lock',
  accessLevel: 'free',
  module: 'developer',
  sortOrder: 2,
  fields: [
    { name: 'text', label: 'Text to encode', type: 'textarea', rows: 6, required: true },
    { name: 'urlSafe', label: 'URL-safe (replace +/= with -_ and remove padding)', type: 'checkbox' },
  ],
  handler: async (input) => {
    const text = input.text || ''
    let encoded = Buffer.from(text, 'utf-8').toString('base64')
    if (input.urlSafe) {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }
    return { output: encoded }
  },
})

registerTool({
  slug: 'base64-decode',
  title: 'Base64 Decode',
  category: 'developer',
  description: 'Decode a Base64 string.',
  icon: 'LockOpen',
  accessLevel: 'free',
  module: 'developer',
  sortOrder: 3,
  fields: [
    { name: 'text', label: 'Base64 input', type: 'textarea', rows: 6, required: true },
  ],
  handler: async (input) => {
    try {
      const decoded = Buffer.from(input.text || '', 'base64').toString('utf-8')
      return { output: decoded || '(empty output)' }
    } catch {
      return { output: 'Invalid Base64 input' }
    }
  },
})

registerTool({
  slug: 'regex-tester',
  title: 'Regex Tester',
  category: 'developer',
  description: 'Test a regular expression against a sample string.',
  icon: 'SquareSigma',
  accessLevel: 'free',
  module: 'developer',
  sortOrder: 4,
  fields: [
    { name: 'pattern', label: 'Pattern (without delimiters)', type: 'text', required: true, placeholder: '\\d+' },
    { name: 'flags', label: 'Flags', type: 'text', defaultValue: 'g', placeholder: 'gim' },
    { name: 'subject', label: 'Subject text', type: 'textarea', rows: 6, required: true },
  ],
  handler: async (input) => {
    const pattern = input.pattern || ''
    const flags = input.flags || 'g'
    const subject = input.subject || ''
    let out = `Pattern: /${pattern}/${flags}\nSubject: "${subject}"\n\n`
    try {
      const re = new RegExp(pattern, flags)
      if (flags.includes('g')) {
        const matches = subject.match(re) || []
        out += `Matches (${matches.length}):\n`
        matches.forEach((m, i) => { out += `  [${i}] ${m}\n` })
        // Capture groups
        re.lastIndex = 0
        let m: RegExpExecArray | null
        let i = 0
        while ((m = re.exec(subject)) !== null) {
          if (m.length > 1) {
            out += `\nMatch ${i} groups:\n`
            for (let g = 1; g < m.length; g++) out += `  Group ${g}: ${m[g] ?? ''}\n`
          }
          i++
          if (m.index === re.lastIndex) re.lastIndex++
        }
      } else {
        const m = subject.match(re)
        if (m) {
          out += `Match: "${m[0]}"\n`
          if (m.length > 1) {
            out += '\nGroups:\n'
            for (let g = 1; g < m.length; g++) out += `  Group ${g}: ${m[g] ?? ''}\n`
          }
          out += `\nIndex: ${m.index}\n`
        } else {
          out += 'No match.'
        }
      }
      return { output: out }
    } catch (e: any) {
      return { output: `Invalid regex: ${e.message}` }
    }
  },
})

registerTool({
  slug: 'css-minifier',
  title: 'CSS Minifier',
  category: 'developer',
  description: 'Minify CSS for production.',
  icon: 'FileCode',
  accessLevel: 'free',
  module: 'developer',
  sortOrder: 5,
  fields: [
    { name: 'css', label: 'CSS', type: 'textarea', rows: 10, required: true, placeholder: '.class { color: red; }' },
  ],
  handler: async (input) => {
    let css = input.css || ''
    const original = css.length
    css = css.replace(/\/\*[\s\S]*?\*\//g, '')        // comments
    css = css.replace(/\s+/g, ' ')                     // collapse whitespace
    css = css.replace(/\s*([{}:;,>~+])\s*/g, '$1')     // around punctuation
    css = css.replace(/;}/g, '}')                       // trailing semicolons
    css = css.trim()
    const saved = original - css.length
    const pct = original > 0 ? Math.round((saved / original) * 100) : 0
    return { output: `/* Minified — saved ${saved} bytes (${pct}%) */\n${css}` }
  },
})

registerTool({
  slug: 'js-minifier',
  title: 'JS Minifier',
  category: 'developer',
  description: 'Basic JavaScript minifier (whitespace + comments).',
  icon: 'FileCode2',
  accessLevel: 'free',
  module: 'developer',
  sortOrder: 6,
  fields: [
    { name: 'js', label: 'JavaScript', type: 'textarea', rows: 10, required: true },
  ],
  handler: async (input) => {
    let js = input.js || ''
    const original = js.length
    js = js.replace(/\/\/[^\n]*/g, '')                  // single-line comments
    js = js.replace(/\/\*[\s\S]*?\*\//g, '')            // multi-line comments
    js = js.replace(/\s+/g, ' ')                         // collapse whitespace
    js = js.replace(/\s*([{};:,.=()<>+\-*\/])\s*/g, '$1') // around operators
    js = js.trim()
    const saved = original - js.length
    const pct = original > 0 ? Math.round((saved / original) * 100) : 0
    return { output: `/* Minified — saved ${saved} bytes (${pct}%) */\n${js}` }
  },
})

registerTool({
  slug: 'html-minifier',
  title: 'HTML Minifier',
  category: 'developer',
  description: 'Minify HTML output.',
  icon: 'Code',
  accessLevel: 'free',
  module: 'developer',
  sortOrder: 7,
  fields: [
    { name: 'html', label: 'HTML', type: 'textarea', rows: 10, required: true },
  ],
  handler: async (input) => {
    let html = input.html || ''
    const original = html.length
    html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '') // conditional comments kept
    html = html.replace(/\s+/g, ' ')
    html = html.replace(/>\s+</g, '><')
    html = html.trim()
    const saved = original - html.length
    const pct = original > 0 ? Math.round((saved / original) * 100) : 0
    return { output: `<!-- Minified — saved ${saved} bytes (${pct}%) -->\n${html}` }
  },
})
