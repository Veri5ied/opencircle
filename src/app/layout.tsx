import type { Metadata } from "next";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCircle",
  description: "Multi-LLM conversations you can join.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-[#080809] text-[#cac8d8]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
