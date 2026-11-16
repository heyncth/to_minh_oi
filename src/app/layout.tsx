import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` ||
      "http://localhost:3000",
  ),
  title: "Tổ Mình Ơi",
  description: "Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Tổ Mình Ơi",
    title: "Tổ Mình Ơi",
    description: "Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7",
    images: [{ url: "/og.jpg", width: 1200, height: 670, alt: "Tổ Mình Ơi – Bảng tin tổ dân phố, Trợ lý hỏi đáp 24/7" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tổ Mình Ơi",
    description: "Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7",
    images: ["/og.jpg"],
  },
  appleWebApp: {
    capable: true,
    title: "Tổ Mình Ơi",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b5cab",
  width: "device-width",
  initialScale: 1,
  // Android keyboard resizes layout viewport → chat shell follows 100dvh
  interactiveWidget: "resizes-content",
};

// Apply saved font-scale before first paint (no flash).
const fontScaleBootstrap = `(function(){try{var s=localStorage.getItem("font-scale");if(s==="md"||s==="lg"||s==="xl")document.documentElement.setAttribute("data-font-scale",s);}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" data-font-scale="md">
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontScaleBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
