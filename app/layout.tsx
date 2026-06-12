import type { Metadata, Viewport } from "next";
import "./globals.css";
import { JudgeProvider } from '../src/context/JudgeContext';
import ServiceWorkerRegistrar from '../src/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: "Elo Beauty",
  description: "Classement de beauté par système Elo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Elo Beauty",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Elo Beauty" />
      </head>
      <body className="antialiased bg-zinc-950 text-white">
        <JudgeProvider>
          {children}
        </JudgeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
