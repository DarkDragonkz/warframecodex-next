import { Roboto_Condensed } from "next/font/google";
import './globals.css'; // Carica solo le basi per tutta l'app

const robotoCondensed = Roboto_Condensed({ 
  subsets: ["latin"], 
  weight: ["300", "400", "700"],
  variable: "--font-roboto",
});

export const metadata = {
  title: "Ordis Codex",
  description: "Warframe Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={robotoCondensed.className}>
        {children}
      </body>
    </html>
  );
}