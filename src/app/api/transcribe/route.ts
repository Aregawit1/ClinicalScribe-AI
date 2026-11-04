import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function getAudioExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("mp4")) return "mp4";

  return "webm";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Transcription is not configured. Please configure OPENAI_API_KEY.",
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "Please provide an audio recording." },
        { status: 400 }
      );
    }

    if (audio.size === 0) {
      return NextResponse.json(
        { error: "The audio recording is empty." },
        { status: 400 }
      );
    }

    if (audio.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The audio file must be smaller than 25 MB." },
        { status: 413 }
      );
    }

    const allowedTypes = [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/mpga",
      "audio/m4a",
    ];

    const audioType = audio.type.toLowerCase().split(";")[0];

    if (audioType && !allowedTypes.includes(audioType)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${audioType}. Please record or upload WebM, MP4, WAV, OGG, or MP3 audio.`,
        },
        { status: 415 }
      );
    }

    const extension = getAudioExtension(audioType || "audio/webm");

    // Create a file with a filename and MIME type that identify
    // the audio format to the transcription API.
    const audioFile = new File(
      [audio],
      `consultation.${extension}`,
      {
        type: audioType || "audio/webm",
      }
    );

    // OpenAI expects multipart form data, not raw audio bytes.
    const openAIFormData = new FormData();

    openAIFormData.append("file", audioFile);
    openAIFormData.append("model", "gpt-transcribe");
    openAIFormData.append("response_format", "json");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: openAIFormData,
        cache: "no-store",
        signal: AbortSignal.timeout(110_000),
      }
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "OpenAI transcription request failed:",
        response.status,
        details.slice(0, 1000)
      );

      if (response.status === 401) {
        return NextResponse.json(
          {
            error:
              "The transcription API rejected the API key. Check OPENAI_API_KEY.",
          },
          { status: 502 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "The transcription service is currently rate-limited or your API quota is unavailable. Check your API usage and billing.",
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error:
            "The transcription service could not process the recording. Please try again.",
        },
        { status: 502 }
      );
    }

    const result: unknown = await response.json();

    if (
      typeof result !== "object" ||
      result === null ||
      !("text" in result) ||
      typeof result.text !== "string"
    ) {
      return NextResponse.json(
        {
          error:
            "The transcription service returned an invalid response.",
        },
        { status: 502 }
      );
    }

    const transcript = result.text.trim();

    if (!transcript) {
      return NextResponse.json(
        {
          error:
            "No speech was recognized. Please check the audio and try again.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      transcript,
      language: "auto",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "TimeoutError"
    ) {
      return NextResponse.json(
        {
          error:
            "Transcription took too long. Please try a shorter recording.",
        },
        { status: 504 }
      );
    }

    console.error("Transcription request failed:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred during transcription.",
      },
      { status: 500 }
    );
  }
}