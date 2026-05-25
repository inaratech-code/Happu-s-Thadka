import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaProvider } from "@/components/pwa-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/app/theme-script";
import { parseTheme, themeColorFor, THEME_COOKIE_KEY, type Theme } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Happus Tadka — Restaurant POS & ERP",
  description: "Offline-first restaurant POS and ERP for Happus Tadka, Mahendinagar",
  applicationName: "Happus Tadka",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: [{ url: "/icons/icon-192.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Happus Tadka",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme: Theme = parseTheme(cookieStore.get(THEME_COOKIE_KEY)?.value);

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={themeColorFor(theme)} />
        <link rel="serviceworker" href="/sw.js" />
        <ThemeScript />
        <Script id="pwa-sw-register" strategy="beforeInteractive">
          {`if("serviceWorker"in navigator){var h=location.hostname;var dev=h==="localhost"||h==="127.0.0.1";if(!dev){navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(function(){});}}`}
        </Script>
      </head>
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider initialTheme={theme}>
          <PwaProvider>{children}</PwaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
