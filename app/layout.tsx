import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import { getLocale } from "next-intl/server"

import "./globals.css"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { GoogleTagManager } from "@/components/analytics/google-tag-manager"
import { AuthProvider } from "@/components/auth/auth-provider"
import { JsonLd } from "@/components/seo/json-ld"
import { ThemeExtras } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@wrksz/themes/next"
import { isChatGtmEnabled } from "@/lib/analytics"
import {
  BROWSER_CHROME_COLORS,
  BROWSER_CHROME_INIT_SCRIPT,
} from "@/lib/browser-chrome"
import { localeDirection } from "@/lib/i18n/locale"
import {
  organizationJsonLd,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_TITLE,
  SITE_TITLE_TEMPLATE,
  SITE_URL,
  webApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [...SITE_KEYWORDS],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "finance",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@exur_ai",
    site: "@exur_ai",
    images: ["/twitter-image"],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: SITE_SHORT_NAME,
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: BROWSER_CHROME_COLORS.dark,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let locale = "en"
  try {
    locale = await getLocale()
  } catch {
    // Image / metadata routes (e.g. opengraph-image) have no intl provider.
  }
  const dir = localeDirection(locale)
  const pathname = (await headers()).get("x-pathname") ?? "/"
  const chatGtmEnabled = isChatGtmEnabled(pathname)

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className="font-sans antialiased"
    >
      <body>
        <GoogleTagManager enabled={chatGtmEnabled} />
        <Script
          id="browser-chrome-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: BROWSER_CHROME_INIT_SCRIPT }}
        />
        <JsonLd id="json-ld-organization" data={organizationJsonLd()} />
        <JsonLd id="json-ld-website" data={websiteJsonLd()} />
        <JsonLd id="json-ld-web-app" data={webApplicationJsonLd()} />
        <ThemeProvider
          attribute="class"
          themes={["light", "dark"]}
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themeColor={{
            light: BROWSER_CHROME_COLORS.light,
            dark: BROWSER_CHROME_COLORS.dark,
          }}
        >
          <ThemeExtras />
          <TooltipProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" />
              <GoogleAnalytics />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
