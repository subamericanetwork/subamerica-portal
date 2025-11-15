import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { QRCodeSVG } from 'qrcode.react';

interface QRBuilderProps {
  onUpdate: (data: {
    destination_url: string;
    instructions?: string;
    qr_code_data?: string;
  }) => void;
  initialData?: {
    destination_url?: string;
    instructions?: string;
  };
}

export function QRBuilder({ onUpdate, initialData }: QRBuilderProps) {
  const [url, setUrl] = useState(initialData?.destination_url || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || 'Scan with your phone');
  const [size, setSize] = useState(200);

  const handleChange = () => {
    onUpdate({
      destination_url: url,
      instructions,
      qr_code_data: url, // Store the URL as QR code data
    });
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="qr-url">Destination URL *</Label>
        <Input
          id="qr-url"
          type="url"
          placeholder="https://your-link.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            handleChange();
          }}
          onBlur={handleChange}
        />
        {url && !isValidUrl(url) && (
          <p className="text-xs text-destructive">Please enter a valid URL</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="qr-instructions">Instructions</Label>
        <Textarea
          id="qr-instructions"
          placeholder="e.g., Scan to get exclusive merch"
          value={instructions}
          onChange={(e) => {
            setInstructions(e.target.value);
            handleChange();
          }}
          onBlur={handleChange}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>QR Code Size</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[size]}
            onValueChange={(value) => setSize(value[0])}
            min={150}
            max={300}
            step={10}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-16">{size}px</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="border rounded-lg p-6 bg-muted/50 flex flex-col items-center">
          {url && isValidUrl(url) ? (
            <>
              <div className="bg-white p-3 rounded-lg mb-3">
                <QRCodeSVG
                  value={url}
                  size={size}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm font-medium text-center">{instructions}</p>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Enter a valid URL to see QR code preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
