import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, FileText, TrendingUp } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Application {
  id: string;
  user_id: string;
  artist_name: string;
  slug: string;
  bio: string;
  why_join: string;
  scene: string | null;
  portfolio_links: any;
  status: string;
  rejection_reason: string | null;
  appeal_status: string | null;
  appeal_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface Stats {
  totalPending: number;
  pendingAppeals: number;
  approvedToday: number;
  avgReviewTime: string;
}

export default function AdminApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    pendingAppeals: 0,
    approvedToday: 0,
    avgReviewTime: "N/A"
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Review form state
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [appealAction, setAppealAction] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("artist_applications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      setApplications(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast.error("Failed to load applications: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps: Application[]) => {
    const pending = apps.filter(a => a.status === "pending").length;
    const appeals = apps.filter(a => a.appeal_status === "pending").length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const approvedToday = apps.filter(a => 
      a.status === "approved" && 
      a.reviewed_at && 
      new Date(a.reviewed_at) >= today
    ).length;

    // Calculate average review time
    const reviewedApps = apps.filter(a => a.reviewed_at && a.submitted_at);
    if (reviewedApps.length > 0) {
      const totalTime = reviewedApps.reduce((sum, app) => {
        const submitted = new Date(app.submitted_at).getTime();
        const reviewed = new Date(app.reviewed_at!).getTime();
        return sum + (reviewed - submitted);
      }, 0);
      const avgMs = totalTime / reviewedApps.length;
      const avgHours = Math.round(avgMs / (1000 * 60 * 60));
      setStats({
        totalPending: pending,
        pendingAppeals: appeals,
        approvedToday,
        avgReviewTime: `${avgHours}h`
      });
    } else {
      setStats({
        totalPending: pending,
        pendingAppeals: appeals,
        approvedToday,
        avgReviewTime: "N/A"
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.artist_name.toLowerCase().includes(term) ||
        app.slug.toLowerCase().includes(term) ||
        app.scene?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "appealed") {
        filtered = filtered.filter(app => app.appeal_status === "pending");
      } else {
        filtered = filtered.filter(app => app.status === statusFilter);
      }
    }

    setFilteredApplications(filtered);
  };

  const handleApprove = async () => {
    if (!selectedApp || !user) return;

    try {
      setProcessing(true);
      
      const { data, error } = await supabase.rpc("approve_artist_application", {
        application_id: selectedApp.id,
        admin_id: user.id,
        admin_notes: adminNotes || null
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string; slug?: string };

      if (!result.success) {
        throw new Error(result.error || "Failed to approve application");
      }

      // Send approval email
      try {
        // Get user email from user_profiles
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('user_id', selectedApp.user_id)
          .single();

        if (profileData?.email) {
          await supabase.functions.invoke('send-approval-email', {
            body: {
              artist_email: profileData.email,
              artist_name: selectedApp.artist_name,
              slug: result.slug || selectedApp.slug,
              admin_notes: adminNotes || undefined
            }
          });
          console.log('Approval email sent to:', profileData.email);
        }
      } catch (emailError: any) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the approval if email fails
      }

      // Show appropriate success message based on whether slug was modified
      if (result.message?.includes('modified slug')) {
        toast.success(result.message);
      } else {
        toast.success(`Artist account created for ${selectedApp.artist_name}!`);
      }
      
      setReviewDialogOpen(false);
      setSelectedApp(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      toast.error("Approval failed: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !user || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setProcessing(true);

      const { error } = await supabase
        .from("artist_applications")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          admin_notes: adminNotes || null
        })
        .eq("id", selectedApp.id);

      if (error) throw error;

      toast.success("Application rejected");
      setReviewDialogOpen(false);
      setSelectedApp(null);
      setRejectionReason("");
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      toast.error("Rejection failed: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAppealAction = async () => {
    if (!selectedApp || !user || !appealAction) return;

    try {
      setProcessing(true);

      if (appealAction === "approve") {
        // First update status to pending so approve function works
        await supabase
          .from("artist_applications")
          .update({ status: "pending" })
          .eq("id", selectedApp.id);

        // Approve the appeal - create artist account
        const { data, error } = await supabase.rpc("approve_artist_application", {
          application_id: selectedApp.id,
          admin_id: user.id,
          admin_notes: adminNotes || "Appeal approved"
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string; message?: string; slug?: string };
        if (!result.success) throw new Error(result.error);

        // Update appeal status
        await supabase
          .from("artist_applications")
          .update({ 
            appeal_status: "approved",
            appeal_reviewed_at: new Date().toISOString(),
            appeal_reviewed_by: user.id
          })
          .eq("id", selectedApp.id);

        // Send approval email
        try {
          // Get user email from user_profiles
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('user_id', selectedApp.user_id)
            .single();

          if (profileData?.email) {
            await supabase.functions.invoke('send-approval-email', {
              body: {
                artist_email: profileData.email,
                artist_name: selectedApp.artist_name,
                slug: result.slug || selectedApp.slug,
                admin_notes: adminNotes || "Appeal approved"
              }
            });
            console.log('Approval email sent to:', profileData.email);
          }
        } catch (emailError: any) {
          console.error('Failed to send approval email:', emailError);
          // Don't fail the approval if email fails
        }

        // Show appropriate success message based on whether slug was modified
        if (result.message?.includes('modified slug')) {
          toast.success(`Appeal approved! ${result.message}`);
        } else {
          toast.success(`Appeal approved! Artist account created for ${selectedApp.artist_name}`);
        }
      } else if (appealAction === "reject") {
        // Reject the appeal
        if (!rejectionReason.trim()) {
          toast.error("Please provide a reason for appeal rejection");
          return;
        }

        const { error } = await supabase
          .from("artist_applications")
          .update({
            appeal_status: "rejected",
            appeal_reviewed_at: new Date().toISOString(),
            appeal_reviewed_by: user.id,
            admin_notes: adminNotes || null
          })
          .eq("id", selectedApp.id);

        if (error) throw error;
        toast.success("Appeal rejected");
      }

      setReviewDialogOpen(false);
      setSelectedApp(null);
      setAppealAction("");
      setRejectionReason("");
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to process appeal: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (app: Application) => {
    if (app.appeal_status === "pending") {
      return <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Appeal Pending</Badge>;
    }
    
    switch (app.status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{app.status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Artist Applications</h1>
          <p className="text-muted-foreground">Review and manage artist applications</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.totalPending}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Appeals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold">{stats.pendingAppeals}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.approvedToday}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Review Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.avgReviewTime}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search by name, slug, or scene..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="appealed">Appealed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
            <CardDescription>Click "Review" to view details and take action</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No applications found matching your criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Artist Name</TableHead>
                    <TableHead>Port URL</TableHead>
                    <TableHead>Scene</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(app.submitted_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(app.submitted_at), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{app.artist_name}</TableCell>
                      <TableCell>
                        <code className="text-sm">@{app.slug}</code>
                      </TableCell>
                      <TableCell>{app.scene || "—"}</TableCell>
                      <TableCell>{getStatusBadge(app)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog open={reviewDialogOpen && selectedApp?.id === app.id} onOpenChange={(open) => {
                          setReviewDialogOpen(open);
                          if (!open) {
                            setSelectedApp(null);
                            setRejectionReason("");
                            setAdminNotes("");
                            setAppealAction("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApp(app)}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">{app.artist_name}</DialogTitle>
                              <DialogDescription>
                                Application submitted {formatDistanceToNow(new Date(app.submitted_at), { addSuffix: true })}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                              {/* Left Panel - Application Details */}
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-semibold">Port URL</Label>
                                  <p className="text-sm mt-1">@{app.slug}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-semibold">Music Scene</Label>
                                  <p className="text-sm mt-1">{app.scene || "Not specified"}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-semibold">Bio</Label>
                                  <div className="text-sm mt-1 max-h-32 overflow-y-auto bg-muted p-3 rounded-md">
                                    {app.bio}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-semibold">Why Join</Label>
                                  <div className="text-sm mt-1 max-h-32 overflow-y-auto bg-muted p-3 rounded-md">
                                    {app.why_join}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-semibold">Portfolio Links</Label>
                                  <div className="space-y-1 mt-1">
                                    {Array.isArray(app.portfolio_links) && app.portfolio_links.length > 0 ? (
                                      app.portfolio_links.map((link: any, idx: number) => (
                                        <a
                                          key={idx}
                                          href={link.url || link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          {link.label || link.url || link}
                                        </a>
                                      ))
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No links provided</p>
                                    )}
                                  </div>
                                </div>

                                {app.status !== "pending" && !app.appeal_status && (
                                  <div className="pt-4 border-t">
                                    <Label className="text-sm font-semibold">Review Information</Label>
                                    <div className="text-sm mt-2 space-y-1">
                                      <p><span className="font-medium">Status:</span> {app.status}</p>
                                      {app.reviewed_at && (
                                        <p><span className="font-medium">Reviewed:</span> {format(new Date(app.reviewed_at), "PPpp")}</p>
                                      )}
                                      {app.rejection_reason && (
                                        <div>
                                          <span className="font-medium">Rejection Reason:</span>
                                          <p className="text-muted-foreground mt-1">{app.rejection_reason}</p>
                                        </div>
                                      )}
                                      {app.admin_notes && (
                                        <div>
                                          <span className="font-medium">Admin Notes:</span>
                                          <p className="text-muted-foreground mt-1">{app.admin_notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {app.appeal_status === "pending" && app.appeal_reason && (
                                  <div className="pt-4 border-t">
                                    <Label className="text-sm font-semibold text-purple-600 dark:text-purple-400">Appeal Submitted</Label>
                                    <div className="text-sm mt-2 space-y-1">
                                      <p><span className="font-medium">Original Rejection:</span></p>
                                      <p className="text-muted-foreground">{app.rejection_reason}</p>
                                      <p className="mt-2"><span className="font-medium">Appeal Reason:</span></p>
                                      <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                                        {app.appeal_reason}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right Panel - Review Actions */}
                              <div className="space-y-4">
                                {app.status === "pending" && app.appeal_status !== "pending" && (
                                  <>
                                    <div>
                                      <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                                      <Textarea
                                        id="admin-notes"
                                        placeholder="Add any notes about this application..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="mt-1"
                                        rows={3}
                                      />
                                    </div>

                                    <Button
                                      className="w-full bg-green-600 hover:bg-green-700"
                                      onClick={handleApprove}
                                      disabled={processing}
                                    >
                                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                      Approve & Create Artist Account
                                    </Button>

                                    <div className="pt-4 border-t">
                                      <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                                      <Textarea
                                        id="rejection-reason"
                                        placeholder="Explain why this application is being rejected..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="mt-1"
                                        rows={4}
                                      />
                                      <Button
                                        variant="destructive"
                                        className="w-full mt-2"
                                        onClick={handleReject}
                                        disabled={processing || !rejectionReason.trim()}
                                      >
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                        Reject Application
                                      </Button>
                                    </div>
                                  </>
                                )}

                                {app.appeal_status === "pending" && (
                                  <>
                                    <div>
                                      <Label htmlFor="appeal-action">Appeal Decision *</Label>
                                      <Select value={appealAction} onValueChange={setAppealAction}>
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Choose action..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="approve">Approve Appeal</SelectItem>
                                          <SelectItem value="reject">Reject Appeal</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {appealAction === "reject" && (
                                      <div>
                                        <Label htmlFor="appeal-rejection">Appeal Rejection Reason *</Label>
                                        <Textarea
                                          id="appeal-rejection"
                                          placeholder="Explain why the appeal is being rejected..."
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          className="mt-1"
                                          rows={4}
                                        />
                                      </div>
                                    )}

                                    <div>
                                      <Label htmlFor="appeal-notes">Admin Notes (Optional)</Label>
                                      <Textarea
                                        id="appeal-notes"
                                        placeholder="Add any notes..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        className="mt-1"
                                        rows={3}
                                      />
                                    </div>

                                    <Button
                                      className="w-full"
                                      onClick={handleAppealAction}
                                      disabled={processing || !appealAction || (appealAction === "reject" && !rejectionReason.trim())}
                                    >
                                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                      Submit Appeal Decision
                                    </Button>
                                  </>
                                )}

                                {app.status !== "pending" && app.appeal_status !== "pending" && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <p>This application has already been reviewed.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
