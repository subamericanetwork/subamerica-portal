import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Calendar, ExternalLink } from "lucide-react";

const Events = () => {
  const events = [
    {
      id: "1",
      title: "Secret Rooftop Session",
      date: "2025-10-13",
      time: "21:00",
      venue: "NYC, Online",
      hasTickets: true,
      ticketUrl: "https://example.com/tickets",
      posterUrl: "/placeholder.svg",
    },
    {
      id: "2",
      title: "Underground Showcase",
      date: "2025-11-01",
      time: "20:00",
      venue: "Brooklyn Warehouse",
      hasTickets: true,
      ticketUrl: "https://example.com/tickets",
      posterUrl: "/placeholder.svg",
    },
    {
      id: "3",
      title: "Live Stream Premiere",
      date: "2025-11-15",
      time: "19:00",
      venue: "Online",
      hasTickets: false,
      ticketUrl: "",
      posterUrl: "/placeholder.svg",
    },
  ];

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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="gradient-card hover:border-primary/30 transition-smooth">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-xl">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                          <span>at {event.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {event.hasTickets && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Tickets Available
                        </Badge>
                      )}
                      {event.venue.toLowerCase().includes("online") && (
                        <Badge variant="outline">Livestream</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Edit Event
                      </Button>
                      {event.hasTickets && (
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Tickets
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Events;
