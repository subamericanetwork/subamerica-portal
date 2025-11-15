import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PurchaseMinutesCardProps {
  minutesRemaining?: number;
}

export const PurchaseMinutesCard = ({ minutesRemaining = 0 }: PurchaseMinutesCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-destructive" />
          No Streaming Minutes Remaining
        </CardTitle>
        <CardDescription>
          Purchase additional streaming time to continue going live
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Usage</span>
            <span className="text-sm text-muted-foreground">
              {minutesRemaining} minutes remaining
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-destructive h-2 rounded-full transition-all"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Options to continue streaming:</h4>
          
          <div className="grid gap-3">
            <div className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Purchase Additional Minutes</p>
                  <p className="text-xs text-muted-foreground">
                    Buy streaming time packages as needed
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Wait for Monthly Reset</p>
                  <p className="text-xs text-muted-foreground">
                    Your minutes refresh at the start of each billing cycle
                  </p>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/monetization')} 
          className="w-full"
          size="lg"
        >
          Purchase Streaming Minutes
        </Button>
      </CardContent>
    </Card>
  );
};
