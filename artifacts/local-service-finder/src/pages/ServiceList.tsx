import React, { useState } from "react";
import { Link, useSearch } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useListServices, useListCategories } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Star, MapPin, Search, Filter } from "lucide-react";

export default function ServiceList() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocationInput] = useState("");
  const [priceRange, setPriceRange] = useState([1000]); // Max price

  const { data: categories } = useListCategories();
  
  const { data: services, isLoading } = useListServices({
    search: search || undefined,
    category: category || undefined,
    location: location || undefined,
    maxPrice: priceRange[0] < 1000 ? priceRange[0] : undefined,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The query hook will automatically re-fetch since state changed
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setLocationInput("");
    setPriceRange([1000]);
  };

  return (
    <Layout>
      <div className="bg-primary/5 py-12 border-b">
        <div className="container max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Local Professionals</h1>
          <p className="text-muted-foreground max-w-2xl mb-8">Browse trusted experts for all your home, tech, and personal needs. Book instantly and securely.</p>
          
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 text-base bg-background" 
                placeholder="What service do you need?" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative md:w-64">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 text-base bg-background" 
                placeholder="ZIP code or neighborhood" 
                value={location}
                onChange={(e) => setLocationInput(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">Search</Button>
          </form>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" /> Filters
            </h2>
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 text-xs text-muted-foreground">Clear all</Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Category</h3>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(c => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.category} ({c.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm">Max Price</h3>
              <span className="text-sm font-medium text-primary">
                {priceRange[0] >= 1000 ? "Any" : `$${priceRange[0]}`}
              </span>
            </div>
            <Slider
              value={priceRange}
              min={10}
              max={1000}
              step={10}
              onValueChange={setPriceRange}
            />
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {isLoading ? "Searching..." : `${services?.length || 0} services found`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : !services || services.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No services found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters to see more results.</p>
              <Button variant="outline" onClick={handleClearFilters}>Clear all filters</Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
                <Card key={service.id} className="group hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
                  <div className="h-40 bg-muted flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder image representation based on category */}
                    <div className="absolute inset-0 bg-primary/10"></div>
                    <span className="text-4xl opacity-20 font-bold tracking-tighter uppercase">{service.category.substring(0, 3)}</span>
                    <Badge className="absolute top-3 left-3 bg-white/90 text-black hover:bg-white/90 backdrop-blur-sm border-none shadow-sm">{service.category}</Badge>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{service.title}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                      <MapPin className="h-3 w-3" /> {service.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 flex-1">
                    <p className="text-2xl font-bold text-primary mb-3">${service.price}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t mt-auto flex justify-between items-center bg-muted/10">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{service.rating > 0 ? service.rating.toFixed(1) : "New"}</span>
                      <span className="text-muted-foreground">({service.reviewCount})</span>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/services/${service.id}`}>View</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
