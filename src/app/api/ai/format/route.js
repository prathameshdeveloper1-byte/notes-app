import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { title, rawText, images } = await request.json();
    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!groqApiKey && !geminiApiKey) {
      return NextResponse.json(
        { error: 'Neither GROQ_API_KEY nor GEMINI_API_KEY is configured in .env.local' },
        { status: 500 }
      );
    }

    const imageRefs = (images || [])
      .map((img, i) => `![${img.alt || 'image'}](${img.src})`)
      .join('\n');

    const prompt = `You are a professional text formatter like VS Code's code formatter. You ONLY restructure, clean up, and neatly format student study notes. You NEVER add new artificial content.

ABSOLUTE RULES:
- Your output MUST contain the SAME words, facts, and sentences the user wrote. Do NOT invent new sentences or long articles.
- Fix spelling and grammar mistakes in the user's text.
- Add Markdown headings (#, ##) if the text has natural sections.
- If data looks like a comparison, table, or structured list, format it as a clean Markdown table using | pipes |.
- If there is a definition or important note, wrap it in > blockquote.
- Keep all image URLs exactly: ![alt](url)
- Keep all code snippets in code blocks with syntax highlighting (\`\`\`javascript, etc.).
- NEVER write tutorials or long paragraphs that the user did not write.
- NEVER output lone bullet characters, standalone dots (•, ., -), or empty bullet lines. Every bullet point must have its text on the SAME line.
- AUTOMATIC TITLE: Generate a concise, accurate 2-5 word title in "generatedTitle" based on the note's subject (e.g., "JavaScript this Binding", "V8 Engine Architecture"). If the note is already named, keep or improve it.

Title: ${title || 'Untitled'}
${imageRefs ? '\nImages:\n' + imageRefs + '\n' : ''}
User's note content (format THIS, do not replace it):
---
${rawText || '(empty)'}
---

Respond with JSON only:
{"generatedTitle":"concise 2-5 word title","formattedUserContent":"the formatted note in markdown","suggestions":[{"id":"sug-1","title":"tip title","type":"tip","content":"one short tip"}]}`;

    let rawJSON = null;
    let usedProvider = null;
    let lastError = null;

    // ── 1. Priority 1: Ultra-Fast Groq LPU (typically ~1-2 seconds) ────────────
    if (groqApiKey) {
      const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

      for (const model of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are a precise, ultra-fast Markdown text formatter. Respond strictly in JSON format.' },
                { role: 'user', content: prompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.05,
              max_tokens: 4096,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              rawJSON = content.trim();
              usedProvider = 'groq';
              break;
            }
          } else {
            const errData = await res.json().catch(() => null);
            lastError = errData?.error?.message || `Groq status ${res.status}`;
            console.warn(`Groq format with ${model} failed:`, lastError);
          }
        } catch (err) {
          lastError = err.message;
          console.warn(`Groq format fetch error (${model}):`, err.message);
        }
      }
    }

    // ── 2. Priority 2: Gemini Fallback ──────────────────────────────────────────
    if (!rawJSON && geminiApiKey) {
      const geminiModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

      for (const model of geminiModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.05,
                responseMimeType: 'application/json',
                maxOutputTokens: 4096,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            rawJSON = parts.map((p) => p.text || '').join('').trim();
            if (rawJSON) {
              usedProvider = 'gemini';
              break;
            }
          } else {
            const errData = await res.json().catch(() => null);
            lastError = errData?.error?.message || `Gemini status ${res.status}`;
          }
        } catch (err) {
          lastError = err.message;
        }
      }
    }

    if (!rawJSON) {
      console.error('All AI format models failed:', lastError);
      return NextResponse.json(
        { error: lastError || 'Failed to format note from AI models' },
        { status: 502 }
      );
    }

    // Try to parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(rawJSON);
    } catch {
      const jsonMatch = rawJSON.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('Failed to parse AI response as JSON:', rawJSON.substring(0, 200));
          return NextResponse.json(
            { error: 'AI returned invalid JSON. Please try again.' },
            { status: 502 }
          );
        }
      } else {
        console.error('No JSON found in AI response:', rawJSON.substring(0, 200));
        return NextResponse.json(
          { error: 'AI returned invalid response format. Please try again.' },
          { status: 502 }
        );
      }
    }

    // Clean stray bullet dots
    let content = (parsed.formattedUserContent || '')
      .split('\n')
      .filter((line) => !/^[\s\u00a0\u200b]*([•·●○▪▫◦⁃‣\.\*\-]|&bull;|&middot;)+[\s\u00a0\u200b]*$/.test(line))
      .join('\n');

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'AI returned empty formatted content. Your note was not changed.' },
        { status: 502 }
      );
    }

    let genTitle = (parsed.generatedTitle || '').trim();
    if (!genTitle) {
      const headingMatch = content.match(/^#+\s+(.+)$/m);
      if (headingMatch) {
        genTitle = headingMatch[1].replace(/[*_~`#]/g, '').trim();
      }
    }

    return NextResponse.json({
      generatedTitle: genTitle,
      formattedUserContent: content,
      suggestions: parsed.suggestions || [],
      provider: usedProvider,
    });
  } catch (error) {
    console.error('Server error in /api/ai/format:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while formatting' },
      { status: 500 }
    );
  }
}