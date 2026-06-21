/**
 * Content Tools module (4 tools, all free)
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'blog-title-generator',
  title: 'Blog Title Generator',
  category: 'content',
  description: 'Generate title variations based on topic and keywords.',
  icon: 'Heading',
  accessLevel: 'free',
  module: 'content',
  sortOrder: 1,
  fields: [
    { name: 'topic', label: 'Topic', type: 'text', required: true, placeholder: 'email marketing' },
    { name: 'keyword', label: 'Primary keyword', type: 'text', placeholder: 'open rates' },
    {
      name: 'tone', label: 'Tone', type: 'select', defaultValue: 'any',
      options: [
        { value: 'any', label: 'Any' },
        { value: 'how-to', label: 'How-to / educational' },
        { value: 'listicle', label: 'Listicle' },
        { value: 'question', label: 'Question' },
        { value: 'controversial', label: 'Controversial / bold' },
        { value: 'numbers', label: 'Numbers/data-driven' },
      ],
    },
  ],
  handler: async (input) => {
    const t = input.topic || 'your topic'
    const k = input.keyword || ''
    const tone = input.tone || 'any'
    const all: Record<string, string[]> = {
      'how-to': [
        `How to Master ${t} in 30 Days`,
        `The Step-by-Step Guide to ${t}`,
        `How to ${t} Like a Pro (Even If You're a Beginner)`,
        `How to ${t} From Scratch — A Complete Walkthrough`,
      ],
      'listicle': [
        `10 ${t} Strategies That Actually Work in 2025`,
        `7 ${t} Mistakes You're Probably Making`,
        `5 ${t} Trends You Can't Ignore This Year`,
        `15 ${t} Tools That Will Save You Hours Every Week`,
      ],
      'question': [
        `Why Is ${t} So Important?`,
        `What Nobody Tells You About ${t}`,
        `Should You Invest in ${t}? Here's How to Decide`,
        `Is ${t} Worth It? A Deep Dive`,
      ],
      'controversial': [
        `Stop Wasting Time on ${t}. Do This Instead.`,
        `The Big Lie About ${t}`,
        `${t} Is Dead. Here's What Replaced It.`,
        `Why Most ${t} Advice Is Wrong`,
      ],
      'numbers': [
        `${t} by the Numbers: 21 Stats That Will Surprise You`,
        `The Science of ${t}: What 1,000 Studies Reveal`,
        `47% Improvement in ${t} — Here's How`,
        `The Data-Driven Playbook for ${t}`,
      ],
      'any': [
        `The Ultimate Guide to ${t} in 2025`,
        `${t} Demystified: Everything You Need to Know`,
        `From Zero to Hero: A ${t} Story`,
        `${t} Explained in 5 Minutes`,
        `The ${t} Checklist: 21 Things to Verify`,
      ],
    }
    const list = tone === 'any'
      ? Object.values(all).flat()
      : [...(all[tone] || []), ...all['any']]
    let out = `Blog title ideas for: "${t}"` + (k ? ` (keyword: ${k})` : '') + `\n\n`
    list.forEach((title, i) => {
      const len = title.length
      const tag = len > 60 ? ' [too long]' : len < 30 ? ' [short]' : ' ✓'
      out += `${(i + 1).toString().padStart(2)}. ${title}  (${len} chars${tag})\n`
    })
    out += `\nTip: Ideal title length is 50-60 characters for SEO.`
    return { output: out }
  },
})

registerTool({
  slug: 'faq-generator',
  title: 'FAQ Generator',
  category: 'content',
  description: 'Generate FAQ question-answer pairs from a topic.',
  icon: 'CircleHelp',
  accessLevel: 'free',
  module: 'content',
  sortOrder: 2,
  fields: [
    { name: 'topic', label: 'Topic', type: 'text', required: true },
    { name: 'count', label: 'Number of FAQs', type: 'number', defaultValue: 10, min: 3, max: 15 },
    {
      name: 'format', label: 'Output format', type: 'select', defaultValue: 'plain',
      options: [
        { value: 'plain', label: 'Plain text' },
        { value: 'html', label: 'HTML' },
        { value: 'json-ld', label: 'JSON-LD schema' },
        { value: 'markdown', label: 'Markdown' },
      ],
    },
  ],
  handler: async (input) => {
    const t = input.topic || 'this topic'
    const count = Math.min(15, Math.max(3, parseInt(input.count || '10', 10)))
    const fmt = input.format || 'plain'
    const faqs = [
      [`What is ${t}?`, `${t} refers to a set of practices and principles that help individuals and businesses achieve specific goals. Understanding it fully requires looking at both foundational concepts and modern applications.`],
      [`Why is ${t} important?`, `Investing time in ${t} can yield significant long-term benefits. It helps streamline processes, improve outcomes, and stay ahead of competitors in a rapidly evolving landscape.`],
      [`How do I get started with ${t}?`, `Begin by assessing your current situation, defining clear goals, and identifying the resources you have available. A structured plan with milestones will keep you on track.`],
      [`What are the common mistakes in ${t}?`, `Many beginners overlook fundamentals, skip planning, or try to do too much at once. Focus on consistency and incremental progress to avoid burnout.`],
      [`How much does ${t} cost?`, `Costs vary widely depending on scope, scale, and tools used. Free resources are available for beginners, while advanced setups may require significant investment.`],
      [`How long does it take to see results from ${t}?`, `Most people see initial results within 4–8 weeks, with significant improvements appearing after 3–6 months of consistent effort.`],
      [`What tools are recommended for ${t}?`, `Popular tools include both free and paid options covering planning, execution, and analysis. Choose based on your specific needs, budget, and team size.`],
      [`Can I do ${t} myself or should I hire someone?`, `For small projects, DIY is feasible with proper research. For larger or business-critical initiatives, hiring an expert often saves time and produces better long-term results.`],
      [`What are the latest trends in ${t}?`, `Current trends emphasize automation, AI integration, and sustainability. Staying informed through industry blogs and conferences helps you adapt quickly.`],
      [`How do I measure success in ${t}?`, `Define KPIs upfront — typically a mix of leading indicators (activity, engagement) and lagging indicators (revenue, conversion). Review monthly and adjust.`],
      [`Is ${t} suitable for small businesses?`, `Yes, ${t} can be scaled to fit businesses of any size. Small businesses often benefit most from a focused, lean approach.`],
      [`What skills are needed for ${t}?`, `Core skills include analytical thinking, basic technical literacy, and good communication. Many tools now automate the technical heavy lifting.`],
      [`How often should I review ${t}?`, `A monthly review is a good starting point. High-velocity teams may review weekly, while stable operations can review quarterly.`],
      [`What's the ROI of ${t}?`, `ROI depends on implementation quality. Well-executed ${t} typically returns 3-10x the investment within 12 months.`],
      [`Where can I learn more about ${t}?`, `Start with industry blogs, free courses on platforms like Coursera, and books by recognized experts. Join online communities for peer learning.`],
    ].slice(0, count)

    if (fmt === 'html') {
      let out = `<div class="faq">\n`
      for (const [q, a] of faqs) {
        out += `  <details>\n    <summary>${q}</summary>\n    <p>${a}</p>\n  </details>\n`
      }
      out += `</div>`
      return { output: out }
    }
    if (fmt === 'json-ld') {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }
      return { output: `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>` }
    }
    if (fmt === 'markdown') {
      let out = `# FAQ: ${t}\n\n`
      for (const [q, a] of faqs) out += `## ${q}\n\n${a}\n\n`
      return { output: out }
    }
    let out = `FAQ for: ${t}\n\n`
    for (const [q, a] of faqs) out += `Q: ${q}\nA: ${a}\n\n`
    return { output: out }
  },
})

registerTool({
  slug: 'headline-analyzer',
  title: 'Headline Analyzer',
  category: 'content',
  description: 'Score headlines on length, word power, sentiment, and readability.',
  icon: 'Search',
  accessLevel: 'free',
  module: 'content',
  sortOrder: 3,
  fields: [
    { name: 'headline', label: 'Headline to analyze', type: 'text', required: true },
  ],
  handler: async (input) => {
    const h = input.headline || ''
    const words = h.split(/\s+/).filter(Boolean)
    const wc = words.length
    const cc = h.length
    const powerWords = ['free', 'new', 'proven', 'guaranteed', 'instant', 'easy', 'powerful', 'secret', 'ultimate', 'exclusive', 'limited', 'now', 'best', 'top', 'amazing', 'incredible', 'shocking', 'discover', 'revealed', 'instantly', 'you', 'your', 'because', 'this', 'that', 'how', 'why', 'what', 'when']
    const emotionWords = ['love', 'hate', 'fear', 'happy', 'sad', 'angry', 'exciting', 'shocking', 'amazing', 'terrible', 'wonderful', 'awful', 'best', 'worst', 'incredible', 'unbelievable']
    const powerCount = words.filter(w => powerWords.includes(w.toLowerCase().replace(/[^a-z]/g, ''))).length
    const emotionCount = words.filter(w => emotionWords.includes(w.toLowerCase().replace(/[^a-z]/g, ''))).length
    const hasNumber = /\d/.test(h)
    const hasQuestion = /\?$/.test(h)
    const hasColon = /:/.test(h)
    const avgWordLen = words.reduce((a, w) => a + w.length, 0) / Math.max(1, wc)

    let score = 40
    if (cc >= 30 && cc <= 60) score += 20
    else if (cc >= 25 && cc <= 70) score += 10
    else score -= 5
    if (wc >= 6 && wc <= 12) score += 15
    if (powerCount > 0) score += Math.min(20, powerCount * 7)
    if (emotionCount > 0) score += Math.min(15, emotionCount * 8)
    if (hasNumber) score += 12
    if (hasQuestion) score += 8
    if (hasColon) score += 5
    if (avgWordLen <= 6) score += 5
    score = Math.max(0, Math.min(100, score))

    const verdict = score >= 80 ? 'Excellent 🎯' : score >= 60 ? 'Good 👍' : score >= 40 ? 'Average 😐' : 'Weak ⚠️'
    let out = `Headline: "${h}"\n\n`
    out += `=== ANALYSIS ===\n`
    out += `Length:           ${cc} characters (ideal: 30-60)\n`
    out += `Word count:       ${wc} (ideal: 6-12)\n`
    out += `Avg word length:  ${avgWordLen.toFixed(1)} chars\n`
    out += `Power words:      ${powerCount} (${powerCount > 0 ? words.filter(w => powerWords.includes(w.toLowerCase().replace(/[^a-z]/g, ''))).join(', ') : 'none'})\n`
    out += `Emotion words:    ${emotionCount}\n`
    out += `Has number:       ${hasNumber ? 'Yes ✓' : 'No'}\n`
    out += `Has question:     ${hasQuestion ? 'Yes' : 'No'}\n`
    out += `Has colon:        ${hasColon ? 'Yes' : 'No'}\n`
    out += `\n=== SCORE: ${score}/100 — ${verdict} ===\n\n`
    out += `=== TIPS ===\n`
    if (cc > 60) out += `- Trim headline to 60 chars or less (currently ${cc})\n`
    if (cc < 30) out += `- Add more substance (currently only ${cc} chars)\n`
    if (powerCount === 0) out += `- Add a power word (free, proven, ultimate, secret)\n`
    if (!hasNumber) out += `- Add a number — listicles convert well\n`
    if (avgWordLen > 7) out += `- Use simpler words (avg ${avgWordLen.toFixed(1)} chars/word)\n`
    return { output: out }
  },
})

registerTool({
  slug: 'readability-checker',
  title: 'Readability Checker',
  category: 'content',
  description: 'Flesch-Kincaid score, sentence length, word complexity.',
  icon: 'BookOpen',
  accessLevel: 'free',
  module: 'content',
  sortOrder: 4,
  fields: [
    { name: 'text', label: 'Text', type: 'textarea', rows: 12, required: true },
  ],
  handler: async (input) => {
    const text = (input.text || '').trim()
    if (!text) return { output: 'No text provided.' }
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.match(/\b\w+\b/g) || []
    const syllables = words.reduce((sum, w) => {
      const matches = w.toLowerCase().match(/[aeiouy]+/g)
      return sum + Math.max(1, matches ? matches.length : 1)
    }, 0)
    const sCount = Math.max(1, sentences.length)
    const wCount = Math.max(1, words.length)
    const fk = Math.max(0, Math.min(100, 206.835 - (1.015 * (wCount / sCount)) - (84.6 * (syllables / wCount))))
    const grade = Math.max(0, (0.39 * (wCount / sCount)) + (11.8 * (syllables / wCount)) - 15.59)
    const level = fk >= 90 ? 'Very Easy (5th grade)' :
                  fk >= 80 ? 'Easy (6th grade)' :
                  fk >= 70 ? 'Fairly Easy (7th grade)' :
                  fk >= 60 ? 'Standard (8-9th grade)' :
                  fk >= 50 ? 'Fairly Difficult (10-12th grade)' :
                  fk >= 30 ? 'Difficult (college)' :
                  'Very Difficult (college graduate)'
    const longWords = words.filter(w => w.length > 12).length
    let out = `=== READABILITY REPORT ===\n\n`
    out += `Flesch Reading Ease:   ${fk.toFixed(1)} / 100\n`
    out += `Reading level:         ${level}\n`
    out += `Flesch-Kincaid Grade:  ${grade.toFixed(1)}\n\n`
    out += `=== STATISTICS ===\n`
    out += `Words:                 ${wCount}\n`
    out += `Sentences:             ${sCount}\n`
    out += `Syllables:             ${syllables}\n`
    out += `Avg words/sentence:    ${(wCount / sCount).toFixed(1)}\n`
    out += `Avg syllables/word:    ${(syllables / wCount).toFixed(2)}\n`
    out += `Long words (>12 char): ${longWords} (${((longWords / wCount) * 100).toFixed(1)}%)\n`
    out += `\n=== RECOMMENDATIONS ===\n`
    if (fk < 60) out += `- Score is low. Shorten sentences (aim for 15-20 words).\n`
    if ((wCount / sCount) > 25) out += `- Sentences too long. Break them up.\n`
    if ((syllables / wCount) > 1.8) out += `- Words too complex. Use simpler alternatives.\n`
    if (longWords / wCount > 0.1) out += `- ${longWords} long words — consider replacing some.\n`
    return { output: out }
  },
})
