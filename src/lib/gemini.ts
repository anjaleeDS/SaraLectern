let _apiKey: string = import.meta.env.VITE_GEMINI_API_KEY ?? '';

export function setGeminiApiKey(key: string) {
  _apiKey = key;
}

export function hasGeminiApiKey(): boolean {
  return _apiKey.trim().length > 0;
}

export function getGeminiApiKey(): string {
  return _apiKey;
}

const GEMINI_MODEL = 'gemini-1.5-flash';

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${_apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
      }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function extractFromBio(bioText: string): Promise<string> {
  const prompt = `You are helping build a speaker profile for a speaker placement platform.

Extract and summarize the professional background from this bio or LinkedIn about section. Focus on:
- Professional title and current role
- Years of experience and industry
- Core expertise areas (3-6 specific areas)
- Notable achievements, credentials, or recognitions
- Speaking experience if mentioned
- Target audience they serve

Return a concise plain-text summary. Do not add information not present in the source.

BIO TEXT:
${bioText}`;

  return callGemini(prompt);
}

export async function extractFromVideo(videoUrl: string): Promise<string> {
  const prompt = `You are helping build a speaker profile for a speaker placement platform.

A speaker has provided this video URL: ${videoUrl}

Based on what you can infer about the type of video (talk, interview, presentation, etc.) and any context in the URL, describe what kind of speaker profile information this video likely contains. Then provide a structured summary of what a speaker placement platform would want to know:
- What topics they likely speak about
- The tone and style of their presentation
- The audience they appear to target
- Any expertise signals visible from the URL or context

Note: Since you cannot directly access the video, provide your best inference and flag that the video content should be manually reviewed.

Video URL: ${videoUrl}`;

  return callGemini(prompt);
}

export async function extractFromLinkedIn(linkedinUrl: string): Promise<string> {
  const prompt = `You are helping build a speaker profile for a speaker placement platform.

A speaker has provided their LinkedIn URL: ${linkedinUrl}

Based on the LinkedIn URL structure and any username/company signals you can infer, provide guidance on what type of professional this likely is. Note that you cannot access the actual LinkedIn page, so flag that the profile should be manually reviewed or the user should paste their LinkedIn About section directly.

Provide a template summary with placeholders they should fill in:
- [Name] - Full name from LinkedIn
- [Title] - Current title and company
- [Experience] - Years in field
- [Expertise] - Core expertise areas
- [Achievements] - Notable credentials
- [Speaking] - Any speaking history

LinkedIn URL: ${linkedinUrl}`;

  return callGemini(prompt);
}

export async function extractFromFile(fileContent: string, fileName: string): Promise<string> {
  const prompt = `You are helping build a speaker profile for a speaker placement platform.

Extract and summarize the professional background from this document (${fileName}). Focus on:
- Professional title and current role
- Years of experience and industry
- Core expertise areas (3-6 specific areas)
- Notable achievements, credentials, publications, or recognitions
- Speaking experience, past talks, or event appearances
- Target audience or clients served

Return a concise plain-text summary. Do not add information not present in the document.

DOCUMENT CONTENT:
${fileContent.slice(0, 8000)}`;

  return callGemini(prompt);
}

export async function suggestTopics(backgroundText: string): Promise<string[]> {
  const prompt = `You are a speaking coach helping a rising speaker identify the topics they could credibly own.

Based on the background information below, suggest 4-5 specific, compelling speaking topic angles. These should be concrete enough to pitch to a podcast host or conference organizer — not generic themes.

Format your response as a JSON array of short topic phrases (under 8 words each). Example:
["AI adoption without the hype", "Leading through organizational change", "Building resilient remote teams"]

Only return the JSON array. No explanation, no markdown.

BACKGROUND:
${backgroundText.slice(0, 3000)}`;

  const raw = await callGemini(prompt);
  try {
    const cleaned = raw.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.filter(t => typeof t === 'string').slice(0, 5);
  } catch {
    // fall through to regex extraction
  }
  const matches = raw.match(/"([^"]{5,60})"/g);
  if (matches) return matches.map(m => m.replace(/"/g, '')).slice(0, 5);
  return [];
}
