import React, { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetService, 
  useGetServiceReviews, 
  useCreateBooking, 
  getGetServiceQueryKey, 
  getGetServiceReviewsQueryKey 
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Star, MapPin, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

const bookingSchema = z.object({
  notes: z.string().max(500, "Notes are too long").optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:id");
  const serviceId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data: service, isLoading: serviceLoading } = useGetService(serviceId, { 
    query: { enabled: !!serviceId, queryKey: getGetServiceQueryKey(serviceId) } 
  });
  
  const { data: reviews, isLoading: reviewsLoading } = useGetServiceReviews(serviceId, { 
    query: { enabled: !!serviceId, queryKey: getGetServiceReviewsQueryKey(serviceId) } 
  });

  const createBooking = useCreateBooking();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      notes: "",
    },
  });

  const onBookSubmit = (data: BookingFormValues) => {
    createBooking.mutate(
      { data: { serviceId, notes: data.notes || null } },
      {
        onSuccess: () => {
          toast({ title: "Booking Request Sent!", description: "The provider will review your request shortly." });
          setBookingOpen(false);
          setLocation("/user/dashboard");
        },
        onError: (err) => {
          toast({ title: "Booking Failed", description: err.data?.error || "An error occurred", variant: "destructive" });
        }
      }
    );
  };

  if (serviceLoading) {
    return (
      <Layout>
        <div className="flex-1 flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-8">The service you're looking for doesn't exist or has been removed.</p>
          <Button asChild><Link href="/services">Back to Services</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="bg-primary/5 py-8 border-b">
        <div className="container max-w-5xl mx-auto px-4">
          <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
            <Link href="/services">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge>{service.category}</Badge>
                {service.status === "active" ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>
                ) : (
                  <Badge variant="secondary">Currently Unavailable</Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{service.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">{service.providerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {service.providerName}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {service.location}
                </div>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  <span className="font-medium text-foreground">{service.rating > 0 ? service.rating.toFixed(1) : "New"}</span>
                  <span className="text-muted-foreground ml-1">({service.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-muted-foreground mb-1">Starting from</p>
              <p className="text-3xl font-bold text-primary">${service.price}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">About this service</h2>
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <p className="whitespace-pre-line text-foreground/90">{service.description}</p>
              </div>
            </section>

            <hr />

            <section>
              <h2 className="text-2xl font-bold mb-6">Reviews ({service.reviewCount})</h2>
              
              {reviewsLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="bg-muted/20 p-8 rounded-lg text-center border border-dashed">
                  <p className="text-muted-foreground">No reviews yet. Be the first to book and review this service!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.userName}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt), "MMMM d, yyyy")}</p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm mt-3 ml-13 text-foreground/90">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div>
            <div className="sticky top-24">
              <Card className="shadow-lg border-primary/10">
                <CardHeader>
                  <CardTitle>Book this service</CardTitle>
                  <CardDescription>Request an appointment with {service.providerName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Background checked professional</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Secure payment via platform</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <span>Satisfaction guarantee</span>
                  </div>
                </CardContent>
                <CardFooter>
                  {!isAuthenticated ? (
                    <Button className="w-full" size="lg" asChild>
                      <Link href={`/login?redirect=/services/${service.id}`}>Log in to book</Link>
                    </Button>
                  ) : user?.role === 'provider' ? (
                    <div className="w-full text-center p-3 bg-muted/30 rounded-md text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Providers cannot book services
                    </div>
                  ) : service.status !== 'active' ? (
                    <Button className="w-full" size="lg" disabled>Service Unavailable</Button>
                  ) : (
                    <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="lg">Book Now</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Booking</DialogTitle>
                          <DialogDescription>
                            Send a request to {service.providerName} for {service.title}.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onBookSubmit)} className="space-y-4 pt-4">
                            <div className="bg-muted/30 p-4 rounded-md mb-4 flex justify-between items-center">
                              <div>
                                <p className="font-medium text-sm">Estimated Base Price</p>
                                <p className="text-xs text-muted-foreground">Final price may vary</p>
                              </div>
                              <p className="text-xl font-bold">${service.price}</p>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Booking Notes (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe your specific needs, preferred times, or ask questions..." 
                                      className="resize-none"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter className="pt-4">
                              <Button type="button" variant="outline" onClick={() => setBookingOpen(false)}>Cancel</Button>
                              <Button type="submit" disabled={createBooking.isPending}>
                                {createBooking.isPending ? "Sending Request..." : "Send Request"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
