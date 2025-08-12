export const metadata = {
  title: 'Restaurant Feedback App',
  description: 'Track feedback and improve service',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
