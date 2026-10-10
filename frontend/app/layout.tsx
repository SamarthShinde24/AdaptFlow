import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayoutShell } from '@/components/app-layout-shell';
import { WelcomeToast } from '@/components/WelcomeToast';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'AdaptFlow - Multimodal Adaptive Learning Platform',
  description:
    'AI-powered learning platform with source-grounded multimodal ingestion, interactive citations, and adaptive assessments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 antialiased selection:bg-[#6C63FF]/20 selection:text-[#6C63FF] transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <AuthProvider>
              <Toaster position="top-right" richColors />
              <AppLayoutShell>{children}</AppLayoutShell>
              <WelcomeToast />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}