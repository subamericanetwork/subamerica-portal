import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet, CheckCircle, Info, Receipt } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Tip {
  id: string;
  created_at: string;
  amount: number;
  artist_share: number;
  tipper_email: string;
  payout_status: string;
  payout_date: string | null;
  payout_reference: string | null;
}

const Payments = () => {
  const { artist, loading: artistLoading } = useArtistData();
  const [loading, setLoading] = useState(false);
  const [payoutData, setPayoutData] = useState({
    payout_paypal_email: "",
    payout_venmo_email: "",
    payout_zelle_email: "",
    payout_primary_method: "",
  });
  
  // Payment history state
  const [tips, setTips] = useState<Tip[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (artist) {
      fetchPayoutData();
      fetchTips();
    }
  }, [artist]);

  const fetchPayoutData = async () => {
    if (!artist) return;

    try {
      const { data: artistData } = await supabase
        .from("artists")
        .select("payout_paypal_email, payout_venmo_email, payout_zelle_email, payout_primary_method")
        .eq("id", artist.id)
        .single();

      if (artistData) {
        setPayoutData({
          payout_paypal_email: artistData.payout_paypal_email || "",
          payout_venmo_email: artistData.payout_venmo_email || "",
          payout_zelle_email: artistData.payout_zelle_email || "",
          payout_primary_method: artistData.payout_primary_method || "",
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching payout data:", error);
    }
  };

  const fetchTips = async () => {
    if (!artist) return;
    setHistoryLoading(true);

    try {
      const { data, error } = await supabase
        .from("tips")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTips(data || []);
      
      // Calculate totals (convert cents to dollars)
      const pending = data?.filter(t => t.payout_status === 'pending')
        .reduce((sum, t) => sum + (t.artist_share || 0), 0) / 100 || 0;
      const paid = data?.filter(t => t.payout_status === 'paid')
        .reduce((sum, t) => sum + (t.artist_share || 0), 0) / 100 || 0;
      
      setTotalPending(pending);
      setTotalPaid(paid);
    } catch (error: any) {
      toast.error("Failed to fetch payment history");
      if (import.meta.env.DEV) console.error("Error fetching tips:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSavePayoutInfo = async () => {
    if (!artist) return;
    
    // Validation
    if (!payoutData.payout_primary_method) {
      toast.error("Please select a primary payout method");
      return;
    }

    const primaryMethod = payoutData.payout_primary_method;
    const primaryEmail = payoutData[`payout_${primaryMethod}_email` as keyof typeof payoutData];
    
    if (!primaryEmail) {
      toast.error(`Please enter your ${primaryMethod} email address`);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("artists")
        .update({
          payout_paypal_email: payoutData.payout_paypal_email || null,
          payout_venmo_email: payoutData.payout_venmo_email || null,
          payout_zelle_email: payoutData.payout_zelle_email || null,
          payout_primary_method: payoutData.payout_primary_method,
        })
        .eq("id", artist.id);

      if (error) throw error;
      toast.success("Payout information saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save payout information");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      paid: "bg-green-500/20 text-green-500 border-green-500/30",
      processing: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    };
    
    return (
      <Badge className={variants[status] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (artistLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const hasPayoutConfigured = payoutData.payout_primary_method && 
    payoutData[`payout_${payoutData.payout_primary_method}_email` as keyof typeof payoutData];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage payout accounts and view payment history
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How Payouts Work:</strong> SubAmerica processes all tips and purchases through Stripe. 
            You receive 80% of each transaction, paid to your chosen account within 3-5 business days.
          </AlertDescription>
        </Alert>

        {/* Payout Account Settings */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Payout Account
                </CardTitle>
                <CardDescription>
                  Where should we send your earnings?
                </CardDescription>
              </div>
              {hasPayoutConfigured && (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg border border-border bg-muted/50">
              <p className="text-sm">
                <strong>Privacy:</strong> Your payout information is private and secure. 
                It will never be shown publicly or shared with anyone outside SubAmerica.
              </p>
            </div>

            <RadioGroup 
              value={payoutData.payout_primary_method}
              onValueChange={(value) => setPayoutData({ ...payoutData, payout_primary_method: value })}
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="paypal" className="font-semibold cursor-pointer">
                      PayPal
                    </Label>
                    <Input
                      placeholder="your-email@example.com"
                      value={payoutData.payout_paypal_email}
                      onChange={(e) => setPayoutData({ ...payoutData, payout_paypal_email: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <RadioGroupItem value="venmo" id="venmo" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="venmo" className="font-semibold cursor-pointer">
                      Venmo
                    </Label>
                    <Input
                      placeholder="your-email@example.com"
                      value={payoutData.payout_venmo_email}
                      onChange={(e) => setPayoutData({ ...payoutData, payout_venmo_email: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <RadioGroupItem value="zelle" id="zelle" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="zelle" className="font-semibold cursor-pointer">
                      Zelle
                    </Label>
                    <Input
                      placeholder="your-email@example.com"
                      value={payoutData.payout_zelle_email}
                      onChange={(e) => setPayoutData({ ...payoutData, payout_zelle_email: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </RadioGroup>

            <Button onClick={handleSavePayoutInfo} disabled={loading}>
              {loading ? "Saving..." : "Save Payout Information"}
            </Button>
          </CardContent>
        </Card>

        {/* Payment History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>
              Track your tips, payouts, and earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-yellow-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Will be paid within 3-5 business days
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Paid Out
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-time earnings
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tips.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime tip count
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transaction Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tipper</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Your Share (80%)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payout Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : tips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No tips received yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    tips.map((tip) => (
                      <TableRow key={tip.id}>
                        <TableCell>
                          {new Date(tip.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">{tip.tipper_email}</TableCell>
                        <TableCell className="text-right">${((tip.amount || 0) / 100).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ${((tip.artist_share || 0) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(tip.payout_status)}</TableCell>
                        <TableCell>
                          {tip.payout_date 
                            ? new Date(tip.payout_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Payment Terms */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Payment Terms:</strong> You receive 80% of each tip. Payouts are processed within 3-5 business days 
                to your primary payout account. SubAmerica retains 20% to cover processing fees and platform costs.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Payments;