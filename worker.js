export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ version: "v12", database: Boolean(env.DB), uploads: Boolean(env.UPLOADS) });
    }
    if ((url.pathname === "/admin" || url.pathname === "/admin/") && request.method === "GET") {
      url.pathname = "/admin/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    if (url.pathname === "/api/uploads" && request.method === "POST") {
      if (!env.UPLOADS) return json({ error: "Storage UPLOADS is not connected" }, 503);
      const type = request.headers.get("content-type") || "application/octet-stream";
      if (!type.startsWith("image/")) return json({ error: "Images only" }, 415);
      const body = await request.arrayBuffer();
      if (!body.byteLength || body.byteLength > 2_000_000) return json({ error: "Image is too large" }, 413);
      const key = `logo-references/${crypto.randomUUID()}.jpg`;
      await env.UPLOADS.put(key, body, { httpMetadata: { contentType: type } });
      return json({ url: `/api/admin/uploads/${encodeURIComponent(key)}` });
    }
    if (url.pathname.startsWith("/api/admin/uploads/") && request.method === "GET") {
      if (!env.UPLOADS) return new Response("Storage not connected", { status: 503 });
      const key = decodeURIComponent(url.pathname.slice("/api/admin/uploads/".length));
      const object = await env.UPLOADS.get(key);
      if (!object) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("cache-control", "private, max-age=3600");
      return new Response(object.body, { headers });
    }
    if (url.pathname === "/api/briefs" || url.pathname === "/api/admin/briefs") {
      if (!env.DB) return json({ error: "Database DB is not connected" }, 503);
      if (url.pathname === "/api/briefs" && request.method === "POST") {
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
      if (url.pathname === "/api/admin/briefs" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT * FROM brief_drafts ORDER BY updated_at DESC").all();
        return json({ briefs: result.results.map(r => ({...r, answers: JSON.parse(r.answers)})) });
      }
      return new Response("Method not allowed", { status: 405 });
    }
    return env.ASSETS.fetch(request);
  }
};
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }
