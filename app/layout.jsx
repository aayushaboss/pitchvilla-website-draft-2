import Script from 'next/script';
import ScrollReveal from '@/components/ScrollReveal';
import './globals.css';

export const metadata = {
  title: 'Pitchvilla 100X Forge',
  description: 'A six-month founder program in Ahmedabad with 50+ CXOs and experts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <ScrollReveal />
        <Script src="/motion.js" strategy="beforeInteractive" />
        <Script src="/image-slot.js" strategy="beforeInteractive" />
        <Script src="/autoscroll.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
