import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetProviderStats, useGetProviderBookings, useUpdateBookingStatus, useGetMyServices, getGetProviderBookingsQueryKey, getGetProviderStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import { CheckCircle2, XCircle, Briefcase, Calendar, Star, Plus } from "lucide-react";

export default function ProviderDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProviderStats();
  const { data: bookings, isLoading: bookingsLoading } = useGetProviderBookings();
  const { data: services, isLoading: servicesLoading } = useGetMyServices();
  const updateStatus = useUpdateBookingStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusUpdate = (id: number, status: "accepted" | "rejected") => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Booking ${status}` });
          queryClient.invalidateQueries({ queryKey: getGetProviderBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetProviderStatsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending Review</Badge>;
      case "accepted": return <Badge variant="default" className="bg-blue-500">Accepted</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      case "completed": return <Badge variant="outline" className="text-green-600 border-green-600">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
            <p className="text-muted-foreground">Manage your services and bookings.</p>
          </div>
          <Button asChild>
            <Link href="/provider/services/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Service
            </Link>
          </Button>
        </div>
        
        {statsLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalServices}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <div className="h-4 w-4 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-[10px]">{stats.pendingBookings}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingBookings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating ? stats.averageRating.toFixed(1) : "N/A"}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="space-y-4">
            {bookingsLoading ? (
              <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
            ) : !bookings || bookings.length === 0 ? (
              <Card className="text-center py-12 bg-muted/20">
                <CardContent>
                  <div className="text-muted-foreground">You have no booking requests yet.</div>
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
                            {booking.serviceName || "Service"}
                          </CardTitle>
                          <CardDescription>Requested by: {booking.userName || "Customer"}</CardDescription>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{format(new Date(booking.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        {booking.notes && (
                          <div className="pt-2">
                            <span className="text-muted-foreground block mb-1">Customer notes:</span>
                            <p className="p-2 bg-muted/30 rounded text-xs">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {booking.status === "pending" && (
                      <CardFooter className="border-t pt-4 flex gap-2">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(booking.id, "accepted")} disabled={updateStatus.isPending}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                        </Button>
                        <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => handleStatusUpdate(booking.id, "rejected")} disabled={updateStatus.isPending}>
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4">
            {servicesLoading ? (
              <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>
            ) : !services || services.length === 0 ? (
              <Card className="text-center py-12 bg-muted/20">
                <CardContent>
                  <div className="text-muted-foreground mb-4">You haven't listed any services yet.</div>
                  <Button asChild>
                    <Link href="/provider/services/new">Add Your First Service</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl line-clamp-1">{service.title}</CardTitle>
                          <CardDescription>{service.category} • {service.location}</CardDescription>
                        </div>
                        {service.status === "active" ? (
                          <Badge variant="default" className="bg-green-500">Active</Badge>
                        ) : service.status === "pending" ? (
                          <Badge variant="secondary">Pending Approval</Badge>
                        ) : (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary mb-2">${service.price}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{service.rating > 0 ? service.rating.toFixed(1) : "No ratings"} ({service.reviewCount} reviews)</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/services/${service.id}`}>View Listing</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
