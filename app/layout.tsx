import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบบริหารคลังพัสดุ สำนักอนามัยการเจริญพันธุ์",
  description: "Inventory Management System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link
          rel="preload"
          href="/fonts/2.3.2%20THSarabunNew.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>

      <body className="bg-gray-100 text-black">
        {children}
      </body>
    </html>
  );
}