import React from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useGetFeaturedServices, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Star, MapPin, Search, ShieldCheck, Clock, ThumbsUp, ArrowRight } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: featuredServices, isLoading: featuredLoading } = useGetFeaturedServices();
  const { data: categories, isLoading: categoriesLoading } = useListCategories();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q");
    if (query) {
      setLocation(`/services?search=${encodeURIComponent(query as string)}`);
    } else {
      setLocation("/services");
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-primary/5 py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
        <div className="container max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-primary/30 py-1.5 px-3">
              Trusted by 10,000+ neighbors
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              Find Trusted Local <span className="text-primary">Services</span> Near You
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              The easiest way to hire verified professionals for your home, life, and business.
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  name="q"
                  type="text"
                  placeholder="What do you need help with?"
                  className="w-full h-12 pl-10 pr-4 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">Search</Button>
            </form>
            
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground pt-2">
              <span>Popular:</span>
              <Link href="/services?category=Plumber" className="hover:text-primary transition-colors underline underline-offset-4">Plumbers</Link>
              <Link href="/services?category=Electrician" className="hover:text-primary transition-colors underline underline-offset-4">Electricians</Link>
              <Link href="/services?category=Home Cleaning" className="hover:text-primary transition-colors underline underline-offset-4">Cleaners</Link>
            </div>
          </div>
          
          <div className="flex-1 hidden md:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-8">
                <div className="bg-card rounded-lg p-4 shadow-sm border h-40 flex flex-col justify-end">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium">Verified Pros</h3>
                </div>
                <div className="bg-primary text-primary-foreground rounded-lg p-6 shadow-md h-48 flex flex-col justify-between">
                  <Star className="h-8 w-8 fill-primary-foreground" />
                  <div>
                    <div className="text-3xl font-bold">4.9/5</div>
                    <div className="text-primary-foreground/80 text-sm">Average Rating</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-secondary rounded-lg p-6 shadow-sm border h-48 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1">Instant Booking</h3>
                    <p className="text-sm text-secondary-foreground/70">No more waiting for quotes</p>
                  </div>
                  <Clock className="h-8 w-8 text-secondary-foreground/50" />
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm border h-40 flex flex-col justify-end">
                  <div className="h-10 w-10 bg-chart-2/10 rounded-full flex items-center justify-center mb-2">
                    <ThumbsUp className="h-5 w-5 text-chart-2" />
                  </div>
                  <h3 className="font-medium">Satisfaction Guaranteed</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Explore Categories</h2>
              <p className="text-muted-foreground">Find exactly what you need.</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/services">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories?.slice(0, 10).map((cat) => (
                <Link key={cat.category} href={`/services?category=${encodeURIComponent(cat.category)}`}>
                  <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full group">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="font-semibold text-lg">{cat.category.substring(0, 1)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{cat.category}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{cat.count} services</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-muted/30 border-y">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Get your tasks done in three simple steps.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-border -z-10"></div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm relative z-10 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 ring-4 ring-background">1</div>
              <h3 className="text-lg font-bold mb-2">Search & Compare</h3>
              <p className="text-muted-foreground text-sm">Browse verified professionals, read reviews, and compare prices.</p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm relative z-10 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 ring-4 ring-background">2</div>
              <h3 className="text-lg font-bold mb-2">Book Instantly</h3>
              <p className="text-muted-foreground text-sm">Select your service, add notes, and book your professional in seconds.</p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm relative z-10 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 ring-4 ring-background">3</div>
              <h3 className="text-lg font-bold mb-2">Get It Done</h3>
              <p className="text-muted-foreground text-sm">The professional arrives and completes the job to your satisfaction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-background">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Featured Services</h2>
              <p className="text-muted-foreground">Top-rated professionals in your area.</p>
            </div>
          </div>
          
          {featuredLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredServices?.slice(0, 4).map((service) => (
                <Card key={service.id} className="group hover:shadow-md transition-all overflow-hidden flex flex-col h-full border-border/60">
                  <div className="h-32 bg-muted flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-secondary/30"></div>
                    <span className="text-3xl opacity-20 font-bold tracking-tighter uppercase">{service.category.substring(0, 3)}</span>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">{service.title}</CardTitle>
                    <CardDescription className="flex justify-between items-center mt-1">
                      <span className="truncate max-w-[120px]">{service.providerName}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-1">
                    <div className="flex items-center gap-1 text-sm mb-3 text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">{service.rating > 0 ? service.rating.toFixed(1) : "New"}</span>
                      <span>({service.reviewCount})</span>
                    </div>
                    <p className="font-bold text-lg">${service.price}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/services/${service.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-foreground text-background">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Are you a professional?</h2>
          <p className="text-lg text-muted/80 mb-8">
            Join thousands of professionals using LocalFinder to grow their business and reach new customers every day.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
              <Link href="/register?role=provider">Become a Provider</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-muted/20 hover:bg-muted/10" asChild>
              <Link href="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
