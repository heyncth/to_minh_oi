import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tổ Mình Ơi",
  description: "Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7",
  manifest: "/manifest.json",
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
