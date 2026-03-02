import { GoogleGenAI } from "@google/genai";
import { INFOGRAPHIC_SYSTEM_PROMPT } from "@/lib/prompts/infographic";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API! });

export type InfographicPromptResult = {
  prompt: string;
  caption: string;
};

function cleanInfographicCaption(caption: string): string {
  const trimmed = caption.trim();
  if (!trimmed) return "";

  // Remove common boilerplate lead-ins while keeping the substantive sentence.
  const withoutBoilerplate = trimmed.replace(
    /^this infographic (illustrates|shows|depicts)\s+(how|that)?\s*/i,
    "",
  );

  return withoutBoilerplate.trim();
}

function ensureSentence(text: string): string {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/^[-:;,\s]+/, "")
    .trim();
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function normalizeInfographicCaption(caption: string, title: string): string {
  const base = cleanInfographicCaption(caption)
    .replace(/[`*_#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const fallbackTopic = title.replace(/^hypothesis:\s*/i, "").trim();
  const fallbackMechanism = fallbackTopic
    ? `Proposed pathway in "${fallbackTopic}" links the intervention to the biological effect.`
    : "Proposed pathway links the intervention to the biological effect.";
  const fallbackReadout = "Expected marker shifts are visualized with clear directional changes.";

  const normalized = base
    .replace(/^Mechanism:\s*/i, "")
    .replace(/^Readout:\s*/i, "")
    .trim();

  const parts = normalized
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const mechanismSource = parts[0] ?? fallbackMechanism;
  const readoutSource = parts[1] ?? fallbackReadout;

  const mechanism = ensureSentence(mechanismSource);
  const readout = ensureSentence(readoutSource);

  return `Mechanism: ${mechanism} Readout: ${readout}`;
}

export async function generateInfographicPrompt(
  title: string,
  body: string,
): Promise<InfographicPromptResult> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${INFOGRAPHIC_SYSTEM_PROMPT}\n\n---\n\nHypothesis Title: ${title}\n\nHypothesis Body:\n${body}`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 1024 },
    },
  });

  const candidate = response.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error("Gemini response truncated (MAX_TOKENS) — prompt generation incomplete");
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No prompt text in Gemini response");

  // Try to extract JSON object from the response (Gemini often wraps it in markdown/preamble)
  const jsonMatch = text.match(/\{[\s\S]*"prompt"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { prompt?: string; caption?: string };
      if (parsed.prompt) {
        return {
          prompt: parsed.prompt,
          caption: normalizeInfographicCaption(parsed.caption ?? "", title),
        };
      }
    } catch {
      // JSON parse failed, fall through to fallback
    }
  }

  // Fallback: treat entire response as the prompt, no caption
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return { prompt: cleaned, caption: "" };
}

export async function generateInfographicImage(
  prompt: string,
): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "16:9", imageSize: "2K" },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData);

  const imageData = imagePart?.inlineData?.data;
  if (!imageData) {
    throw new Error("No image data in Gemini response");
  }

  return Buffer.from(imageData, "base64");
}
