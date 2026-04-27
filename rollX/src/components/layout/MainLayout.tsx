import React from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center">
      <Header />
      <main className="flex-1 p-4 lg:p-8">{children}</main>
      <Footer />
    </div>
  );
}
