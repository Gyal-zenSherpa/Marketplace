import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Star, ThumbsUp, Camera, Video, CheckCircle, Upload, X } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  badges: string[];
  created_at: string;
  user_name?: string;
  media: { id: string; media_url: string; media_type: string }[];
  has_voted?: boolean;
}

interface ProductReviewsProps {
  productId: string;
}

const REVIEW_BADGES = [
  { id: "fast_delivery", label: "Fast Delivery", emoji: "🚀" },
  { id: "good_quality", label: "Good Quality", emoji: "⭐" },
  { id: "value_for_money", label: "Value for Money", emoji: "💰" },
  { id: "as_described", label: "As Described", emoji: "✅" },
];

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkCanReview();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    const { data: reviewsData, error } = await supabase
      .from("product_reviews")
      .select(`
        *,
        review_media (id, media_url, media_type)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return;
    }

    // Get user votes if logged in
    let userVotes: string[] = [];
    if (user) {
      const { data: votes } = await supabase
        .from("review_votes")
        .select("review_id")
        .eq("user_id", user.id);
      userVotes = votes?.map((v) => v.review_id) || [];
    }

    // Get profiles for user names
    const userIds = reviewsData?.map((r) => r.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]));

    const formattedReviews: Review[] = (reviewsData || []).map((r) => ({
      ...r,
      badges: r.badges || [],
      media: r.review_media || [],
      user_name: profileMap.get(r.user_id) || "Anonymous",
      has_voted: userVotes.includes(r.id),
    }));

    setReviews(formattedReviews);
    setLoading(false);
  };

  const checkCanReview = async () => {
    if (!user) return;

    // Check if user has purchased this product and delivered
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        order_items!inner (product_id)
      `)
      .eq("user_id", user.id)
      .eq("status", "delivered");

    const hasPurchased = orders?.some((order) =>
      order.order_items.some((item: { product_id: string }) => item.product_id === productId)
    );

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    setCanReview(!!hasPurchased && !existingReview);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (f) =>
        (f.type.startsWith("image/") || f.type.startsWith("video/")) &&
        f.size <= 10 * 1024 * 1024
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files skipped",
        description: "Only images and videos under 10MB are allowed.",
        variant: "destructive",
      });
    }

    setMediaFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    const previews = validFiles.map((f) => URL.createObjectURL(f));
    setMediaPreviews((prev) => [...prev, ...previews].slice(0, 5));
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReview = async () => {
    if (!user || rating < 1) return;

    setSubmitting(true);

    try {
      // Create review
      const { data: review, error: reviewError } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          title: title || null,
          content: content || null,
          is_verified_purchase: true,
          badges: selectedBadges,
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Upload media
      for (const file of mediaFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${review.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("review-media")
          .upload(fileName, file);

        if (uploadError) continue;

        const { data: { publicUrl } } = supabase.storage
          .from("review-media")
          .getPublicUrl(fileName);

        await supabase.from("review_media").insert({
          review_id: review.id,
          media_url: publicUrl,
          media_type: file.type.startsWith("video/") ? "video" : "image",
        });
      }

      // Points are awarded server-side only (RLS blocks client inserts)

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });

      setShowForm(false);
      setRating(5);
      setTitle("");
      setContent("");
      setSelectedBadges([]);
      setMediaFiles([]);
      setMediaPreviews([]);
      setCanReview(false);
      fetchReviews();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const voteHelpful = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to vote.",
      });
      return;
    }

    const review = reviews.find((r) => r.id === reviewId);
    if (review?.has_voted) {
      // Remove vote
      await supabase
        .from("review_votes")
        .delete()
        .eq("review_id", reviewId)
        .eq("user_id", user.id);

      await supabase
        .from("product_reviews")
        .update({ helpful_count: review.helpful_count - 1 })
        .eq("id", reviewId);
    } else {
      // Add vote
      await supabase.from("review_votes").insert({
        review_id: reviewId,
        user_id: user.id,
      });

      await supabase
        .from("product_reviews")
        .update({ helpful_count: (review?.helpful_count || 0) + 1 })
        .eq("id", reviewId);
    }

    fetchReviews();
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            {canReview && (
              <Button onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "Write a Review"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {reviews.length} reviews
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Review Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                maxLength={1000}
              />
            </div>

            {/* Badges */}
            <div>
              <label className="block text-sm font-medium mb-2">Add Badges</label>
              <div className="flex flex-wrap gap-2">
                {REVIEW_BADGES.map((badge) => (
                  <Badge
                    key={badge.id}
                    variant={selectedBadges.includes(badge.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedBadges((prev) =>
                        prev.includes(badge.id)
                          ? prev.filter((b) => b !== badge.id)
                          : [...prev, badge.id]
                      )
                    }
                  >
                    {badge.emoji} {badge.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Add Photos/Videos (Optional)
              </label>
              <div className="flex gap-2 flex-wrap">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative w-20 h-20">
                    <img
                      src={preview}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {mediaPreviews.length < 5 && (
                  <label className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleMediaUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <Button onClick={submitReview} disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No reviews yet. Be the first to review this product!
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    {review.title && (
                      <h4 className="font-semibold mt-2">{review.title}</h4>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      By {review.user_name} on{" "}
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {review.content && (
                  <p className="mt-3 text-foreground">{review.content}</p>
                )}

                {/* Badges */}
                {review.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {review.badges.map((badgeId) => {
                      const badge = REVIEW_BADGES.find((b) => b.id === badgeId);
                      return badge ? (
                        <Badge key={badgeId} variant="outline" className="text-xs">
                          {badge.emoji} {badge.label}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Media */}
                {review.media.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {review.media.map((m) => (
                      <div key={m.id} className="w-20 h-20 rounded-lg overflow-hidden">
                        {m.media_type === "video" ? (
                          <video
                            src={m.media_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={m.media_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Helpful */}
                <div className="mt-4 pt-3 border-t flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => voteHelpful(review.id)}
                    className={review.has_voted ? "text-primary" : ""}
                  >
                    <ThumbsUp
                      className={`h-4 w-4 mr-1 ${review.has_voted ? "fill-current" : ""}`}
                    />
                    Helpful ({review.helpful_count})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
