"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Filter, Leaf, Zap, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sustainabilityScore: number;
  carbonFootprint: string;
  description: string;
  story?: string;
}

export default function ProductsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [storyMode, setStoryMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Mock product data
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Eco-Friendly Wireless Headphones',
        price: 129.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        category: 'Electronics',
        sustainabilityScore: 92,
        carbonFootprint: '2.1kg CO₂',
        description: 'Premium sound quality with recycled materials',
        story: 'Crafted from ocean-recovered plastic, each pair removes 50g of waste from our seas. Made in a solar-powered facility in Denmark.',
      },
      {
        id: '2',
        name: 'Organic Cotton T-Shirt',
        price: 45.00,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        category: 'Clothing',
        sustainabilityScore: 95,
        carbonFootprint: '0.8kg CO₂',
        description: '100% organic cotton, fair trade certified',
        story: 'Grown without pesticides by farmers in India, processed using renewable energy, and dyed with natural plant-based colors.',
      },
      {
        id: '3',
        name: 'Bamboo Water Bottle',
        price: 29.99,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        category: 'Home',
        sustainabilityScore: 98,
        carbonFootprint: '0.3kg CO₂',
        description: 'Sustainable bamboo with stainless steel liner',
        story: 'Bamboo harvested from sustainably managed forests. Each purchase plants 5 trees in deforested areas.',
      },
      {
        id: '4',
        name: 'Solar-Powered Bluetooth Speaker',
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        category: 'Electronics',
        sustainabilityScore: 88,
        carbonFootprint: '3.2kg CO₂',
        description: 'Never needs charging with built-in solar panel',
        story: 'Designed to last 10+ years with replaceable battery. Manufacturing facility powered by wind energy.',
      },
      {
        id: '5',
        name: 'Recycled Yoga Mat',
        price: 68.00,
        image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400',
        category: 'Sports',
        sustainabilityScore: 90,
        carbonFootprint: '1.5kg CO₂',
        description: 'Made from recycled wetsuits and cork',
        story: 'Every mat is made from 5 recycled wetsuits, saving them from landfills. Cork sustainably harvested from Portugal.',
      },
      {
        id: '6',
        name: 'Smart LED Bulb Set',
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400',
        category: 'Home',
        sustainabilityScore: 85,
        carbonFootprint: '1.2kg CO₂',
        description: 'Energy-efficient smart lighting',
        story: 'Uses 90% less energy than traditional bulbs. Lasts 25,000 hours. Packaging is 100% recyclable.',
      },
    ];

    setProducts(mockProducts);
    setIsLoading(false);
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'sustainability':
        return b.sustainabilityScore - a.sustainabilityScore;
      default:
        return 0;
    }
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-green-600" />
              <div>
                <h1 className="text-xl font-bold">Sustainable Products</h1>
                <p className="text-sm text-muted-foreground">Curated with care for the planet</p>
              </div>
            </div>
            <div className="ml-auto">
              <Button
                variant={storyMode ? 'default' : 'outline'}
                onClick={() => setStoryMode(!storyMode)}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Story Mode
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Home">Home</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="sustainability">Sustainability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all">
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                    <Leaf className="h-3 w-3 mr-1" />
                    {product.sustainabilityScore}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                  
                  {storyMode && product.story && (
                    <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-green-800 dark:text-green-200">{product.story}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold">${product.price}</span>
                    <span className="text-xs text-muted-foreground">{product.carbonFootprint}</span>
                  </div>
                  
                  <Button className="w-full">Add to Cart</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
