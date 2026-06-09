import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateService, useListCategories } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  location: z.string().min(3, "Location is required"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function NewService() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createService = useCreateService();
  const { data: categories, isLoading: categoriesLoading } = useListCategories();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      price: 0,
      location: "",
    },
  });

  const onSubmit = (data: ServiceFormValues) => {
    createService.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Service submitted!",
          description: "Your service has been submitted and is pending admin approval.",
        });
        setLocation("/provider/dashboard");
      },
      onError: (err) => {
        toast({
          title: "Submission failed",
          description: err.data?.error || "An error occurred",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground">
          <Link href="/provider/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">Create a Service Listing</CardTitle>
            <CardDescription>
              Detail your service offerings to attract new customers. Listings require admin approval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Professional Plumbing Repair" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, descriptive title helps customers find your service.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map(c => (
                                <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
                              ))}
                              {/* Fallback categories if API is empty */}
                              {(!categories || categories.length === 0) && (
                                <>
                                  <SelectItem value="Electrician">Electrician</SelectItem>
                                  <SelectItem value="Plumber">Plumber</SelectItem>
                                  <SelectItem value="Home Cleaning">Home Cleaning</SelectItem>
                                  <SelectItem value="Carpenter">Carpenter</SelectItem>
                                  <SelectItem value="Painter">Painter</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location / Service Area</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Downtown Seattle or All Boroughs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your experience, what the service includes, and any special guarantees..." 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 flex justify-end gap-4 border-t">
                    <Button variant="outline" asChild>
                      <Link href="/provider/dashboard">Cancel</Link>
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createService.isPending}
                    >
                      {createService.isPending ? "Submitting..." : "Submit for Approval"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
