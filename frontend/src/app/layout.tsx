import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiAsistente - Premium AI ERP",
  description: "Modern Code-First ERP with AI integrated",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-neutral-50 overflow-auto">
        {children}
      </body>
    </html>
  );
}
