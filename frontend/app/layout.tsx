import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayoutShell } from '@/components/app-layout-shell';
import { WelcomeToast } from '@/components/WelcomeToast';
import { Toaster } from 'sonner';

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
    <html lang="en" className="light">
      <body className="min-h-screen bg-white text-gray-900 antialiased selection:bg-[#6C63FF]/20 selection:text-[#6C63FF]">
        <QueryProvider>
          <AuthProvider>
            <Toaster position="top-right" richColors />
            <AppLayoutShell>{children}</AppLayoutShell>
            <WelcomeToast />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}