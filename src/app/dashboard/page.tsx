import Link from "next/link";
import AppLayout from "../components/layout/app-layout";

const stats = [
  {
    title: "Total Consultations",
    value: "0",
    description: "All consultations created",
  },
  {
    title: "Draft Notes",
    value: "0",
    description: "Notes awaiting review",
  },
  {
    title: "Reviewed Notes",
    value: "0",
    description: "Notes reviewed by clinicians",
  },
];

export default function DashboardPage() {
  return (
    <AppLayout
      title="Dashboard"
      description="Your clinical documentation workspace"
    >
      <div className="space-y-8">
        {/* Welcome section */}
        <section className="rounded-2xl bg-teal-800 p-8 text-white">
          <p className="text-sm font-medium text-teal-100">
            Welcome to ClinicalScribe AI
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Spend less time documenting.
            <br />
            Spend more time caring.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-teal-50">
            Transform Tigrinya consultation transcripts into structured
            clinical note drafts for healthcare professionals to review.
          </p>

          <Link
            href="/consultations"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-teal-800 transition hover:bg-teal-50"
          >
            + New Consultation
          </Link>
        </section>

        {/* Statistics */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Overview
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-slate-500">{stat.title}</p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {stat.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Recent consultations */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Consultations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest clinical documentation activity.
              </p>
            </div>

            <Link
              href="/history"
              className="text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              View history →
            </Link>
          </div>

          <div className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-2xl text-teal-700">
              +
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No consultations yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your saved consultations will appear here.
            </p>

            <Link
              href="/consultations"
              className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Start your first consultation
            </Link>
          </div>
        </section>

        {/* Clinical safety */}
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Clinical Safety
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-900">
            AI-generated clinical notes are drafts. A qualified healthcare
            professional must review them before clinical use.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}