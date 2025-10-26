import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Users, Shield, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

type UserRole = 'admin' | 'artist' | 'moderator' | 'production_manager' | 'fan' | 'member';

type RoleLevel = 'member' | 'artist' | 'verified_artist' | 'admin';

interface UserData {
  user_id: string;
  display_name: string;
  email: string;
  created_at: string;
  roles: UserRole[];
  artist_id: string | null;
  is_verified: boolean | null;
  slug: string | null;
}

const AdminMembership = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newRoleLevel, setNewRoleLevel] = useState<RoleLevel>('member');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch all artists
      const { data: artists, error: artistsError } = await supabase
        .from('artists')
        .select('user_id, id, is_verified, slug');

      if (artistsError) throw artistsError;

      // Combine data
      const userData: UserData[] = profiles?.map(profile => {
        const userRoles = roles?.filter(r => r.user_id === profile.user_id).map(r => r.role as UserRole) || [];
        const artistData = artists?.find(a => a.user_id === profile.user_id);
        
        return {
          user_id: profile.user_id,
          display_name: profile.display_name || 'Unknown',
          email: profile.email || '',
          created_at: profile.created_at,
          roles: userRoles,
          artist_id: artistData?.id || null,
          is_verified: artistData?.is_verified || null,
          slug: artistData?.slug || null,
        };
      }) || [];

      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => {
        switch (roleFilter) {
          case 'members':
            return u.roles.includes('member') && !u.roles.includes('artist');
          case 'artists':
            return u.roles.includes('artist') && !u.is_verified;
          case 'verified':
            return u.roles.includes('artist') && u.is_verified;
          case 'admins':
            return u.roles.includes('admin');
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const getCurrentRoleLevel = (userData: UserData): RoleLevel => {
    if (userData.roles.includes('admin')) return 'admin';
    if (userData.is_verified) return 'verified_artist';
    if (userData.roles.includes('artist')) return 'artist';
    return 'member';
  };

  const handleEditRoles = (userData: UserData) => {
    setSelectedUser(userData);
    setNewRoleLevel(getCurrentRoleLevel(userData));
    setShowRoleDialog(true);
  };

  const handleRoleChange = () => {
    if (!selectedUser) return;

    // Prevent self-lockout
    if (selectedUser.user_id === user?.id && newRoleLevel !== 'admin') {
      toast.error("You cannot remove your own admin role");
      return;
    }

    setShowRoleDialog(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      setShowConfirmDialog(false);

      // Determine new roles based on role level
      let newRoles: UserRole[] = ['member'];
      let needsArtistProfile = false;
      let setVerified = false;

      switch (newRoleLevel) {
        case 'admin':
          newRoles = ['member', 'artist', 'admin'];
          needsArtistProfile = true;
          break;
        case 'verified_artist':
          newRoles = ['member', 'artist'];
          needsArtistProfile = true;
          setVerified = true;
          break;
        case 'artist':
          newRoles = ['member', 'artist'];
          needsArtistProfile = true;
          break;
        case 'member':
          newRoles = ['member'];
          break;
      }

      // Create artist profile if needed and doesn't exist
      if (needsArtistProfile && !selectedUser.artist_id) {
        const slug = generateSlug(selectedUser.display_name);
        
        const { error: artistError } = await supabase
          .from('artists')
          .insert({
            user_id: selectedUser.user_id,
            email: selectedUser.email,
            display_name: selectedUser.display_name,
            slug: slug,
            subscription_tier: 'free',
            is_verified: setVerified,
          });

        if (artistError) {
          console.error('Error creating artist profile:', artistError);
          toast.error('Failed to create artist profile');
          setUpdating(false);
          return;
        }
      }

      // Update artist verification if needed
      if (needsArtistProfile && selectedUser.artist_id) {
        const { error: verifyError } = await supabase
          .from('artists')
          .update({ is_verified: setVerified })
          .eq('user_id', selectedUser.user_id);

        if (verifyError) {
          console.error('Error updating verification:', verifyError);
          toast.error('Failed to update verification status');
          setUpdating(false);
          return;
        }
      }

      // Delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (deleteError) {
        console.error('Error deleting roles:', deleteError);
        toast.error('Failed to update roles');
        setUpdating(false);
        return;
      }

      // Insert new roles
      const rolesToInsert = newRoles.map(role => ({
        user_id: selectedUser.user_id,
        role: role,
        granted_by: user?.id,
      }));

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);

      if (insertError) {
        console.error('Error inserting roles:', insertError);
        toast.error('Failed to assign new roles');
        setUpdating(false);
        return;
      }

      toast.success(`Successfully updated ${selectedUser.display_name}'s role`);
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error('An error occurred while updating roles');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'artist':
        return 'default';
      case 'member':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const totalArtists = users.filter(u => u.roles.includes('artist')).length;
  const verifiedArtists = users.filter(u => u.is_verified).length;
  const totalAdmins = users.filter(u => u.roles.includes('admin')).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Membership Management</h1>
        <p className="text-muted-foreground">
          Manage user roles and permissions across the platform
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Artists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArtists}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Artists</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedArtists}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdmins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Search and filter users to manage their roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:max-w-sm"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="members">Members Only</SelectItem>
                <SelectItem value="artists">Artists</SelectItem>
                <SelectItem value="verified">Verified Artists</SelectItem>
                <SelectItem value="admins">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userData) => (
                      <TableRow key={userData.user_id}>
                        <TableCell className="font-medium">{userData.display_name}</TableCell>
                        <TableCell>{userData.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userData.roles.map((role) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role)}>
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {userData.is_verified && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(userData.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRoles(userData)}
                          >
                            Edit Roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Selection Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role level for {selectedUser?.display_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Roles:</label>
              <div className="flex flex-wrap gap-2">
                {selectedUser?.roles.map((role) => (
                  <Badge key={role} variant={getRoleBadgeVariant(role)}>
                    {role}
                  </Badge>
                ))}
                {selectedUser?.is_verified && (
                  <Badge variant="default" className="bg-green-600">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Role Level:</label>
              <Select value={newRoleLevel} onValueChange={(value) => setNewRoleLevel(value as RoleLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member (base)</SelectItem>
                  <SelectItem value="artist">Artist (+ member)</SelectItem>
                  <SelectItem value="verified_artist">Verified Artist (+ member + verified)</SelectItem>
                  <SelectItem value="admin">Admin (full access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newRoleLevel !== 'member' && !selectedUser?.artist_id && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                This will create an artist profile for this user
              </div>
            )}

            {newRoleLevel === 'admin' && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
                This will grant full admin access to all features
              </div>
            )}

            {selectedUser?.user_id === user?.id && newRoleLevel !== 'admin' && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200">
                ⚠️ You cannot remove your own admin role
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {selectedUser?.display_name}'s role to{' '}
              <span className="font-semibold">{newRoleLevel.replace('_', ' ')}</span>?
              This action will update their permissions immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRoleChange} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMembership;
