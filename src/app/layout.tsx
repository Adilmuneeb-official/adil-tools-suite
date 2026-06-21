import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import ThreeBackground from "@/components/three-background"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
})

export const metadata: Metadata = {
  title: "Adil Tools Suite — 500+ Premium Online Tools",
  description: "The ultimate dark-themed tools suite for developers, marketers, SEOs and IT pros. Built for speed. Designed for the dark side.",
  keywords: ["online tools", "developer tools", "seo tools", "pdf tools", "ai tools", "saas"],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ThreeBackground />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 pt-16">{children}</main>
          <SiteFooter />
        </div>
        <Toaster />
        <Sonner />
      </body>
    </html>
  )
}
