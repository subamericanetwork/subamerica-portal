import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useArtistData } from "@/hooks/useArtistData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Calendar, CheckCircle, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Tip {
  id: string;
  created_at: string;
  amount: number;
  artist_share: number;
  tipper_email: string;
  payout_status: 'pending' | 'processing' | 'paid';
  payout_date: string | null;
  payout_reference: string | null;
}

const PaymentHistory = () => {
  const { artist, loading: artistLoading } = useArtistData();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (artist) {
      fetchTips();
    }
  }, [artist]);

  const fetchTips = async () => {
    if (!artist) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tips")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTips((data || []) as Tip[]);
      
      // Calculate totals
      const pending = data?.filter(t => t.payout_status === 'pending' || t.payout_status === 'processing')
        .reduce((sum, t) => sum + (t.artist_share || 0), 0) || 0;
      const paid = data?.filter(t => t.payout_status === 'paid')
        .reduce((sum, t) => sum + (t.artist_share || 0), 0) || 0;
      
      setTotalPending(pending);
      setTotalPaid(paid);
    } catch (error) {
      console.error("Error fetching tips:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
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

  if (artistLoading || loading) {
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
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="text-muted-foreground mt-1">
            Track all tips and payouts from SubAmerica
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalPending / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Your 80% share
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalPaid / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All-time earnings
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
        </div>

        {/* Payment Terms Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Terms
            </CardTitle>
            <CardDescription>
              SubAmerica collects all tips on your behalf and pays out 80% of each transaction within 3-5 business days.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Transaction Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              Complete history of tips received and payout status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tips received yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tipper</TableHead>
                      <TableHead>Tip Amount</TableHead>
                      <TableHead>Your Share (80%)</TableHead>
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
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistory;
