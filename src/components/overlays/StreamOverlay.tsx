import { ProductOverlay } from "./ProductOverlay";
import { ContentOverlay } from "./ContentOverlay";
import { CTAOverlay } from "./CTAOverlay";
import { InfoOverlay } from "./InfoOverlay";
import { QROverlay } from "./QROverlay";

interface OverlayProps {
  overlay: {
    overlay_id: string;
    type: string;
    position: string;
    clickable: boolean;
    data: any;
    click_action: any;
  };
  onClose: () => void;
  onClick: () => void;
}

export function StreamOverlay({ overlay, onClose, onClick }: OverlayProps) {
  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      'banner': 'bottom-0 left-0 right-0'
    };
    return positions[overlay.position as keyof typeof positions] || 'bottom-right';
  };

  const renderOverlayContent = () => {
    switch (overlay.type) {
      case 'product':
        return <ProductOverlay data={overlay.data} clickAction={overlay.click_action} />;
      case 'content':
        return <ContentOverlay data={overlay.data} clickAction={overlay.click_action} />;
      case 'cta':
        return <CTAOverlay data={overlay.data} clickAction={overlay.click_action} />;
      case 'info':
        return <InfoOverlay data={overlay.data} clickAction={overlay.click_action} />;
      case 'qr':
        return <QROverlay data={overlay.data} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`absolute ${getPositionClasses()} pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500`}
      onClick={overlay.clickable ? onClick : undefined}
    >
      {renderOverlayContent()}
    </div>
  );
}