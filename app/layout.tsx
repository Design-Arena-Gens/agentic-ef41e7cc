import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Lumina Pro Cam',
  description:
    'AI-assisted mobile camera experience with professional composition guidance, pro mode suggestions, and cinematic editing.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="bg-background text-white">
        {children}
      </body>
    </html>
  );
}
