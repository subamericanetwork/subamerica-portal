import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bell, Heart, Star, ArrowRight } from 'lucide-react';

interface CTABuilderProps {
  onUpdate: (data: {
    message: string;
    button_text: string;
    button_color?: string;
    icon?: string;
  }) => void;
  initialData?: {
    message?: string;
    button_text?: string;
    button_color?: string;
    icon?: string;
  };
}

const ICONS = [
  { value: 'bell', label: 'Bell', icon: Bell },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'arrow', label: 'Arrow', icon: ArrowRight },
];

export function CTABuilder({ onUpdate, initialData }: CTABuilderProps) {
  const [message, setMessage] = useState(initialData?.message || '');
  const [buttonText, setButtonText] = useState(initialData?.button_text || '');
  const [buttonColor, setButtonColor] = useState(initialData?.button_color || '#FF6B6B');
  const [icon, setIcon] = useState(initialData?.icon || 'arrow');

  const handleChange = () => {
    onUpdate({
      message,
      button_text: buttonText,
      button_color: buttonColor,
      icon,
    });
  };

  const SelectedIcon = ICONS.find(i => i.value === icon)?.icon || ArrowRight;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cta-message">Message</Label>
        <Textarea
          id="cta-message"
          placeholder="e.g., Join our exclusive community!"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleChange();
          }}
          onBlur={handleChange}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cta-button-text">Button Text</Label>
        <Input
          id="cta-button-text"
          placeholder="e.g., Sign Up Now"
          value={buttonText}
          onChange={(e) => {
            setButtonText(e.target.value);
            handleChange();
          }}
          onBlur={handleChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cta-icon">Icon</Label>
          <Select value={icon} onValueChange={(value) => {
            setIcon(value);
            setTimeout(handleChange, 0);
          }}>
            <SelectTrigger id="cta-icon">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICONS.map(({ value, label, icon: Icon }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cta-button-color">Button Color</Label>
          <div className="flex gap-2">
            <Input
              id="cta-button-color"
              type="color"
              value={buttonColor}
              onChange={(e) => {
                setButtonColor(e.target.value);
                handleChange();
              }}
              onBlur={handleChange}
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={buttonColor}
              onChange={(e) => {
                setButtonColor(e.target.value);
                handleChange();
              }}
              onBlur={handleChange}
              placeholder="#FF6B6B"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Preview</Label>
        <div className="border rounded-lg p-4 bg-muted/50">
          <p className="text-sm mb-3 text-center">{message || 'Your message here'}</p>
          <Button
            className="w-full"
            style={{ backgroundColor: buttonColor }}
          >
            <SelectedIcon className="h-4 w-4 mr-2" />
            {buttonText || 'Button Text'}
          </Button>
        </div>
      </div>
    </div>
  );
}
