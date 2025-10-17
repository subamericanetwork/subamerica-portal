import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin, Calendar as CalendarIcon, ExternalLink, Trash2, ImageIcon, Pencil, Info } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Events = () => {
  const { artist, events, loading } = useArtistData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    venue: "",
    ticket_url: "",
    time: "20:00",
    description: "",
    ticket_type: "external" as "external" | "stripe",
    ticket_price: "",
    ticket_currency: "usd",
  });

  const resetForm = () => {
    setFormData({ 
      title: "", 
      venue: "", 
      ticket_url: "", 
      time: "20:00", 
      description: "",
      ticket_type: "external",
      ticket_price: "",
      ticket_currency: "usd",
    });
    setSelectedDate(undefined);
    setImageFile(null);
    setEditingEvent(null);
  };

  const handleEdit = (event: any) => {
    const eventDate = new Date(event.starts_at);
    setEditingEvent(event);
    setFormData({
      title: event.title,
      venue: event.venue || "",
      ticket_url: event.ticket_url || "",
      time: eventDate.toTimeString().slice(0, 5),
      description: event.description || "",
      ticket_type: event.ticket_type || "external",
      ticket_price: event.ticket_price?.toString() || "",
      ticket_currency: event.ticket_currency || "usd",
    });
    setSelectedDate(eventDate);
    setIsDialogOpen(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || !selectedDate) {
      toast.error("Please select a date");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image if provided
      let posterUrl = editingEvent?.poster_url || null;
      if (imageFile) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          toast.error("User not authenticated");
          setIsSubmitting(false);
          return;
        }

        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${userData.user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, imageFile);

        if (uploadError) {
          toast.error(`Image upload failed: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        posterUrl = publicUrl;
      }

      // Combine date and time
      const [hours, minutes] = formData.time.split(':');
      const eventDate = new Date(selectedDate);
      eventDate.setHours(parseInt(hours), parseInt(minutes));

      // Handle Stripe price creation if using Stripe ticketing
      let stripePriceId = editingEvent?.stripe_price_id || null;
      if (formData.ticket_type === "stripe" && formData.ticket_price) {
        const priceAmount = parseFloat(formData.ticket_price);
        if (isNaN(priceAmount) || priceAmount <= 0) {
          toast.error("Please enter a valid ticket price");
          setIsSubmitting(false);
          return;
        }

        // Create Stripe product and price
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          "create-stripe-product-and-price",
          {
            body: {
              product_name: `Ticket - ${formData.title}`,
              product_description: `Event ticket for ${formData.title}`,
              price_amount: Math.round(priceAmount * 100), // Convert to cents
              price_currency: formData.ticket_currency,
            },
          }
        );

        if (stripeError || !stripeData?.price_id) {
          toast.error("Failed to create Stripe price");
          setIsSubmitting(false);
          return;
        }

        stripePriceId = stripeData.price_id;
      }

      const eventData = {
        artist_id: artist.id,
        title: formData.title,
        venue: formData.venue,
        ticket_url: formData.ticket_type === "external" ? (formData.ticket_url || null) : null,
        description: formData.description || null,
        poster_url: posterUrl,
        starts_at: eventDate.toISOString(),
        ticket_type: formData.ticket_type,
        ticket_price: formData.ticket_type === "stripe" ? parseFloat(formData.ticket_price) : null,
        ticket_currency: formData.ticket_type === "stripe" ? formData.ticket_currency : null,
        stripe_price_id: stripePriceId,
      };

      let error;
      if (editingEvent) {
        const result = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEvent.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("events")
          .insert(eventData);
        error = result.error;
      }

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(editingEvent ? "Event updated successfully!" : "Event added successfully!");
        resetForm();
        setIsDialogOpen(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error(editingEvent ? "Failed to update event" : "Failed to create event");
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Event deleted successfully!");
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-1">
              Manage your upcoming shows and livestreams
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
                <DialogDescription>
                  {editingEvent ? "Update event details" : "Create a new event for your Port"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Secret Rooftop Session"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Brooklyn Warehouse / Online"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Label>Ticketing Method</Label>
                  <RadioGroup
                    value={formData.ticket_type}
                    onValueChange={(value: "external" | "stripe") => 
                      setFormData({ ...formData, ticket_type: value })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="external" id="external" />
                      <Label htmlFor="external" className="font-normal cursor-pointer">
                        External Link (Eventbrite, etc.)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="font-normal cursor-pointer">
                        Sell Tickets via Stripe
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.ticket_type === "external" && (
                  <div className="space-y-2">
                    <Label htmlFor="ticket_url">Ticket URL</Label>
                    <Input
                      id="ticket_url"
                      type="url"
                      value={formData.ticket_url}
                      onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
                      placeholder="https://tickets.example.com"
                    />
                  </div>
                )}

                {formData.ticket_type === "stripe" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ticket_price">Ticket Price</Label>
                      <Input
                        id="ticket_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.ticket_price}
                        onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                        placeholder="25.00"
                        required={formData.ticket_type === "stripe"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ticket_currency">Currency</Label>
                      <Select
                        value={formData.ticket_currency}
                        onValueChange={(value) => setFormData({ ...formData, ticket_currency: value })}
                      >
                        <SelectTrigger id="ticket_currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD ($)</SelectItem>
                          <SelectItem value="eur">EUR (€)</SelectItem>
                          <SelectItem value="gbp">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Event description and details..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Event Image (optional)</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">Accepts PNG, JPEG, WebP, and GIF</p>
                </div>
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting 
                      ? (editingEvent ? "Updating..." : "Adding...") 
                      : (editingEvent ? "Update Event" : "Add Event")
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p><strong>Promote Your Shows:</strong> Add event images, ticket links, and descriptions to make your events stand out. All upcoming events automatically appear on your Port.</p>
          </AlertDescription>
        </Alert>

        {events.length === 0 ? (
          <Card className="gradient-card">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-4">Add your first event to get started</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id} className="gradient-card hover:border-primary/30 transition-smooth">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 bg-muted rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {event.poster_url ? (
                        <img 
                          src={event.poster_url} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-xl">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{new Date(event.starts_at).toLocaleDateString()}</span>
                            <span>at {new Date(event.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.venue}</span>
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {event.ticket_type === "external" && event.ticket_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Tickets
                            </a>
                          </Button>
                        )}
                        {event.ticket_type === "stripe" && event.stripe_price_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const { data, error } = await supabase.functions.invoke(
                                "create-event-ticket-payment",
                                { body: { eventId: event.id } }
                              );
                              if (error) {
                                toast.error("Failed to create checkout");
                              } else if (data?.url) {
                                window.open(data.url, "_blank");
                              }
                            }}
                          >
                            Buy Tickets ${event.ticket_price}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(event)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Events;
