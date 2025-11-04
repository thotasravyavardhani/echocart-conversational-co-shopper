"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Truck, CheckCircle, MapPin, Clock, MessageSquare, RotateCcw, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  status: 'processing' | 'shipped' | 'in-transit' | 'delivered';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  total: number;
  orderDate: Date;
  estimatedDelivery: Date;
  predictiveNarrative: string;
  trackingUpdates: Array<{
    timestamp: Date;
    status: string;
    location: string;
    narrative: string;
  }>;
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [returnMessage, setReturnMessage] = useState('');
  const [showReturnChat, setShowReturnChat] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Mock orders data
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ECO-2024-001',
        status: 'in-transit',
        items: [
          {
            id: '1',
            name: 'Eco-Friendly Wireless Headphones',
            quantity: 1,
            price: 129.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
          },
        ],
        total: 129.99,
        orderDate: new Date('2024-01-15'),
        estimatedDelivery: new Date('2024-01-22'),
        predictiveNarrative: "Your package is making great time! 🚀 Based on current traffic patterns and the driver's route, we predict it'll arrive tomorrow afternoon between 2-4 PM. The driver has 3 stops before yours.",
        trackingUpdates: [
          {
            timestamp: new Date('2024-01-15T10:00:00'),
            status: 'Order Placed',
            location: 'Online',
            narrative: "Your journey to sustainable shopping begins! We've received your order and our team is preparing it with care.",
          },
          {
            timestamp: new Date('2024-01-16T14:30:00'),
            status: 'Package Prepared',
            location: 'Distribution Center, Seattle',
            narrative: 'Your headphones have been carefully packaged in eco-friendly materials and are ready for their journey to you!',
          },
          {
            timestamp: new Date('2024-01-17T09:15:00'),
            status: 'In Transit',
            location: 'Portland Sorting Facility',
            narrative: "Your package is on the move! It's traveling via our carbon-neutral delivery partner, reducing environmental impact.",
          },
          {
            timestamp: new Date('2024-01-18T11:45:00'),
            status: 'Out for Delivery',
            location: 'Your City',
            narrative: "Almost there! Your package is on the final leg of its journey. Our driver Sarah is heading your way with 3 stops before yours.",
          },
        ],
      },
      {
        id: '2',
        orderNumber: 'ECO-2024-002',
        status: 'delivered',
        items: [
          {
            id: '2',
            name: 'Organic Cotton T-Shirt',
            quantity: 2,
            price: 45.00,
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
          },
        ],
        total: 90.00,
        orderDate: new Date('2024-01-10'),
        estimatedDelivery: new Date('2024-01-15'),
        predictiveNarrative: 'Delivered! We hope you love your new sustainable t-shirts. 🎉',
        trackingUpdates: [
          {
            timestamp: new Date('2024-01-15T15:30:00'),
            status: 'Delivered',
            location: 'Your Doorstep',
            narrative: 'Package delivered successfully! Enjoy your eco-friendly purchase and thanks for supporting sustainable fashion.',
          },
        ],
      },
    ];

    setOrders(mockOrders);
    if (mockOrders.length > 0) {
      setSelectedOrder(mockOrders[0]);
    }
    setIsLoading(false);
  }, []);

  const handleReturnRequest = () => {
    if (returnMessage.trim()) {
      alert(`Return request submitted: ${returnMessage}`);
      setReturnMessage('');
      setShowReturnChat(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
      case 'in-transit':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped':
      case 'in-transit':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'processing': return 25;
      case 'shipped': return 50;
      case 'in-transit': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-600" />
            <div>
              <h1 className="text-xl font-bold">Order Tracking</h1>
              <p className="text-sm text-muted-foreground">Predictive delivery insights</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.map((order) => (
                  <Card
                    key={order.id}
                    className={`cursor-pointer transition-all ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-indigo-600' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.orderDate.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{order.items[0].name}</p>
                      <p className="font-bold">${order.total.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          {selectedOrder && (
            <div className="lg:col-span-2 space-y-6">
              {/* Predictive Narrative */}
              <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-white/20 p-2">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Predictive ETA</h3>
                      <p className="text-white/90">{selectedOrder.predictiveNarrative}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Delivery Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {getProgressValue(selectedOrder.status)}%
                      </span>
                    </div>
                    <Progress value={getProgressValue(selectedOrder.status)} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ordered</span>
                    <span className="text-muted-foreground">
                      Est. {selectedOrder.estimatedDelivery.toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Updates */}
              <Card>
                <CardHeader>
                  <CardTitle>Tracking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.trackingUpdates.map((update, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="rounded-full bg-indigo-600 p-2">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                          {index < selectedOrder.trackingUpdates.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-200 dark:bg-gray-700 my-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold">{update.status}</h4>
                            <span className="text-xs text-muted-foreground">
                              {update.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{update.location}</p>
                          <p className="text-sm">{update.narrative}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          <p className="font-bold mt-1">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Return/Exchange */}
              {selectedOrder.status === 'delivered' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Need to Return or Exchange?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showReturnChat ? (
                      <Button
                        onClick={() => setShowReturnChat(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Start Return Process
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Tell us why you'd like to return this item:
                        </p>
                        <textarea
                          value={returnMessage}
                          onChange={(e) => setReturnMessage(e.target.value)}
                          placeholder="e.g., Wrong size, doesn't match description..."
                          className="w-full min-h-24 p-3 rounded-md border bg-background"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleReturnRequest} className="flex-1">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Submit Return Request
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowReturnChat(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
