import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { blogPosts } from "@/data/blogPosts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, User, ArrowRight } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const relatedPosts = blogPosts.filter((p) => p.id !== post.id).slice(0, 3);

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith("## ")) {
        return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith("- **")) {
        const match = trimmed.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
        if (match) {
          return (
            <li key={i} className="text-muted-foreground ml-4 mb-1 list-disc">
              <strong className="text-foreground">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}
            </li>
          );
        }
      }
      if (trimmed.startsWith("- ")) {
        return <li key={i} className="text-muted-foreground ml-4 mb-1 list-disc">{trimmed.slice(2)}</li>;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return <li key={i} className="text-muted-foreground ml-4 mb-1 list-decimal">{trimmed.replace(/^\d+\.\s/, "")}</li>;
      }
      return <p key={i} className="text-muted-foreground leading-relaxed mb-3">{trimmed}</p>;
    });
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | Marketplace Nepal Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`https://marketplace-gzn.lovable.app/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
        <meta property="og:type" content="article" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <article>
            <div className="mb-6">
              <Badge variant="secondary" className="mb-3">{post.category}</Badge>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author}</span>
                <span>{post.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.readTime}</span>
              </div>
            </div>

            <div className="aspect-video rounded-lg overflow-hidden mb-8">
              <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
            </div>

            <div className="prose-sm md:prose max-w-none">
              {renderContent(post.content)}
            </div>
          </article>

          {/* Related posts */}
          <section className="mt-12 pt-8 border-t border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Related Articles</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                  <Card className="overflow-hidden h-full border-border hover:shadow-md transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img src={rp.image} alt={rp.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">{rp.title}</h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Read more <ArrowRight className="h-3 w-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default BlogPost;
