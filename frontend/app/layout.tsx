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
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-[#0D0D1A] text-slate-900 dark:text-slate-100 antialiased selection:bg-[#6C63FF]/20 selection:text-[#6C63FF] transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
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