/**
 * PDF Tools module (5 placeholder tools — Pro)
 *
 * These tools work in demo mode without server-side binaries. Real PDF
 * processing requires installing Ghostscript, qpdf, and the `pdf-lib`
 * npm package. The handlers gracefully degrade and explain what's needed.
 */
import { registerTool } from '../tools/registry'

registerTool({
  slug: 'merge-pdf',
  title: 'Merge PDF',
  category: 'pdf-tools',
  description: 'Combine multiple PDFs into one (requires pdf-lib).',
  icon: 'Files',
  accessLevel: 'pro',
  module: 'pdf-tools',
  sortOrder: 1,
  fields: [
    { name: 'files', label: 'PDF files (2+)', type: 'file', required: true, multiple: true, accept: 'application/pdf' },
  ],
  handler: async (input) => {
    return {
      output: `PDF Merge tool — demo mode

To enable real PDF merging:
1. Install pdf-lib: \`bun add pdf-lib\`
2. Update this handler to:
   - Read uploaded PDFs into buffers
   - Use PDFDocument.create() + copy() from pdf-lib
   - Save merged PDF and return download URL

This tool requires a Pro subscription. Upgrade at /pricing to access.`,
    }
  },
})

registerTool({
  slug: 'split-pdf',
  title: 'Split PDF',
  category: 'pdf-tools',
  description: 'Split a PDF into individual pages or ranges.',
  icon: 'Scissors',
  accessLevel: 'pro',
  module: 'pdf-tools',
  sortOrder: 2,
  fields: [
    { name: 'file', label: 'PDF file', type: 'file', required: true, accept: 'application/pdf' },
    {
      name: 'mode', label: 'Split mode', type: 'select', defaultValue: 'each',
      options: [
        { value: 'each', label: 'Each page → separate PDF' },
        { value: 'ranges', label: 'Page ranges (e.g. 1-3, 5, 7-10)' },
      ],
    },
    { name: 'ranges', label: 'Page ranges', type: 'text', placeholder: '1-3, 5, 7-10', help: 'Used only if mode = ranges' },
  ],
  handler: async (input) => {
    return {
      output: `PDF Split tool — demo mode

Mode: ${input.mode}
${input.ranges ? `Ranges: ${input.ranges}` : ''}

Real implementation requires pdf-lib + a file storage layer.`,
    }
  },
})

registerTool({
  slug: 'compress-pdf',
  title: 'Compress PDF',
  category: 'pdf-tools',
  description: 'Reduce PDF file size using Ghostscript or image compression.',
  icon: 'FileArchive',
  accessLevel: 'pro',
  module: 'pdf-tools',
  sortOrder: 3,
  fields: [
    { name: 'file', label: 'PDF file', type: 'file', required: true, accept: 'application/pdf' },
    {
      name: 'level', label: 'Compression level', type: 'select', defaultValue: 'ebook',
      options: [
        { value: 'screen', label: 'Screen (72 dpi, smallest)' },
        { value: 'ebook', label: 'Ebook (150 dpi, balanced)' },
        { value: 'printer', label: 'Printer (300 dpi, larger)' },
        { value: 'prepress', label: 'Prepress (300 dpi, high quality)' },
      ],
    },
  ],
  handler: async (input) => {
    return {
      output: `PDF Compress tool — demo mode

Level: ${input.level}

Real implementation:
- Spawn Ghostscript: \`gs -sDEVICE=pdfwrite -dPDFSETTINGS=/${input.level} ...\`
- Or use pdf-lib + image compression
- Return compressed PDF + savings %`,
    }
  },
})

registerTool({
  slug: 'pdf-to-jpg',
  title: 'PDF to JPG',
  category: 'pdf-tools',
  description: 'Convert each PDF page to a JPG image.',
  icon: 'Image',
  accessLevel: 'pro',
  module: 'pdf-tools',
  sortOrder: 4,
  fields: [
    { name: 'file', label: 'PDF file', type: 'file', required: true, accept: 'application/pdf' },
    { name: 'quality', label: 'JPG quality (1-100)', type: 'number', defaultValue: 85, min: 10, max: 100 },
    { name: 'dpi', label: 'Render DPI', type: 'number', defaultValue: 150, min: 72, max: 600 },
  ],
  handler: async (input) => {
    return {
      output: `PDF to JPG — demo mode

Quality: ${input.quality}
DPI: ${input.dpi}

Real implementation: pdfjs-dist to render pages → canvas → JPEG.`,
    }
  },
})

registerTool({
  slug: 'watermark-pdf',
  title: 'Watermark PDF',
  category: 'pdf-tools',
  description: 'Add a text watermark to each PDF page.',
  icon: 'Stamp',
  accessLevel: 'pro',
  module: 'pdf-tools',
  sortOrder: 5,
  fields: [
    { name: 'file', label: 'PDF file', type: 'file', required: true, accept: 'application/pdf' },
    { name: 'text', label: 'Watermark text', type: 'text', defaultValue: 'CONFIDENTIAL', required: true },
    { name: 'opacity', label: 'Opacity (0-100)', type: 'number', defaultValue: 30, min: 5, max: 100 },
    {
      name: 'position', label: 'Position', type: 'select', defaultValue: 'center',
      options: [
        { value: 'center', label: 'Center' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'diagonal', label: 'Diagonal (45°)' },
      ],
    },
    { name: 'fontSize', label: 'Font size', type: 'number', defaultValue: 40, min: 8, max: 200 },
  ],
  handler: async (input) => {
    return {
      output: `PDF Watermark — demo mode

Text: "${input.text}"
Opacity: ${input.opacity}%
Position: ${input.position}
Font size: ${input.fontSize}

Real implementation: pdf-lib drawText on each page.`,
    }
  },
})
