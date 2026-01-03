import { Facebook, Twitter, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Share:</span>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]"
        onClick={() => handleShare("facebook")}
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
        onClick={() => handleShare("twitter")}
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
        onClick={() => handleShare("whatsapp")}
        title="Share on WhatsApp"
      >
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
