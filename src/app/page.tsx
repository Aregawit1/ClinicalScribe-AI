"use client";

import { useState } from "react";
import AppLayout from "./components/layout/app-layout";

export default function Home() {
  const [transcript, setTranscript] = useState("");

  return (
    <AppLayout
      title="New Consultation"
      description="Create a structured clinical note from a Tigrinya consultation."
    >
      <div className="mx-auto max-w-5xl">
        {/* Introduction */}
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
            AI-powered clinical documentation
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Spend less time documenting.
            <span className="block text-teal-700">
              Spend more time caring.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Enter a consultation transcript in Tigrinya and prepare a
            structured clinical note for healthcare professionals to review.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          {/* Consultation form */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  New consultation
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Enter a fictional consultation transcript to get started.
                </p>
              </div>

              <span className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700">
                Draft
              </span>
            </div>

            <label
              htmlFor="transcript"
              className="mt-6 block text-sm font-medium text-slate-700"
            >
              Consultation transcript
            </label>

            <textarea
              id="transcript"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="ኣብዚ ትግርኛ ዝተጻሕፈ ናይ ምክሪ ሓኪምን ተሓካምን ዕላል ኣእትዉ..."
              rows={9}
              className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-base leading-7 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />

            <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-500">
              <span>Text input · Tigrinya</span>
              <span>{transcript.length} characters</span>
            </div>

            <button
              type="button"
              disabled={!transcript.trim()}
              onClick={() => {
                alert(
                  "Our next step is to connect the AI model and generate a clinical note."
                );
              }}
              className="mt-6 w-full rounded-xl bg-teal-700 px-5 py-3.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
            >
              Generate clinical note
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Prototype only. Use fictional information. Generated notes
              require clinician review before any clinical use.
            </p>
          </section>

          {/* Instructions and safety */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                How it works
              </h2>

              <ol className="mt-5 space-y-5">
                <li className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-700">
                    1
                  </span>

                  <div>
                    <p className="font-medium">Enter a transcript</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Provide the consultation text in Tigrinya.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-700">
                    2
                  </span>

                  <div>
                    <p className="font-medium">Generate a draft</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      AI will organize the supplied information into a
                      structured clinical note.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-700">
                    3
                  </span>

                  <div>
                    <p className="font-medium">Review the note</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      A healthcare professional checks and edits the draft.
                    </p>
                  </div>
                </li>
              </ol>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="font-semibold text-amber-900">
                Designed with safety in mind
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-900">
                Missing information must remain missing rather than being
                invented by the AI. Clinical decisions remain with the
                healthcare professional.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}