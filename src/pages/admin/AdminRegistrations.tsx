import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Shield, Calendar, Search } from "lucide-react";
import { format, differenceInDays, subDays } from "date-fns";

interface Artist {
  id: string;
  created_at: string;
  email: string;
  display_name: string;
  slug: string;
  subscription_tier: 'free' | 'basic' | 'premium';
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminRegistrations = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      // Fetch all artists
      const { data: artistsData, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .order("created_at", { ascending: false });

      if (artistsError) throw artistsError;
      setArtists((artistsData || []) as Artist[]);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;
      setUserRoles((rolesData || []) as UserRole[]);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if user is admin
  const isUserAdmin = (userId: string) => {
    return userRoles.some(role => role.user_id === userId && role.role === 'admin');
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = artists.filter(a => 
      differenceInDays(now, new Date(a.created_at)) <= 7
    ).length;
    const last30Days = artists.filter(a => 
      differenceInDays(now, new Date(a.created_at)) <= 30
    ).length;
    const adminCount = artists.filter(a => isUserAdmin(a.id)).length;

    return {
      total: artists.length,
      last7Days,
      last30Days,
      adminCount
    };
  }, [artists, userRoles]);

  // Filter artists based on search and filters
  const filteredArtists = useMemo(() => {
    let filtered = [...artists];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(artist => 
        artist.email.toLowerCase().includes(term) ||
        artist.display_name.toLowerCase().includes(term) ||
        artist.slug.toLowerCase().includes(term)
      );
    }

    // Tier filter
    if (tierFilter !== "all") {
      filtered = filtered.filter(artist => artist.subscription_tier === tierFilter);
    }

    // Role filter
    if (roleFilter === "admin") {
      filtered = filtered.filter(artist => isUserAdmin(artist.id));
    } else if (roleFilter === "artists") {
      filtered = filtered.filter(artist => !isUserAdmin(artist.id));
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const days = dateFilter === "7" ? 7 : dateFilter === "30" ? 30 : 90;
      const cutoffDate = subDays(now, days);
      filtered = filtered.filter(artist => 
        new Date(artist.created_at) >= cutoffDate
      );
    }

    return filtered;
  }, [artists, searchTerm, tierFilter, roleFilter, dateFilter, userRoles]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return (
          <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
            Premium
          </Badge>
        );
      case 'basic':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            Basic
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Free
          </Badge>
        );
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
        <div>
          <h1 className="text-3xl font-bold">User Registrations</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all registered users and their subscription status
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last7Days}</div>
              <p className="text-xs text-muted-foreground mt-1">
                New registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last30Days}</div>
              <p className="text-xs text-muted-foreground mt-1">
                New registrations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.adminCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Admin users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                  <SelectItem value="artists">Artists Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Users ({filteredArtists.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredArtists.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registered</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Days Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArtists.map((artist) => {
                      const daysActive = differenceInDays(new Date(), new Date(artist.created_at));
                      const isAdmin = isUserAdmin(artist.id);

                      return (
                        <TableRow key={artist.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(artist.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {artist.display_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {artist.email}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            @{artist.slug}
                          </TableCell>
                          <TableCell>
                            {getTierBadge(artist.subscription_tier)}
                          </TableCell>
                          <TableCell>
                            {isAdmin ? (
                              <Badge variant="default">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline">Artist</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {daysActive} {daysActive === 1 ? 'day' : 'days'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminRegistrations;
