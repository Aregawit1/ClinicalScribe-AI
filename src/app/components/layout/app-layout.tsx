
import type { ReactNode } from "react";
import Sidebar from "./side-bar";
import Header from "./header";

type AppLayoutProps = {
  children: ReactNode;
  title: string;
  description?: string;
};

export default function AppLayout({
  children,
  title,
  description,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} description={description} />

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

