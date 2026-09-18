import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { title, rawText, images } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured in .env.local' },
        { status: 500 }
      );
    }

    const imageRefs = (images || [])
      .map((img, i) => `![${img.alt || 'image'}](${img.src})`)
      .join('\n');

    const prompt = `You are a text formatter like VS Code's code formatter. You ONLY restructure and clean up text. You NEVER add new content.

ABSOLUTE RULES:
- Your output MUST contain the SAME words and sentences the user wrote. Do NOT invent new sentences.
- If the user wrote 10 words, your output must be approximately 10 words. If they wrote 50 words, output ~50 words.
- Fix spelling and grammar mistakes in the user's text.
- Add Markdown headings (#, ##) if the text has natural sections.
- If data looks like a comparison or table, format it as a Markdown table using | pipes |.
- If there is a definition, wrap it in > blockquote.
- Keep all image URLs exactly: ![alt](url)
- NEVER write tutorials, explanations, or new paragraphs that the user did not write.
- NEVER expand a short note into a long article.
- AUTOMATIC TITLE: Generate a concise, accurate 2-5 word title in "generatedTitle" based on the note's subject (e.g., "V8 Engine Architecture", "JavaScript Scope & Closures"). If the note is already named, keep or improve it.

Title: ${title || 'Untitled'}
${imageRefs ? '\nImages:\n' + imageRefs + '\n' : ''}
User's note content (format THIS, do not replace it):
---
${rawText || '(empty)'}
---

Respond with JSON only:
{"generatedTitle":"concise 2-5 word title","formattedUserContent":"the formatted note in markdown","suggestions":[{"id":"sug-1","title":"tip title","type":"tip","content":"one short tip"}]}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;

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

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const errMsg = errData?.error?.message || `Gemini API failed with status ${res.status}`;
      return NextResponse.json({ error: errMsg }, { status: res.status });
    }

    const data = await res.json();
    const rawJSON = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJSON) {
      return NextResponse.json(
        { error: 'Gemini returned an empty response' },
        { status: 502 }
      );
    }

    // Try to parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(rawJSON);
    } catch (parseErr) {
      // Try to extract JSON from the response if it has markdown fences
      const jsonMatch = rawJSON.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('Failed to parse Gemini response as JSON:', rawJSON.substring(0, 200));
          return NextResponse.json(
            { error: 'AI returned invalid JSON. Please try again.' },
            { status: 502 }
          );
        }
      } else {
        console.error('No JSON found in Gemini response:', rawJSON.substring(0, 200));
        return NextResponse.json(
          { error: 'AI returned invalid response format. Please try again.' },
          { status: 502 }
        );
      }
    }

    const content = parsed.formattedUserContent || '';

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
    });
  } catch (error) {
    console.error('Server error in /api/ai/format:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while formatting' },
      { status: 500 }
    );
  }
}