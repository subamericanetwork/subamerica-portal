import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: string;
  artistName: string;
  artistSlug: string;
}

const PRESET_AMOUNTS = [5, 10, 20, 50];

export const TipDialog = ({ open, onOpenChange, artistId, artistName, artistSlug }: TipDialogProps) => {
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTip = async (amountInDollars: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-tip-payment", {
        body: {
          artistId,
          artistName,
          artistSlug,
          amount: amountInDollars * 100, // Convert to cents
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
        setSelectedAmount(null);
        setCustomAmount("");
      }
    } catch (error: any) {
      console.error("Tip error:", error);
      toast.error(error.message || "Failed to process tip");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Please enter a valid amount (minimum $1)");
      return;
    }
    handleTip(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Tip {artistName}
          </DialogTitle>
          <DialogDescription>
            Show your support with a tip. Every contribution helps artists create more amazing content!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {PRESET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                  handleTip(amount);
                }}
                disabled={loading}
                className="h-14 text-lg font-semibold"
              >
                ${amount}
              </Button>
            ))}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter custom amount</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount">Custom Amount</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="25.00"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  className="pl-7"
                  disabled={loading}
                />
              </div>
              <Button onClick={handleCustomTip} disabled={loading || !customAmount}>
                Send Tip
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
