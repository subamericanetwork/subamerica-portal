import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Application {
  id: string;
  user_id: string;
  artist_name: string;
  slug: string;
  bio: string;
  why_join: string;
  scene: string;
  portfolio_links: any;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  appeal_status: string | null;
  appeal_reason: string | null;
  appealed_at: string | null;
}

const AdminApplications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "appeal-approve" | "appeal-reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const [stats, setStats] = useState({
    pending: 0,
    pendingAppeals: 0,
    approvedToday: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("artist_applications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      setApplications(data || []);

      // Calculate stats
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      setStats({
        pending: data?.filter((app) => app.status === "pending").length || 0,
        pendingAppeals: data?.filter((app) => app.appeal_status === "pending").length || 0,
        approvedToday: data?.filter((app) => app.status === "approved" && new Date(app.reviewed_at || "") > oneDayAgo).length || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp || !user) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc("approve_artist_application", {
        application_id: selectedApp.id,
        admin_id: user.id,
        admin_notes: approvalNotes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        throw new Error(result.error || "Failed to approve application");
      }

      toast({
        title: "Success",
        description: `Artist account created successfully for ${selectedApp.artist_name}!`,
      });

      setDialogOpen(false);
      setSelectedApp(null);
      setApprovalNotes("");
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !user || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("artist_applications")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", selectedApp.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application rejected",
      });

      setDialogOpen(false);
      setSelectedApp(null);
      setRejectionReason("");
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAppealApprove = async () => {
    if (!selectedApp || !user) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc("approve_artist_application", {
        application_id: selectedApp.id,
        admin_id: user.id,
        admin_notes: approvalNotes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || "Failed to approve appeal");
      }

      // Update appeal status
      await supabase
        .from("artist_applications")
        .update({
          appeal_status: "approved",
          appeal_reviewed_at: new Date().toISOString(),
          appeal_reviewed_by: user.id,
        })
        .eq("id", selectedApp.id);

      toast({
        title: "Success",
        description: `Appeal approved! Artist account created for ${selectedApp.artist_name}.`,
      });

      setDialogOpen(false);
      setSelectedApp(null);
      setApprovalNotes("");
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAppealReject = async () => {
    if (!selectedApp || !user || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Rejection reason is required",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("artist_applications")
        .update({
          appeal_status: "rejected",
          admin_notes: rejectionReason,
          appeal_reviewed_at: new Date().toISOString(),
          appeal_reviewed_by: user.id,
        })
        .eq("id", selectedApp.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appeal rejected. This is the final decision.",
      });

      setDialogOpen(false);
      setSelectedApp(null);
      setRejectionReason("");
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const openReviewDialog = (app: Application, action: "approve" | "reject" | "appeal-approve" | "appeal-reject") => {
    setSelectedApp(app);
    setActionType(action);
    setDialogOpen(true);
  };

  const getStatusBadge = (app: Application) => {
    if (app.appeal_status === "pending") {
      return <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20"><AlertCircle className="w-3 h-3 mr-1" />Appeal Pending</Badge>;
    }
    
    switch (app.status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{app.status}</Badge>;
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.scene || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && app.status === "pending") ||
      (statusFilter === "approved" && app.status === "approved") ||
      (statusFilter === "rejected" && app.status === "rejected") ||
      (statusFilter === "appealed" && app.appeal_status === "pending");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Artist Applications</h1>
        <p className="text-muted-foreground">Review and manage artist applications</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-4xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Appeals</CardDescription>
            <CardTitle className="text-4xl">{stats.pendingAppeals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved Today</CardDescription>
            <CardTitle className="text-4xl">{stats.approvedToday}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by artist name, slug, or scene..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="appealed">Appealed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === "pending" ? "All caught up! No pending applications to review." : "No applications match your search criteria."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Artist Name</TableHead>
                    <TableHead>Port URL</TableHead>
                    <TableHead>Scene</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(app.submitted_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="font-medium">{app.artist_name}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">@{app.slug}</span>
                      </TableCell>
                      <TableCell>{app.scene || "-"}</TableCell>
                      <TableCell>{getStatusBadge(app)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(app);
                            setActionType(null);
                            setDialogOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">{selectedApp?.artist_name}</AlertDialogTitle>
            <AlertDialogDescription>
              @{selectedApp?.slug} • Submitted {selectedApp && formatDistanceToNow(new Date(selectedApp.submitted_at), { addSuffix: true })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedApp && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Panel - Application Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Scene / Genre</h3>
                  <p className="text-sm text-muted-foreground">{selectedApp.scene || "Not specified"}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">{selectedApp.bio}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Why Join Subamerica?</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">{selectedApp.why_join}</p>
                </div>

                {selectedApp.portfolio_links && Array.isArray(selectedApp.portfolio_links) && selectedApp.portfolio_links.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Portfolio Links</h3>
                    <div className="space-y-1">
                      {selectedApp.portfolio_links.map((link: any, idx: number) => (
                        <a
                          key={idx}
                          href={link.url || link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {link.label || link.url || link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.rejection_reason && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <h3 className="font-semibold text-sm mb-1">Original Rejection Reason</h3>
                    <p className="text-sm text-muted-foreground">{selectedApp.rejection_reason}</p>
                  </div>
                )}

                {selectedApp.appeal_reason && (
                  <div className="p-3 bg-purple-500/10 rounded-md">
                    <h3 className="font-semibold text-sm mb-1">Appeal Explanation</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedApp.appeal_reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Appealed {formatDistanceToNow(new Date(selectedApp.appealed_at || ""), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel - Actions */}
              <div className="space-y-4">
                {selectedApp.status === "pending" && !actionType && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => openReviewDialog(selectedApp, "approve")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => openReviewDialog(selectedApp, "reject")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </>
                )}

                {selectedApp.appeal_status === "pending" && !actionType && (
                  <>
                    <div className="p-3 bg-purple-500/10 rounded-md mb-4">
                      <p className="text-sm font-semibold">This application has been appealed</p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => openReviewDialog(selectedApp, "appeal-approve")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Appeal
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => openReviewDialog(selectedApp, "appeal-reject")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Appeal (Final)
                    </Button>
                  </>
                )}

                {actionType === "approve" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Welcome Notes (Optional)</label>
                      <Textarea
                        placeholder="Add a welcome message for the artist..."
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Confirm Approval & Create Artist Account
                    </Button>
                  </div>
                )}

                {actionType === "reject" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rejection Reason (Required)</label>
                      <Select value={rejectionReason} onValueChange={setRejectionReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Insufficient portfolio">Insufficient portfolio</SelectItem>
                          <SelectItem value="Does not align with Subamerica scene">Does not align with Subamerica scene</SelectItem>
                          <SelectItem value="Incomplete application">Incomplete application</SelectItem>
                          <SelectItem value="Other">Other (specify below)</SelectItem>
                        </SelectContent>
                      </Select>
                      {rejectionReason && (
                        <Textarea
                          className="mt-2"
                          placeholder="Additional details..."
                          value={rejectionReason === "Insufficient portfolio" || rejectionReason === "Does not align with Subamerica scene" || rejectionReason === "Incomplete application" ? rejectionReason : rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={3}
                        />
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Confirm Rejection
                    </Button>
                  </div>
                )}

                {actionType === "appeal-approve" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                      <Textarea
                        placeholder="Add notes about the appeal approval..."
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAppealApprove}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Approve Appeal & Create Artist Account
                    </Button>
                  </div>
                )}

                {actionType === "appeal-reject" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Final Rejection Reason (Required)</label>
                      <Textarea
                        placeholder="Explain why the appeal is being rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleAppealReject}
                      disabled={!rejectionReason.trim() || processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Final Rejection - No Further Appeals
                    </Button>
                  </div>
                )}

                {(selectedApp.status === "approved" || (selectedApp.status === "rejected" && !selectedApp.appeal_status)) && !actionType && (
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <p className="text-sm font-semibold">Review Complete</p>
                    {selectedApp.reviewed_at && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed {formatDistanceToNow(new Date(selectedApp.reviewed_at), { addSuffix: true })}
                      </p>
                    )}
                    {selectedApp.admin_notes && (
                      <>
                        <p className="text-xs font-medium mt-2">Admin Notes:</p>
                        <p className="text-xs text-muted-foreground">{selectedApp.admin_notes}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDialogOpen(false);
              setSelectedApp(null);
              setActionType(null);
              setRejectionReason("");
              setApprovalNotes("");
            }}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminApplications;