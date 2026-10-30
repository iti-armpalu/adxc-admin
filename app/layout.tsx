// app/layout.tsx
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { StytchProvider } from "@/components/auth/stytch-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ADXC",
  description: "Premium data. Pay as you go.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <StytchProvider>
          <TooltipProvider delayDuration={300}>
            {children}
          </TooltipProvider>
        </StytchProvider>
      </body>
    </html>
  );
}