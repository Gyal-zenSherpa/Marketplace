import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  bg_color: string | null;
  position: string;
}

interface AdBannerProps {
  position: "homepage" | "below-hero";
}

export function AdBanner({ position }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (data) setAds(data as Ad[]);
    };

    fetchAds();
  }, [position]);

  const visibleAds = ads.filter((ad) => !dismissed.has(ad.id));

  if (visibleAds.length === 0) return null;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3">
      {visibleAds.map((ad) => {
        const bgClass = ad.bg_color || "from-primary to-accent";
        const content = (
          <div
            className={`relative w-full rounded-xl bg-gradient-to-r ${bgClass} p-4 sm:p-5 md:p-6 text-primary-foreground overflow-hidden shadow-md`}
          >
            {/* Background decoration */}
            <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
              <div className="absolute right-4 top-4 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-white blur-2xl" />
              <div className="absolute right-16 bottom-4 h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-white blur-xl" />
            </div>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDismissed((prev) => new Set(prev).add(ad.id));
              }}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
              aria-label="Dismiss ad"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pr-6 sm:pr-0">
              <div className="flex-1 min-w-0">
                {ad.image_url && (
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover mb-2 sm:mb-3"
                  />
                )}
                <h3 className="text-base sm:text-lg md:text-xl font-bold leading-tight truncate">
                  {ad.title}
                </h3>
                {ad.description && (
                  <p className="mt-1 text-xs sm:text-sm opacity-90 line-clamp-2">
                    {ad.description}
                  </p>
                )}
              </div>

              {ad.link_url && (
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors backdrop-blur-sm whitespace-nowrap">
                    {ad.link_text || "Shop Now"}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              )}
            </div>
          </div>
        );

        return (
          <div key={ad.id}>
            {ad.link_url ? (
              <Link to={ad.link_url}>{content}</Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}
