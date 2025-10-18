import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Calendar, CheckCircle, Clock, Loader2, Package, HeartHandshake } from "lucide-react";
import { format } from "date-fns";

interface Tip {
  id: string;
  created_at: string;
  amount: number;
  artist_share: number;
  tipper_email: string;
  artist_name: string;
  artist_slug: string;
  payout_status: 'pending' | 'processing' | 'paid';
  payout_date: string | null;
  payout_reference: string | null;
}

interface Order {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string | null;
  product_name: string;
  product_variant: string | null;
  quantity: number;
  total_amount: number;
  fulfillment_status: string;
  tracking_number: string | null;
  shipping_carrier: string | null;
  artist_id: string;
}

interface ArtistInfo {
  display_name: string;
  slug: string;
}

const AdminPayments = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [artistMap, setArtistMap] = useState<Record<string, ArtistInfo>>({});
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    fetchAllPayments();
  }, []);

  const fetchAllPayments = async () => {
    setLoading(true);
    try {
      // Fetch all tips
      const { data: tipsData, error: tipsError } = await supabase
        .from("tips")
        .select("*")
        .order("created_at", { ascending: false });

      if (tipsError) throw tipsError;
      setTips((tipsData || []) as Tip[]);

      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders((ordersData || []) as Order[]);

      // Fetch artist info for orders
      const artistIds = [...new Set(ordersData?.map(o => o.artist_id) || [])];
      if (artistIds.length > 0) {
        const { data: artistsData } = await supabase
          .from("artists")
          .select("id, display_name, slug")
          .in("id", artistIds);

        if (artistsData) {
          const map: Record<string, ArtistInfo> = {};
          artistsData.forEach(artist => {
            map[artist.id] = {
              display_name: artist.display_name,
              slug: artist.slug
            };
          });
          setArtistMap(map);
        }
      }

      // Calculate totals
      const tipsRevenue = tipsData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const ordersRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      setTotalRevenue(tipsRevenue + ordersRevenue);

      const tipsPending = tipsData?.filter(t => t.payout_status !== 'paid')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      setTotalPending(tipsPending);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            {status === 'paid' ? 'Paid' : 'Delivered'}
          </Badge>
        );
      case 'processing':
      case 'shipped':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {status === 'processing' ? 'Processing' : 'Shipped'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Payments</h1>
          <p className="text-muted-foreground mt-1">
            Complete overview of all transactions across the platform
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalPending / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting payout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tips.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Product sales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="tips">
              <HeartHandshake className="h-4 w-4 mr-2" />
              Tips ({tips.length})
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="h-4 w-4 mr-2" />
              Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  Combined view of tips and product orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tips.length === 0 && orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Artist</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...tips.map(t => ({ ...t, type: 'tip' })), ...orders.map(o => ({ ...o, type: 'order' }))]
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-mono text-sm">
                                {format(new Date(item.created_at), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                {item.type === 'tip' ? (
                                  <Badge variant="outline">
                                    <HeartHandshake className="h-3 w-3 mr-1" />
                                    Tip
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    <Package className="h-3 w-3 mr-1" />
                                    Order
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {item.type === 'tip' 
                                  ? (item as Tip).artist_name
                                  : artistMap[(item as Order).artist_id]?.display_name || 'Unknown'
                                }
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {item.type === 'tip' 
                                  ? (item as Tip).tipper_email
                                  : (item as Order).customer_email
                                }
                              </TableCell>
                              <TableCell>
                                {item.type === 'tip' 
                                  ? 'Tip donation'
                                  : `${(item as Order).product_name}${(item as Order).product_variant ? ` - ${(item as Order).product_variant}` : ''}`
                                }
                              </TableCell>
                              <TableCell className="font-semibold">
                                ${((item.type === 'tip' 
                                  ? (item as Tip).amount 
                                  : (item as Order).total_amount
                                ) / 100).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(
                                  item.type === 'tip' 
                                    ? (item as Tip).payout_status
                                    : (item as Order).fulfillment_status
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips">
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
                <CardDescription>
                  All tip donations across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tips.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <HeartHandshake className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tips received yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Artist</TableHead>
                          <TableHead>Tipper</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Artist Share (80%)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payout Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tips.map((tip) => (
                          <TableRow key={tip.id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(tip.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{tip.artist_name}</span>
                                <span className="text-xs text-muted-foreground">@{tip.artist_slug}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {tip.tipper_email}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ${(tip.amount / 100).toFixed(2)}
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              ${(tip.artist_share / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(tip.payout_status)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {tip.payout_date ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(tip.payout_date), 'MMM d, yyyy')}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Product Orders</CardTitle>
                <CardDescription>
                  All product orders and fulfillment tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Artist</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tracking</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(order.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {artistMap[order.artist_id]?.display_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{order.customer_name || 'N/A'}</span>
                                <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{order.product_name}</span>
                                {order.product_variant && (
                                  <span className="text-xs text-muted-foreground">{order.product_variant}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell className="font-semibold">
                              ${(order.total_amount / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(order.fulfillment_status)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {order.tracking_number ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{order.tracking_number}</span>
                                  {order.shipping_carrier && (
                                    <span className="text-xs text-muted-foreground">{order.shipping_carrier}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
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
    </DashboardLayout>
  );
};

export default AdminPayments;
