import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StreamOverlayManager } from "./admin/StreamOverlayManager";

interface StreamOverlayDialogProps {
  open: boolean;
  onClose: () => void;
  streamId: string;
  streamTitle: string;
}

export function StreamOverlayDialog({ open, onClose, streamId, streamTitle }: StreamOverlayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Overlays - {streamTitle}</DialogTitle>
        </DialogHeader>
        <StreamOverlayManager streamId={streamId} />
      </DialogContent>
    </Dialog>
  );
}
