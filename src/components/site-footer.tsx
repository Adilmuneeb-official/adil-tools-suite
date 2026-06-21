import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-20 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-black font-extrabold">A</span>
              <span>Adil <em className="not-italic text-cyan-400">Tools</em></span>
            </Link>
            <p className="text-sm text-muted-foreground">500+ premium online tools for developers, marketers, SEOs and IT pros. Built for speed. Designed for the dark side.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3 uppercase tracking-wider">Tools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/tools?cat=developer" className="hover:text-cyan-400">Developer</Link></li>
              <li><Link href="/tools?cat=seo" className="hover:text-cyan-400">SEO</Link></li>
              <li><Link href="/tools?cat=pdf-tools" className="hover:text-cyan-400">PDF Tools</Link></li>
              <li><Link href="/tools?cat=ai-tools" className="hover:text-cyan-400">AI Tools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/#features" className="hover:text-cyan-400">About</Link></li>
              <li><Link href="/#pricing" className="hover:text-cyan-400">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-cyan-400">FAQ</Link></li>
              <li><Link href="/#contact" className="hover:text-cyan-400">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-3 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-cyan-400">Privacy</Link></li>
              <li><Link href="#" className="hover:text-cyan-400">Terms</Link></li>
              <li><Link href="#" className="hover:text-cyan-400">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Adil Muneeb. Built in Dubai, UAE.</p>
          <div className="flex gap-3">
            <a href="#" aria-label="Twitter" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-cyan-400 hover:text-black transition-colors">𝕏</a>
            <a href="#" aria-label="GitHub" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-cyan-400 hover:text-black transition-colors">Gh</a>
            <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-cyan-400 hover:text-black transition-colors">in</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
