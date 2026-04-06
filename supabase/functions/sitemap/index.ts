import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://marketplace-gzn.lovable.app";

const STATIC_PAGES = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/auth", priority: "0.6", changefreq: "monthly" },
  { loc: "/about", priority: "0.7", changefreq: "monthly" },
  { loc: "/contact", priority: "0.6", changefreq: "monthly" },
  { loc: "/blog", priority: "0.8", changefreq: "weekly" },
  { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { loc: "/refund-policy", priority: "0.3", changefreq: "yearly" },
  { loc: "/cookie-policy", priority: "0.3", changefreq: "yearly" },
  { loc: "/disclaimer", priority: "0.3", changefreq: "yearly" },
  { loc: "/become-seller", priority: "0.6", changefreq: "monthly" },
  { loc: "/loyalty", priority: "0.5", changefreq: "monthly" },
];

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .order("updated_at", { ascending: false });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const page of STATIC_PAGES) {
      xml += `
  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    if (products) {
      for (const product of products) {
        const lastmod = product.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0];
        xml += `
  <url>
    <loc>${BASE_URL}/product/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
