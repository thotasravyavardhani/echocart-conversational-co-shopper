"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Plus, ShoppingCart, ThumbsUp, MessageSquare, Share2, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  votes: number;
  votedBy: string[];
  addedBy: string;
}

interface ShoppingGroup {
  id: string;
  name: string;
  members: GroupMember[];
  products: Product[];
  sharedCart: Product[];
  createdAt: Date;
}

export default function GroupShoppingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<ShoppingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ShoppingGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Mock group data
    const mockGroups: ShoppingGroup[] = [
      {
        id: '1',
        name: 'Family Shopping 🏠',
        members: [
          { id: '1', name: user?.name || 'You', avatar: 'Y', isOnline: true },
          { id: '2', name: 'Sarah Johnson', avatar: 'S', isOnline: true },
          { id: '3', name: 'Mike Chen', avatar: 'M', isOnline: false },
        ],
        products: [
          {
            id: '1',
            name: 'Eco-Friendly Wireless Headphones',
            price: 129.99,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
            votes: 2,
            votedBy: ['1', '2'],
            addedBy: 'Sarah Johnson',
          },
          {
            id: '2',
            name: 'Organic Cotton T-Shirt',
            price: 45.00,
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
            votes: 1,
            votedBy: ['1'],
            addedBy: 'You',
          },
          {
            id: '3',
            name: 'Bamboo Water Bottle',
            price: 29.99,
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200',
            votes: 3,
            votedBy: ['1', '2', '3'],
            addedBy: 'Mike Chen',
          },
        ],
        sharedCart: [
          {
            id: '3',
            name: 'Bamboo Water Bottle',
            price: 29.99,
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200',
            votes: 3,
            votedBy: ['1', '2', '3'],
            addedBy: 'Mike Chen',
          },
        ],
        createdAt: new Date('2024-01-10'),
      },
      {
        id: '2',
        name: 'Office Supplies 💼',
        members: [
          { id: '1', name: user?.name || 'You', avatar: 'Y', isOnline: true },
          { id: '4', name: 'Emily Davis', avatar: 'E', isOnline: true },
        ],
        products: [
          {
            id: '4',
            name: 'Recycled Notebooks',
            price: 19.99,
            image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200',
            votes: 2,
            votedBy: ['1', '4'],
            addedBy: 'Emily Davis',
          },
        ],
        sharedCart: [],
        createdAt: new Date('2024-01-15'),
      },
    ];

    setGroups(mockGroups);
    if (mockGroups.length > 0) {
      setSelectedGroup(mockGroups[0]);
    }
    setIsLoading(false);
  }, [user]);

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: ShoppingGroup = {
        id: Date.now().toString(),
        name: newGroupName,
        members: [
          { id: '1', name: user?.name || 'You', avatar: user?.name?.[0] || 'Y', isOnline: true },
        ],
        products: [],
        sharedCart: [],
        createdAt: new Date(),
      };
      setGroups([...groups, newGroup]);
      setSelectedGroup(newGroup);
      setNewGroupName('');
      setIsCreatingGroup(false);
    }
  };

  const handleVote = (productId: string) => {
    if (!selectedGroup) return;

    const updatedProducts = selectedGroup.products.map((product) => {
      if (product.id === productId) {
        const hasVoted = product.votedBy.includes('1');
        return {
          ...product,
          votes: hasVoted ? product.votes - 1 : product.votes + 1,
          votedBy: hasVoted
            ? product.votedBy.filter((id) => id !== '1')
            : [...product.votedBy, '1'],
        };
      }
      return product;
    });

    const updatedGroup = { ...selectedGroup, products: updatedProducts };
    setSelectedGroup(updatedGroup);
    setGroups(groups.map((g) => (g.id === selectedGroup.id ? updatedGroup : g)));
  };

  const handleAddToSharedCart = (product: Product) => {
    if (!selectedGroup) return;

    const updatedGroup = {
      ...selectedGroup,
      sharedCart: [...selectedGroup.sharedCart, product],
    };
    setSelectedGroup(updatedGroup);
    setGroups(groups.map((g) => (g.id === selectedGroup.id ? updatedGroup : g)));
  };

  const handleGenerateInvite = () => {
    const link = `https://echocart.app/group/join/${selectedGroup?.id}`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold">Group Shopping</h1>
              <p className="text-sm text-muted-foreground">Shop together, decide together</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Groups</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCreatingGroup && (
                  <Card className="bg-muted">
                    <CardContent className="p-4 space-y-2">
                      <Input
                        placeholder="Group name..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateGroup} className="flex-1">
                          Create
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreatingGroup(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {groups.map((group) => (
                  <Card
                    key={group.id}
                    className={`cursor-pointer transition-all ${
                      selectedGroup?.id === group.id ? 'ring-2 ring-purple-600' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{group.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {group.members.length} members
                        </span>
                      </div>
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="border-2 border-background">
                            <AvatarFallback>{member.avatar}</AvatarFallback>
                          </Avatar>
                        ))}
                        {group.members.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                            +{group.members.length - 3}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Group Details */}
          {selectedGroup && (
            <div className="lg:col-span-2 space-y-6">
              {/* Group Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedGroup.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        Created {selectedGroup.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <Button onClick={handleGenerateInvite} size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </div>

                  {inviteLink && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Invite link copied to clipboard! 🎉
                      </p>
                      <code className="text-xs break-all">{inviteLink}</code>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-3">Members</h3>
                    <div className="flex flex-wrap gap-3">
                      {selectedGroup.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-2">
                          <Avatar>
                            <AvatarFallback>{member.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  member.isOnline ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                              />
                              <span className="text-xs text-muted-foreground">
                                {member.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="browse">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="browse">
                    Browse & Vote ({selectedGroup.products.length})
                  </TabsTrigger>
                  <TabsTrigger value="cart">
                    Shared Cart ({selectedGroup.sharedCart.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="space-y-4">
                  {selectedGroup.products.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <p className="text-muted-foreground">
                          No products yet. Start adding products to browse together!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    selectedGroup.products.map((product) => (
                      <Card key={product.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{product.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Added by {product.addedBy}
                              </p>
                              <p className="text-lg font-bold mb-3">${product.price.toFixed(2)}</p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={product.votedBy.includes('1') ? 'default' : 'outline'}
                                  onClick={() => handleVote(product.id)}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  {product.votes}
                                </Button>
                                {!selectedGroup.sharedCart.find((p) => p.id === product.id) && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddToSharedCart(product)}
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    Add to Cart
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="cart" className="space-y-4">
                  {selectedGroup.sharedCart.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Your shared cart is empty. Add products from the browse tab!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {selectedGroup.sharedCart.map((product) => (
                        <Card key={product.id}>
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{product.name}</h4>
                                <Badge variant="outline" className="mb-2">
                                  {product.votes} votes
                                </Badge>
                                <p className="font-bold">${product.price.toFixed(2)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Card className="bg-gradient-to-r from-purple-500 to-pink-600">
                        <CardContent className="p-6 text-white">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold">Total</span>
                            <span className="text-2xl font-bold">
                              ${selectedGroup.sharedCart.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
                            </span>
                          </div>
                          <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                            Checkout Together
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
