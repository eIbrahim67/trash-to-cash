import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Review, ReviewsAnalysis } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Star, User, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analysis, setAnalysis] = useState<ReviewsAnalysis | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    userName: "",
    email: "",
    rating: 5,
    comment: ""
  });

  const load = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "reviews"));
      const fetchedReviews: Review[] = querySnapshot.docs.map(doc => {
        const d = doc.data();
        const timestamp = d.createdAt as Timestamp | null;
        const dateObj = timestamp && typeof timestamp.toDate === 'function' ? timestamp.toDate() : null;
        return {
          id: doc.id,
          userName: d.userName || "Anonymous",
          email: d.email || "",
          rating: d.rating || 0,
          comment: d.comment || "",
          date: dateObj ? dateObj.toLocaleDateString() : "",
        };
      });

      setReviews(fetchedReviews);

      // Build monthly analysis from reviews
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyMap: Record<string, { positive: number; negative: number }> = {};
      fetchedReviews.forEach(r => {
        if (!r.date) return;
        const d = new Date(r.date);
        const key = months[d.getMonth()];
        if (!monthlyMap[key]) monthlyMap[key] = { positive: 0, negative: 0 };
        if (r.rating >= 4) monthlyMap[key].positive++;
        else monthlyMap[key].negative++;
      });

      setAnalysis({
        monthly: months
          .filter(m => monthlyMap[m])
          .map(m => ({ month: m, ...monthlyMap[m] }))
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => { load(); }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        ...form,
        createdAt: Timestamp.now(),
      });
      toast.success("Review submitted successfully!");
      setIsDialogOpen(false);
      setForm({ userName: "", email: "", rating: 5, comment: "" });
      load();
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Reviews Analysis</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  placeholder="Your Name"
                  required
                  value={form.userName}
                  onChange={(e) => setForm({ ...form, userName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  type="email"
                  placeholder="Your Email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Rating (1-5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setForm({ ...form, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={24}
                        className={star <= form.rating ? "fill-warning text-warning" : "text-muted border-muted"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Textarea
                  placeholder="Write your review here..."
                  required
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chart */}
      {analysis && (
        <div className="rounded-2xl border bg-card p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="positive" fill="hsl(210, 60%, 80%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="negative" fill="hsl(330, 60%, 85%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Review cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full border p-2 text-primary">
                <User size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{review.userName}</span>
                  <div className="flex">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-warning text-warning" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{review.email}</p>
                <p className="mt-1 text-sm text-card-foreground">{review.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">{review.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
