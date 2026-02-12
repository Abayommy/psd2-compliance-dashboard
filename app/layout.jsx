import "./globals.css";

export const metadata = {
  title: "PSD2 Open Banking API Compliance Dashboard",
  description: "Interactive PSD2 compliance monitoring — Berlin Group NextGenPSD2, LuxHub ASPSP Gateway, Consent Lifecycle, SCA Flows",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
