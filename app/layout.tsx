import type { Metadata } from 'next'
import { Borel, Geist } from 'next/font/google'
import './globals.css'
import { cn } from '@/app/lib/utils'
import { Toaster } from '@/app/lib/sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const borel = Borel({
  variable: '--font-borel',
  subsets: ['latin'],
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Kanban',
  description: 'Our Kanban board',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn('h-full', 'antialiased', borel.variable, 'font-sans', geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
