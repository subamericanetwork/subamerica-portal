import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import logo from "@/assets/subamerica-logo.jpg";

const ApplicationStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [appealText, setAppealText] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  useEffect(() => {
    fetchApplication();
  }, [user]);

  const fetchApplication = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("artist_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching application:", error);
        navigate("/become-artist");
        return;
      }

      setApplication(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || appealText.trim().length < 20) {
      toast.error("Please provide at least 20 characters for your appeal");
      return;
    }

    setSubmittingAppeal(true);

    try {
      const { error } = await supabase
        .from("artist_applications")
        .update({
          appeal_reason: appealText,
          appealed_at: new Date().toISOString(),
          appeal_status: 'pending'
        })
        .eq("id", application.id);

      if (error) throw error;

      toast.success("Appeal submitted! We'll review it within 48 hours.");
      fetchApplication();
    } catch (error: any) {
      console.error("Appeal error:", error);
      toast.error(error.message || "Failed to submit appeal");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logo} alt="Subamerica Logo" className="h-24 mx-auto mb-4" />
            <CardTitle>No Application Found</CardTitle>
            <CardDescription>
              You haven't submitted an artist application yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/become-artist")} className="w-full">
              Apply to Become an Artist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (application.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-500/50 bg-red-500/10">
            <XCircle className="h-3 w-3 mr-1" />
            Not Approved
          </Badge>
        );
      default:
        return null;
    }
  };

  const getEstimatedReviewDate = () => {
    const submittedDate = new Date(application.submitted_at);
    const reviewDate = new Date(submittedDate.getTime() + 48 * 60 * 60 * 1000);
    return format(reviewDate, 'MMM d, yyyy');
  };

  return (
    <div className="min-h-screen p-4 gradient-hero">
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-8">
          <img src={logo} alt="Subamerica Logo" className="h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Application Status</h1>
          <p className="text-muted-foreground text-lg">
            Track your artist application progress
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {application.artist_name}
                  </CardTitle>
                  <CardDescription>Port URL: {application.slug}</CardDescription>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-sm font-medium">{format(new Date(application.submitted_at), 'MMM d, yyyy')}</p>
                </div>
                {application.status === 'pending' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Review</p>
                    <p className="text-sm font-medium">{getEstimatedReviewDate()}</p>
                  </div>
                )}
                {application.reviewed_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed</p>
                    <p className="text-sm font-medium">{format(new Date(application.reviewed_at), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>

              {application.status === 'pending' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your application is under review. We aim to respond within 48 hours. You'll receive an email when we've made a decision.
                  </AlertDescription>
                </Alert>
              )}

              {application.status === 'approved' && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Congratulations! Your application has been approved. You can now access all artist features.
                  </AlertDescription>
                </Alert>
              )}

              {application.status === 'rejected' && application.rejection_reason && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    <strong>Reason:</strong> {application.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}

              {application.admin_notes && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">Admin Notes</p>
                  <p className="text-sm text-muted-foreground">{application.admin_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {application.status === 'rejected' && !application.appeal_reason && (
            <Card>
              <CardHeader>
                <CardTitle>Appeal Decision</CardTitle>
                <CardDescription>
                  If you believe there was a misunderstanding, you can appeal this decision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAppeal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="appealText">Why should we reconsider your application?</Label>
                    <Textarea
                      id="appealText"
                      value={appealText}
                      onChange={(e) => setAppealText(e.target.value)}
                      placeholder="Explain why you believe we should reconsider your application..."
                      rows={4}
                      required
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">{appealText.length}/1000 (min 20 characters)</p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Appeals are reviewed within 48 hours. You can only submit one appeal per application.
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" disabled={submittingAppeal || appealText.trim().length < 20}>
                    {submittingAppeal ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Appeal...
                      </>
                    ) : (
                      "Submit Appeal"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {application.appeal_reason && (
            <Card>
              <CardHeader>
                <CardTitle>Appeal Submitted</CardTitle>
                <CardDescription>
                  Your appeal is {application.appeal_status === 'pending' ? 'under review' : application.appeal_status}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">Your Appeal</p>
                  <p className="text-sm text-muted-foreground">{application.appeal_reason}</p>
                </div>
                {application.appealed_at && (
                  <p className="text-sm text-muted-foreground">
                    Submitted on {format(new Date(application.appealed_at), 'MMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Button variant="outline" onClick={() => navigate("/fan/dashboard")} className="w-full">
            Back to Fan Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationStatus;
