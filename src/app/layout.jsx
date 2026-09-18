import '../styles/index.css';

export const metadata = {
  title: 'Book Notes — Your Personal Cloud Notebook',
  description: 'A physical notebook experience organized into Books, Chapters, and Notes. Built with Next.js, Tiptap, and Supabase.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-paper-50 dark:bg-ink-900 text-ink-800 dark:text-paper-100 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}