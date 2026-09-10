import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Week 5 Simulated Coordination Prototype",
  description: "Classroom-only referral-to-appointment workflow prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="prototype-banner" role="status">
          CLASSROOM PROTOTYPE — SIMULATED DATA ONLY
        </div>
        {children}
      </body>
    </html>
  );
}

