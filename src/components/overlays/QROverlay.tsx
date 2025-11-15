import { Card } from "@/components/ui/card";
import { QrCode } from "lucide-react";

interface QROverlayProps {
  data: {
    destination_url: string;
    instructions?: string;
    qr_code_data?: string;
  };
}

export function QROverlay({ data }: QROverlayProps) {
  // Generate QR code URL using a QR code API service
  const qrCodeUrl = data.qr_code_data || 
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.destination_url)}`;

  return (
    <Card className="bg-background/95 backdrop-blur-sm border-primary/20 p-4 max-w-xs shadow-xl">
      <div className="flex flex-col items-center text-center">
        <div className="bg-white p-3 rounded-lg mb-3">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-32 h-32"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium mb-1">
          <QrCode className="w-4 h-4" />
          <span>Scan with your phone</span>
        </div>
        {data.instructions && (
          <p className="text-xs text-muted-foreground">
            {data.instructions}
          </p>
        )}
      </div>
    </Card>
  );
}