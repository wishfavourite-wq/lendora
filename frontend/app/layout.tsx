import type { Metadata, Viewport } from 'next'
import { ThemeProvider }  from 'next-themes'
import { Toaster }        from 'sonner'
import { QueryProvider }       from '@/components/providers/QueryProvider'
import { ProgressBarProvider } from '@/components/providers/ProgressBarProvider'
import { fraunces, jakartaSans, jetbrainsMono } from '@/lib/fonts'
import { cn }             from '@/lib/utils'
import './globals.css'

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title:       'Lendora',
  description: 'Bangladesh\'s premier multi-vendor rental marketplace. Cameras, fashion, tools, electronics and more — from verified vendors across Dhaka, Chittagong & Sylhet.',
  keywords:    ['rental', 'Bangladesh', 'rent', 'camera', 'fashion', 'tools', 'Dhaka'],
  openGraph: {
    description: 'Bangladesh\'s premier rental marketplace.',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={cn(
        fraunces.variable,
        jakartaSans.variable,
        jetbrainsMono.variable,
      )}
    >
      <body className="font-jakarta bg-ink-50 text-ink-900 dark:bg-surface-bg dark:text-ink-100 antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <ProgressBarProvider>
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
              <Toaster
                position="top-right"
                toastOptions={{
                  classNames: {
                    toast:   'font-jakarta text-sm',
                    success: 'border-l-4 border-l-[#0A3D2E]',
                    error:   'border-l-4 border-l-red-500',
                  },
                }}
              />
            </ProgressBarProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
