import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Macrotrader Academy — Formation au trading macro",
  description:
    "Centre de formation en ligne : parcours étudiants et espace enseignant pour le trading macroéconomique.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <SiteHeader />
        <main className="container">{children}</main>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} Macrotrader Academy</span>
          <span>Apprendre la macroéconomie appliquée aux marchés.</span>
        </footer>
      </body>
    </html>
  );
}
