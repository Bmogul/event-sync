import localFont from "next/font/local";
import "./globals.css";

export const metadata = {
  title: "Event-Sync",
  description: "Event RSVP application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={""}>
        {children}
      </body>
    </html>
  );
}
