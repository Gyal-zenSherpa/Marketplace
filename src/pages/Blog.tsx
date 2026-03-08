import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { blogPosts } from "@/data/blogPosts";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, BookOpen } from "lucide-react";

const Blog = () => {
  return (
    <>
      <Helmet>
        <title>Blog | Marketplace Nepal — Shopping Tips, Guides & Trends</title>
        <meta name="description" content="Read our latest blog posts about shopping tips, buying guides, product trends, and e-commerce insights for Nepali consumers." />
        <link rel="canonical" href="https://marketplace-gzn.lovable.app/blog" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Marketplace Blog</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Shopping tips, buying guides, product trends, and insights for smart Nepali consumers.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-14">
          {/* Featured post */}
          <Link to={`/blog/${blogPosts[0].slug}`} className="block group mb-10">
            <Card className="overflow-hidden border-border hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto">
                  <img src={blogPosts[0].image} alt={blogPosts[0].title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <CardContent className="flex flex-col justify-center p-6 md:p-8">
                  <Badge variant="secondary" className="w-fit mb-3">{blogPosts[0].category}</Badge>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">
                    {blogPosts[0].title}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{blogPosts[0].excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{blogPosts[0].date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{blogPosts[0].readTime}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>

          {/* Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.slice(1).map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                <Card className="overflow-hidden h-full border-border hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img src={post.image} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  </div>
                  <CardContent className="p-4 md:p-5">
                    <Badge variant="secondary" className="mb-2 text-xs">{post.category}</Badge>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                      <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
                        Read more <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Blog;
