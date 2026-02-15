import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { Suspense } from "react"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Dashboard Financiero - Sistema de Cobranza",
  description: "Sistema integral de gestión financiera y cobranza",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans">
        <Providers>
          <div className="flex min-h-screen">
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-card border-r">
              <Suspense fallback={<div>Loading...</div>}>
                <Sidebar />
              </Suspense>
            </aside>
            <div className="flex-1 md:ml-64">
              <Suspense fallback={<div>Loading...</div>}>
                <Header />
              </Suspense>
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
