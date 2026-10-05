import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Association of Junior Engineers, Punjab | Patiala",
  description:
    "Membership portal of the Association of Junior Engineers, Punjab (PSPCL/PSTCL) (Regd.), Patiala. Apply for membership online.",
  icons: "/logo.jpeg",
};

// Applies the saved theme before first paint (light is the default).
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${quicksand.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
