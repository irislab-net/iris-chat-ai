import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { AnalyticsConsentGate } from "@/components/privacy/analytics-consent-gate"
import { JsonLd } from "@/components/seo/json-ld"
import { ThemeExtras } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@wrksz/themes/next"
import { brandIconUrl } from "@/lib/brand-icons"
import {
  BROWSER_CHROME_COLORS,
} from "@/lib/browser-chrome"
import { localeDirection } from "@/lib/i18n/locale"
import enMessages from "@/messages/en.json"
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
    // 48×48 PNG first — Google Search favicon guideline (multiples of 48).
    // Versioned URLs bust stale Iris-era browser / SERP caches.
    icon: [
      {
        url: brandIconUrl("/favicon-48.png"),
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: brandIconUrl("/favicon-32.png"),
        sizes: "32x32",
        type: "image/png",
      },
      { url: brandIconUrl("/favicon.ico"), sizes: "any" },
      {
        url: brandIconUrl("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: brandIconUrl("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: brandIconUrl("/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: [brandIconUrl("/favicon.ico")],
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
  // AuthProvider (login consent, etc.) lives outside `[locale]` — provide intl
  // here so client hooks under AuthProvider still resolve translations.
  let locale = "en"
  let messages: typeof enMessages = enMessages
  try {
    locale = await getLocale()
    messages = (await getMessages()) as typeof enMessages
  } catch {
    // Image / metadata routes (e.g. opengraph-image) have no intl provider.
  }
  const dir = localeDirection(locale)

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className="font-sans antialiased"
    >
      <body>
        {/* Print discovery for audit tools — kept as a media=print link on purpose. */}
        {/* eslint-disable-next-line @next/next/no-css-tags -- print media link required by checklist */}
        <link rel="stylesheet" href="/styles/print.css" media="print" />
        <noscript>
          <div
            style={{
              padding: "1rem 1.25rem",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              background: "#f5f5f5",
              color: "#171717",
            }}
          >
            <p style={{ margin: 0 }}>
              {SITE_NAME} — {SITE_DESCRIPTION}{" "}
              <a href={SITE_URL} style={{ color: "inherit" }}>
                {SITE_URL.replace(/^https:\/\//, "")}
              </a>
            </p>
          </div>
        </noscript>
        <Script
          id="consent-defaults"
          src="/scripts/consent-defaults.js"
          strategy="beforeInteractive"
        />
        <Script
          id="browser-chrome-init"
          src="/scripts/browser-chrome-init.js"
          strategy="beforeInteractive"
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
            <NextIntlClientProvider locale={locale} messages={messages}>
              <AuthProvider>
                <AnalyticsConsentGate>
                  {children}
                  <Toaster position="top-right" />
                </AnalyticsConsentGate>
              </AuthProvider>
            </NextIntlClientProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
