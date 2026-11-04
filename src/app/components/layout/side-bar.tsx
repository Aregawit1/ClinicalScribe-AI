"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "⌂" },
  { name: "New Consultation", href: "/consultations", icon: "+" },
  { name: "History", href: "/history", icon: "◷" },
  { name: "Settings", href: "/settings", icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white">
            C
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              ClinicalScribe
            </h1>
            <p className="text-xs text-slate-500">AI Clinical Assistant</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center text-lg">
                {item.icon}
              </span>

              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Clinical review required
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            AI-generated notes must be reviewed by a qualified healthcare
            professional.
          </p>
        </div>
      </div>
    </aside>
  );
}