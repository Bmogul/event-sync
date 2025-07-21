import localFont from "next/font/local";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';

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
