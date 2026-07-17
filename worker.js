export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/briefs") {
      if (!env.DB) return json({ error: "Database DB is not connected" }, 503);
      if (request.method === "POST") {
        const body = await request.json();
        if (!body.id || !body.answers) return json({ error: "بيانات غير صالحة" }, 400);
        const now = Date.now();
        await env.DB.prepare(`INSERT INTO brief_drafts (id,answers,status,current_step,started_at,updated_at,submitted_at)
          VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET answers=excluded.answers,status=excluded.status,
          current_step=excluded.current_step,updated_at=excluded.updated_at,
          submitted_at=CASE WHEN excluded.status='submitted' THEN excluded.submitted_at ELSE brief_drafts.submitted_at END`)
          .bind(body.id, JSON.stringify(body.answers), body.status === "submitted" ? "submitted" : "incomplete",
            Number(body.currentStep || 0), now, now, body.status === "submitted" ? now : null).run();
        return json({ ok: true });
      }
      if (request.method === "GET") {
        const result = await env.DB.prepare("SELECT * FROM brief_drafts ORDER BY updated_at DESC").all();
        return json({ briefs: result.results.map(r => ({...r, answers: JSON.parse(r.answers)})) });
      }
      return new Response("Method not allowed", { status: 405 });
    }
    return env.ASSETS.fetch(request);
  }
};
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }
