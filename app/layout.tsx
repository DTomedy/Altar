import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { DM_Sans, IBM_Plex_Mono } from 'next/font/google';
import { ToastProvider } from '@/components/ui';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const displayFont = localFont({
  src: [
    {
      path: '../public/fonts/TomatoGrotesk-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/TomatoGrotesk-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500'],
  display: 'swap',
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Altar — Give with intention',
  description: 'Personal gifting and goal celebrations for the Nigerian market. Create a wishlist or fundraiser, share a single link, and receive contributions directly.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: '/images/Favicon.svg',
  },
  openGraph: {
    title: 'Altar — Give with intention',
    description: 'Personal gifting and goal celebrations for the Nigerian market.',
    siteName: 'Altar',
    locale: 'en_NG',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full scroll-smooth`}
    >
      <body className="bg-page text-body antialiased min-h-screen flex flex-col font-body overflow-x-hidden">
        <ToastProvider>
          <div className="flex flex-col flex-1 min-h-screen">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
