import React from "react";
import { Layout } from "@/components/layout/Layout";
import { useGetAdminStats, useListAllUsers, useListAllServices, useApproveService, getGetAdminStatsQueryKey, getListAllServicesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Briefcase, Calendar, FileCheck, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: users, isLoading: usersLoading } = useListAllUsers();
  const { data: services, isLoading: servicesLoading } = useListAllServices();
  const approveService = useApproveService();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleApproval = (id: number, status: "active" | "rejected") => {
    approveService.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Service ${status === "active" ? "approved" : "rejected"}` });
          queryClient.invalidateQueries({ queryKey: getListAllServicesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const pendingServices = services?.filter(s => s.status === "pending") || [];
  const activeServices = services?.filter(s => s.status === "active") || [];

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Platform overview and management.</p>
        
        {statsLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProviders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalServices}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.pendingServices} pending approval</p>
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
          </div>
        ) : null}

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="approvals">
              Pending Approvals 
              {pendingServices.length > 0 && (
                <Badge variant="destructive" className="ml-2 py-0 px-1.5">{pendingServices.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="services">All Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Services Pending Approval</CardTitle>
                <CardDescription>Review and approve new service listings before they go live.</CardDescription>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : pendingServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No services pending approval.</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {pendingServices.map(service => (
                      <Card key={service.id} className="bg-muted/10 border-primary/20">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{service.title}</CardTitle>
                          <CardDescription>
                            Provider: <span className="font-medium text-foreground">{service.providerName}</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div><span className="text-muted-foreground">Category:</span> {service.category}</div>
                            <div><span className="text-muted-foreground">Price:</span> ${service.price}</div>
                            <div className="col-span-2"><span className="text-muted-foreground">Location:</span> {service.location}</div>
                          </div>
                          <p className="text-sm text-muted-foreground bg-background p-2 rounded border line-clamp-3">
                            {service.description}
                          </p>
                        </CardContent>
                        <div className="p-4 pt-0 flex gap-2">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                            onClick={() => handleApproval(service.id, "active")}
                            disabled={approveService.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 text-destructive hover:bg-destructive/10" 
                            onClick={() => handleApproval(service.id, "rejected")}
                            disabled={approveService.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : !users ? null : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'provider' ? 'default' : 'secondary'}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(u.createdAt), "MMM d, yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Services</CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : !activeServices ? null : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Rating</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeServices.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">{s.title}</TableCell>
                            <TableCell>{s.providerName}</TableCell>
                            <TableCell>{s.category}</TableCell>
                            <TableCell>${s.price}</TableCell>
                            <TableCell>{s.rating > 0 ? `${s.rating.toFixed(1)} (${s.reviewCount})` : 'None'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
