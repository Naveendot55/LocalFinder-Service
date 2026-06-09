import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetUserBookings, useUpdateBookingStatus, useCreateReview, getGetUserBookingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { StarIcon } from "lucide-react";
import { Link } from "wouter";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

function ReviewDialog({ serviceId, bookingId, onReviewed }: { serviceId: number, bookingId: number, onReviewed: () => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const createReview = useCreateReview();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const onSubmit = (data: ReviewFormValues) => {
    createReview.mutate(
      { data: { serviceId, rating: data.rating, comment: data.comment } },
      {
        onSuccess: () => {
          toast({ title: "Review submitted successfully!" });
          setOpen(false);
          onReviewed();
        },
        onError: (err) => {
          toast({ title: "Failed to submit review", description: err.data?.error || "An error occurred", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Leave Review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate and Review</DialogTitle>
          <DialogDescription>Share your experience with this service provider.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-6 w-6 cursor-pointer ${star <= field.value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        onClick={() => field.onChange(star)}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell others about your experience..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createReview.isPending}>
                {createReview.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useGetUserBookings();
  const updateStatus = useUpdateBookingStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMarkCompleted = (id: number) => {
    updateStatus.mutate(
      { id, data: { status: "completed" } },
      {
        onSuccess: () => {
          toast({ title: "Booking marked as completed" });
          queryClient.invalidateQueries({ queryKey: getGetUserBookingsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "accepted": return <Badge variant="default" className="bg-blue-500">Accepted</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "completed": return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground mb-8">Manage your requested services and bookings.</p>
        
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !bookings || bookings.length === 0 ? (
          <Card className="text-center py-12 bg-muted/20">
            <CardContent>
              <div className="text-muted-foreground mb-4">You have no bookings yet.</div>
              <Button asChild>
                <Link href="/services">Browse Services</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <Card key={booking.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        <Link href={`/services/${booking.serviceId}`} className="hover:underline">
                          {booking.serviceName || "Service"}
                        </Link>
                      </CardTitle>
                      <CardDescription>{booking.providerName || "Provider"}</CardDescription>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{booking.serviceCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">${booking.servicePrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date requested:</span>
                      <span>{format(new Date(booking.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    {booking.notes && (
                      <div className="pt-2">
                        <span className="text-muted-foreground block mb-1">Your notes:</span>
                        <p className="p-2 bg-muted/30 rounded text-xs">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex gap-2 justify-end">
                  {booking.status === "accepted" && (
                    <Button size="sm" onClick={() => handleMarkCompleted(booking.id)} disabled={updateStatus.isPending}>
                      Mark Completed
                    </Button>
                  )}
                  {booking.status === "completed" && (
                    <ReviewDialog 
                      serviceId={booking.serviceId} 
                      bookingId={booking.id} 
                      onReviewed={() => {}} 
                    />
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
