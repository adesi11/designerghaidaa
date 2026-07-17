نسخة Cloudflare الأصلية — لا تستخدم Next.js أو Vinext ولا تحتاج أمر Build.

إعداد Cloudflare Builds:
- Build command: اتركه فارغًا (None)
- Deploy command: npx wrangler deploy
- Root directory: /

بعد النشر:
1. أنشئ قاعدة D1 باسم designer-ghaida-db.
2. نفّذ database/schema.sql داخل D1 Console.
3. اربط القاعدة بالمشروع باسم DB.
4. احمِ /admin* و /api/briefs* باستخدام Cloudflare Access.

الموقع العام يبقى متاحًا للعملاء، وصفحة الإدارة لا تفتح إلا للبريد المسموح له في Access.
