
"use client";

import { useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/app-layout";

type RecordingStatus = "idle" | "recording" | "paused" | "processing" | "stopped";

type ConsultationLanguage = "ti-ER" | "am-ET";

export default function ConsultationPage() {
  const [language, setLanguage] = useState<ConsultationLanguage>("ti-ER");
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>("audio/webm");
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [recordingDebug, setRecordingDebug] = useState(
    "Waiting to start recording."
  );
  const [audioSize, setAudioSize] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const audioUrlRef = useRef<string | null>(null);
  const discardOnStopRef = useRef(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices &&
      "MediaRecorder" in window;

    setIsSupported(supported);

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;

    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) return;

      const currentSessionSeconds = Math.floor(
        (Date.now() - startedAtRef.current) / 1000
      );

      setElapsedSeconds(
        elapsedBeforePauseRef.current + currentSessionSeconds
      );
    }, 250);

    return () => window.clearInterval(interval);
  }, [status]);

  function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }

  function releaseMicrophone() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function clearPreviousAudio() {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    audioUrlRef.current = null;
    setAudioUrl(null);
    setAudioMimeType("audio/webm");
  }

  async function startRecording() {
    setError("");

    if (!isSupported) {
      setError(
        "Audio recording is not supported by this browser. Please use a recent version of Chrome or Edge."
      );
      return;
    }

    // Prevent overlapping recorder sessions.
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      setError("A recording is already in progress. Stop it before starting another.");
      return;
    }

    try {
      clearPreviousAudio();
      chunksRef.current = [];
      discardOnStopRef.current = false;
      elapsedBeforePauseRef.current = 0;
      startedAtRef.current = null;
      setElapsedSeconds(0);
      setAudioSize(0);
      setRecordingDebug("Requesting microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setRecordingDebug(
        `Microphone connected (${stream.getAudioTracks().length} audio track(s)). Initializing recorder...`
      );

      const supportedMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const mimeType = supportedMimeTypes.find((type) => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      });

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      // Collect audio chunks as they arrive, including the final chunk on stop.
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          const totalBytes = chunksRef.current.reduce(
            (total, chunk) => total + chunk.size,
            0
          );
          setAudioSize(totalBytes);
          setRecordingDebug(
            `Recording data received: ${chunksRef.current.length} chunk(s), ${(totalBytes / 1024).toFixed(2)} KB.`
          );
        } else {
          setRecordingDebug("The browser delivered an empty audio chunk.");
        }
      };

      recorder.onerror = (event: Event) => {
        const recorderError = event as Event & { error?: DOMException };
        const details = recorderError.error?.message || "Unknown MediaRecorder error.";
        setError(`Recording failed: ${details}`);
        setRecordingDebug("The browser reported a recording error.");
        startedAtRef.current = null;
        discardOnStopRef.current = true;
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            // The recorder may already have stopped after the error.
          }
        }
        recorderRef.current = null;
        releaseMicrophone();
        setStatus("idle");
      };

      recorder.onstop = () => {
        const chunks = [...chunksRef.current];
        // Prefer the MIME type attached to the actual recorded bytes.
        const actualMimeType =
          chunks.find((chunk) => chunk.type)?.type ||
          recorder.mimeType ||
          "audio/webm";

        releaseMicrophone();
        startedAtRef.current = null;
        recorderRef.current = null;

        if (discardOnStopRef.current) {
          chunksRef.current = [];
          discardOnStopRef.current = false;
          setRecordingDebug("Recording discarded.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: actualMimeType });
        setAudioSize(audioBlob.size);

        if (audioBlob.size === 0) {
          setAudioUrl(null);
          audioUrlRef.current = null;
          setStatus("idle");
          setRecordingDebug("Recording stopped, but no audio bytes were captured.");
          setError(
            "No audio data was captured. Check that the correct microphone is selected and that the browser has permission to use it. Record for at least 3 seconds and try again."
          );
          return;
        }

        // Replace any previous object URL before exposing the new recording.
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }

        const url = URL.createObjectURL(audioBlob);
        audioUrlRef.current = url;
        setAudioMimeType(audioBlob.type || actualMimeType);
        setAudioUrl(url);
        setStatus("stopped");
        setError("");
        setRecordingDebug(
          `Recording finalized successfully: ${(audioBlob.size / 1024).toFixed(2)} KB, type ${audioBlob.type || actualMimeType}.`
        );
      };

      // Do not request periodic timeslices. Some browser/media pipelines can
      // produce concatenated WebM fragments that fail to demux in the audio
      // element. Let MediaRecorder emit the completed container on stop.
      recorder.start();
      startedAtRef.current = Date.now();
      setStatus("recording");
      setRecordingDebug(
        `Recorder started (${recorder.mimeType || "browser default format"}). Audio data will be finalized when you stop.`
      );
    } catch (caughtError) {
      releaseMicrophone();
      recorderRef.current = null;
      startedAtRef.current = null;

      const message =
        caughtError instanceof Error ? caughtError.message : "Unknown error";
      setError(
        message.toLowerCase().includes("permission") ||
          message.toLowerCase().includes("denied")
          ? "Microphone access was denied. Allow microphone access in your browser settings, then try again."
          : `Unable to start recording. ${message}`
      );
      setRecordingDebug(`Unable to start: ${message}`);
      setStatus("idle");
    }
  }

  function pauseRecording() {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state !== "recording") return;

    if (startedAtRef.current !== null) {
      elapsedBeforePauseRef.current += Math.floor(
        (Date.now() - startedAtRef.current) / 1000
      );
    }

    recorder.pause();
    startedAtRef.current = null;
    setElapsedSeconds(elapsedBeforePauseRef.current);
    setStatus("paused");
  }

  function resumeRecording() {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state !== "paused") return;

    recorder.resume();
    startedAtRef.current = Date.now();
    setStatus("recording");
  }

  function stopRecording() {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") return;

    if (startedAtRef.current !== null) {
      elapsedBeforePauseRef.current += Math.floor(
        (Date.now() - startedAtRef.current) / 1000
      );
      startedAtRef.current = null;
    }

    setElapsedSeconds(elapsedBeforePauseRef.current);
    setError("");
    setStatus("processing");

    try {
      recorder.stop();
      // The onstop handler finalizes the Blob and changes status to "stopped".
    } catch {
      releaseMicrophone();
      recorderRef.current = null;
      setStatus("idle");
      setRecordingDebug("The recorder could not finalize the recording.");
      setError("The recording could not be finalized. Please try again.");
    }
  }

  function deleteRecording() {
    const recorder = recorderRef.current;

    // Mark the session for discard so its asynchronous onstop event cannot
    // recreate an audio URL after the user deletes the recording.
    discardOnStopRef.current = true;

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Continue cleanup even if the recorder has already stopped.
      }
    }

    releaseMicrophone();
    clearPreviousAudio();

    chunksRef.current = [];
    elapsedBeforePauseRef.current = 0;
    startedAtRef.current = null;
    recorderRef.current = null;

    setElapsedSeconds(0);
    setAudioSize(0);
    setRecordingDebug("Recording deleted. Ready to record again.");
    setStatus("idle");
    setError("");
  }

  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isProcessing = status === "processing";
  const hasRecording = status === "stopped" && audioUrl !== null;

  return (
    <AppLayout
      title="New Consultation"
      description="Record a clinical conversation and prepare it for documentation"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page introduction */}
        <section>
          <h1 className="text-2xl font-bold text-slate-900">
            Record Consultation
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Record the conversation between the healthcare professional
            and the patient. After recording, the audio can be reviewed
            before transcription and clinical note generation.
          </p>
        </section>

        {/* Language selection */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Consultation Language
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the primary language spoken during the consultation.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setLanguage("ti-ER")}
              disabled={isRecording || isPaused}
              aria-pressed={language === "ti-ER"}
              className={`rounded-xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                language === "ti-ER"
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-100"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="text-2xl">🇪🇷</span>

              <span className="mt-3 block font-semibold text-slate-900">
                ትግርኛ
              </span>

              <span className="mt-1 block text-sm text-slate-500">
                Tigrinya
              </span>

              {language === "ti-ER" && (
                <span className="mt-3 inline-block text-xs font-semibold text-teal-800">
                  Selected
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLanguage("am-ET")}
              disabled={isRecording || isPaused}
              aria-pressed={language === "am-ET"}
              className={`rounded-xl border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                language === "am-ET"
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-100"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <span className="text-2xl">🇪🇹</span>

              <span className="mt-3 block font-semibold text-slate-900">
                አማርኛ
              </span>

              <span className="mt-1 block text-sm text-slate-500">
                Amharic
              </span>

              {language === "am-ET" && (
                <span className="mt-3 inline-block text-xs font-semibold text-teal-800">
                  Selected
                </span>
              )}
            </button>
          </div>
        </section>

        {/* Recording panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div
              className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-4xl ${
                isRecording
                  ? "animate-pulse bg-red-100"
                  : isPaused
                  ? "bg-amber-100"
                  : isProcessing
                    ? "bg-blue-100"
                    : "bg-teal-50"
              }`}
              aria-hidden="true"
            >
              {isRecording ? "🔴" : isPaused ? "⏸️" : isProcessing ? "⏳" : "🎙️"}
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              {isRecording
                ? "Recording in progress"
                : isPaused
                  ? "Recording paused"
                  : isProcessing
                    ? "Preparing recording…"
                    : hasRecording
                    ? "Recording completed"
                    : "Ready to record"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {isRecording
                ? "The microphone is capturing audio."
                : isPaused
                  ? "Resume when you're ready to continue."
                  : isProcessing
                    ? "Finalizing the audio. Please wait."
                    : hasRecording
                    ? "Play the recording below to review the audio."
                    : `Selected language: ${
                        language === "ti-ER" ? "Tigrinya" : "Amharic"
                      }`}
            </p>

            <div
              className="my-6 font-mono text-4xl font-semibold tracking-wider text-slate-900"
              role="timer"
              aria-live="off"
            >
              {formatTime(elapsedSeconds)}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {status === "idle" && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white transition hover:bg-teal-800"
                >
                  🎙️ Start Recording
                </button>
              )}

              {isRecording && (
                <>
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    ⏸ Pause
                  </button>

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                  >
                    ⏹ Stop Recording
                  </button>
                </>
              )}

              {isPaused && (
                <>
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"
                  >
                    ▶ Resume
                  </button>

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
                  >
                    ⏹ Stop Recording
                  </button>
                </>
              )}

              {hasRecording && (
                <>
                  <button
                    type="button"
                    onClick={deleteRecording}
                    className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    🗑 Delete Recording
                  </button>

                  <button
                    type="button"
                    onClick={startRecording}
                    className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"
                  >
                    ↻ Record Again
                  </button>
                </>
              )}
            </div>
          </div>

          {isProcessing && !error && (
            <p className="mt-6 text-center text-sm font-medium text-blue-700" role="status">
              Preparing your audio recording…
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            >
              {error}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Recording Diagnostics
            </h3>
            <p className="mt-2 text-sm text-slate-600" role="status">
              {recordingDebug}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Captured audio: {(audioSize / 1024).toFixed(2)} KB
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Recorder state: {recorderRef.current?.state ?? "inactive"}
            </p>
          </div>

          {!isSupported && (
            <p className="mt-4 text-center text-sm text-red-700">
              Your browser does not support the required recording
              features. Try a recent version of Chrome or Edge.
            </p>
          )}

          {hasRecording && audioUrl && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="font-semibold text-slate-900">
                Review Your Recording
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Listen to the audio before moving to transcription.
              </p>

              <audio
                controls
                preload="metadata"
                src={audioUrl}
                className="mt-4 w-full"
                onLoadedMetadata={(event) => {
                  const audio = event.currentTarget;
                  setRecordingDebug(
                    `Audio player loaded. Duration: ${Number.isFinite(audio.duration) ? `${audio.duration.toFixed(1)} seconds` : "unknown"}.`
                  );
                }}
                onError={(event) => {
                  const audio = event.currentTarget;
                  const mediaError = audio.error;
                  const details = mediaError
                    ? `Media error code ${mediaError.code}${mediaError.message ? `: ${mediaError.message}` : ""}`
                    : "The browser could not load this audio.";
                  setError(`Audio playback failed. ${details}`);
                  setRecordingDebug(`Playback error: ${details}`);
                }}
              />

              <a
                href={audioUrl}
                download={`consultation-${language}-${Date.now()}.${audioMimeType.includes("mp4") ? "mp4" : audioMimeType.includes("ogg") ? "ogg" : "webm"}`}
                className="mt-4 inline-flex rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Download Audio
              </a>
            </div>
          )}
        </section>

        {/* Next stage */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="font-semibold text-slate-900">
            What happens next?
          </h2>

          <div className="mt-4 space-y-3">
            <WorkflowStep
              number="1"
              title="Transcribe the audio"
              description="Convert the recording into written Tigrinya or Amharic."
              status="Next step"
            />

            <WorkflowStep
              number="2"
              title="Generate a clinical note"
              description="Prepare an editable SOAP note from the reviewed transcript."
              status="Coming next"
            />

            <WorkflowStep
              number="3"
              title="Export the PDF"
              description="Create a downloadable document after clinician review."
              status="Coming next"
            />
          </div>
        </section>

        {/* Privacy notice */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Patient Privacy and Consent
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-900">
            Obtain appropriate consent before recording a consultation.
            Use fictional conversations while testing. This prototype keeps
            the recording in browser memory; it does not upload the audio
            to a server. Downloaded recordings are saved on your device,
            so handle them securely.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}

type WorkflowStepProps = {
  number: string;
  title: string;
  description: string;
  status: string;
};

function WorkflowStep({
  number,
  title,
  description,
  status,
}: WorkflowStepProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-800">
        {number}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
        {status}
      </span>
    </div>
  );
}

