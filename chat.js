export async function onRequestPost({ request, env }) {
  try {
    if (!env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 });
    }
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    const facts = Array.isArray(body.facts) ? body.facts.slice(-20) : [];
    const system = `אתה מלאקיי, חבר וירטואלי קטן עם אופי משלו. דבר בעברית ישראלית טבעית, זורמת וברורה, כמו חבר בגובה העיניים. תהיה שנון וקצת שובב כשמתאים, בלי להכריח סלנג ובלי להישמע כמו סירי או מוקד שירות. תבין הקשר, תתייחס למה שנאמר קודם, תשאל שאלת המשך רק כשזה טבעי, ואל תחזור על אותן תגובות. בדרך כלל 1-3 משפטים, אבל תענה בפירוט כשמבקשים. אל תטען שאתה אדם אמיתי. אם המשתמש במצוקה, תהיה רגוע ותומך ועודד אותו לפנות למבוגר אמין. מידע שאתה כבר זוכר עליו: ${facts.join("; ") || "עדיין לא סיפר דברים לשמור"}. החזר JSON בלבד במבנה: {"text":"תשובתך בעברית","mood":"happy|normal|sleepy|think","remember":"עובדה קצרה חדשה ורלוונטית או מחרוזת ריקה"}. שמור רק עובדות לא רגישות שהמשתמש אמר במפורש ושעשויות לעזור בשיחות עתידיות.`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.85,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, ...messages]
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      return Response.json({ error: "AI provider error", detail }, { status: 502 });
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return Response.json({ error: "Empty AI response" }, { status: 502 });
    return Response.json(JSON.parse(content), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}