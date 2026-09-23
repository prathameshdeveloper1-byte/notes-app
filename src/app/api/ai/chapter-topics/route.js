import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { folderId, folderTitle, pages } = await request.json();
    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!groqApiKey && !geminiApiKey) {
      return NextResponse.json(
        { error: 'Neither GROQ_API_KEY nor GEMINI_API_KEY is configured in .env.local' },
        { status: 500 }
      );
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({ topics: [] });
    }

    // Build context summary of pages in this chapter
    const pagesContext = pages
      .map((p, idx) => {
        return `=== NOTE ${idx + 1}: "${p.title || 'Untitled Note'}" (ID: ${p.id}) ===\n${(p.text || '').substring(0, 4000)}`;
      })
      .join('\n\n');

    const systemPrompt = `You are an expert notes indexer.
Analyze the following student notes from the chapter "${folderTitle || 'Chapter'}".
Your task is to identify and extract the ACTUAL, LITERAL section and topic headings that are present in the student's notes.

CRITICAL RULES:
1. DO NOT invent new topic names. DO NOT summarize or rewrite the titles into abstract concepts.
2. Extract the EXACT headings and numbered sections as written in the notes (for example: "1. What Determines this?", "2. Arrow Functions and this", "3. call / apply / bind", "4. this Inside a Constructor Function / Class", "5. Losing this in Callbacks").
3. Preserve the user's exact numbering ("1.", "2.", "3.") and wording.
4. Exclude only trivial standalone code markers (like raw "Example", "Output", "Console Log").
5. For each topic:
   - "title": The EXACT heading or section name from the note.
   - "pageId": The ID of the note where this topic appears.
   - "anchorText": The exact text from the note to scroll and highlight.
   - "summary": A 1-sentence excerpt of what is explained under this heading.

Output JSON ONLY in this format:
{
  "topics": [
    {
      "title": "Exact Title From Note",
      "pageId": "exact-page-id",
      "anchorText": "exact heading text",
      "summary": "1-sentence summary"
    }
  ]
}`;

    const userPrompt = `Chapter Notes Content:
${pagesContext}

Extract the conceptual topics in JSON format now.`;

    let rawJSON = null;
    let usedProvider = null;
    let usedModel = null;
    let lastError = null;

    // ── 1. Priority 1: Groq Ultra-Fast LPU (typically 400ms - 1.5s) ─────────────
    if (groqApiKey) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];

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
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1,
              max_tokens: 2048,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              rawJSON = content.trim();
              usedProvider = 'groq';
              usedModel = model;
              break;
            }
          } else {
            const errData = await res.json().catch(() => null);
            lastError = errData?.error?.message || `Groq status ${res.status}`;
            console.warn(`Groq model ${model} failed:`, lastError);
          }
        } catch (err) {
          lastError = err.message;
          console.warn(`Groq fetch error with ${model}:`, err.message);
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
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
                maxOutputTokens: 2048,
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            rawJSON = parts.map((p) => p.text || '').join('').trim();
            if (rawJSON) {
              usedProvider = 'gemini';
              usedModel = model;
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
      console.error('All AI models failed for chapter-topics:', lastError);
      return NextResponse.json(
        { error: lastError || 'Failed to generate topics from AI models' },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawJSON);
    } catch {
      const match = rawJSON.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse AI JSON response');
      }
    }

    const rawTopics = Array.isArray(parsed?.topics) ? parsed.topics : [];

    // Filter out any accidental low-quality generic words
    const bannedWords = new Set([
      'introduction', 'overview', 'summary', 'conclusion',
      'example', 'code example', 'output', 'notes', 'step 1', 'step 2',
      'step 3', 'syntax', 'demo', 'result'
    ]);

    const filteredTopics = rawTopics.filter((t) => {
      const titleLower = (t.title || '').trim().toLowerCase();
      if (!titleLower || titleLower.length < 3) return false;
      if (bannedWords.has(titleLower)) return false;
      return true;
    });

    const now = Date.now();
    // Format topics with IDs and timestamps
    const topics = filteredTopics.map((t, idx) => ({
      id: `ai-topic-${folderId}-${idx}-${(t.title || '').toLowerCase().replace(/[^\w]/g, '-')}`,
      title: t.title || 'Untitled Topic',
      pageId: t.pageId || pages[0]?.id,
      anchorText: t.anchorText || t.title,
      summary: t.summary || '',
      folderId,
      sourceType: 'ai',
      provider: usedProvider,
      model: usedModel,
      updatedAt: now,
    }));

    return NextResponse.json({
      topics,
      provider: usedProvider,
      model: usedModel,
      generatedAt: now,
    });
  } catch (err) {
    console.error('Error in /api/ai/chapter-topics:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate chapter topics' },
      { status: 500 }
    );
  }
}
