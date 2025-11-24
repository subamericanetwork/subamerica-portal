import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, CheckCircle, XCircle, Music, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioTrack {
  id: string;
  title: string;
  duration: number | null;
  status: string;
  moderation_status: string;
  created_at: string;
  tags: string[] | null;
  artists: {
    display_name: string;
    slug: string;
  };
}

interface Artist {
  id: string;
  display_name: string;
  slug: string;
}

interface FileUpload {
  file: File;
  title: string;
  duration: number;
  description: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const AdminAudio = () => {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [artistFilter, setArtistFilter] = useState('all');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [tags, setTags] = useState('');
  const [autoPublish, setAutoPublish] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tracksRes, artistsRes] = await Promise.all([
        supabase
          .from('audio_tracks')
          .select('id, title, duration, status, moderation_status, created_at, tags, artist_id, artists!audio_tracks_artist_id_fkey(display_name, slug)')
          .order('created_at', { ascending: false }),
        supabase
          .from('artists')
          .select('id, display_name, slug')
          .order('display_name')
      ]);

      if (tracksRes.error) throw tracksRes.error;
      if (artistsRes.error) throw artistsRes.error;

      setTracks(tracksRes.data || []);
      setArtists(artistsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: FileUpload[] = await Promise.all(
      selectedFiles.map(async (file) => {
        const duration = await getAudioDuration(file);
        return {
          file,
          title: file.name.replace(/\.[^/.]+$/, ''),
          duration,
          description: '',
          progress: 0,
          status: 'pending' as const
        };
      })
    );

    setFiles(prev => [...prev, ...newFiles]);
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration));
      });
      audio.addEventListener('error', () => {
        resolve(0);
      });
      audio.src = URL.createObjectURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileMetadata = (index: number, field: keyof FileUpload, value: string) => {
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const handleBulkUpload = async () => {
    if (!selectedArtist) {
      toast({
        title: "Error",
        description: "Please select an artist",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('artist_id', selectedArtist);
      formData.append('auto_publish', autoPublish.toString());
      formData.append('tags', tags);

      files.forEach((fileUpload, index) => {
        formData.append(`file_${index}`, fileUpload.file);
        formData.append(`title_${index}`, fileUpload.title);
        formData.append(`duration_${index}`, fileUpload.duration.toString());
        formData.append(`description_${index}`, fileUpload.description);
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-bulk-upload-audio`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      toast({
        title: "Upload Complete",
        description: `${result.successful} of ${result.total} files uploaded successfully`,
      });

      // Update file statuses based on results
      setFiles(prev => prev.map((file, index) => ({
        ...file,
        status: result.results[index]?.success ? 'success' : 'error',
        error: result.results[index]?.error,
        progress: 100
      })));

      // Refresh tracks list
      fetchData();

      // Clear successful uploads after 3 seconds
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status !== 'success'));
      }, 3000);

    } catch (error) {
      console.error('Bulk upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artists?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArtist = artistFilter === 'all' || track.artists?.slug === artistFilter;
    return matchesSearch && matchesArtist;
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      published: { variant: 'default', label: 'Published' },
      draft: { variant: 'secondary', label: 'Draft' },
      archived: { variant: 'destructive', label: 'Archived' },
    };
    
    const config = configs[status] || configs.draft;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Audio Management</h1>
        </div>

        {/* Bulk Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bulk Upload Audio Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="artist-select">Select Artist *</Label>
                <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                  <SelectTrigger id="artist-select">
                    <SelectValue placeholder="Choose artist" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists.map(artist => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. hip-hop, 2024, remix"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-publish"
                checked={autoPublish}
                onCheckedChange={(checked) => setAutoPublish(checked as boolean)}
              />
              <Label htmlFor="auto-publish" className="cursor-pointer">
                Auto-publish tracks (make visible immediately)
              </Label>
            </div>

            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Input
                type="file"
                accept="audio/mpeg,audio/wav,audio/m4a,audio/flac"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <Label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">
                  MP3, WAV, M4A, FLAC (max 10MB per file)
                </span>
              </Label>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Files to Upload ({files.length})</h3>
                {files.map((file, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            <span className="font-medium truncate">{file.file.name}</span>
                            {file.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {file.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                          </div>
                          {file.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        {file.status === 'error' && file.error && (
                          <p className="text-sm text-destructive">{file.error}</p>
                        )}

                        {file.status === 'pending' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input
                              placeholder="Title"
                              value={file.title}
                              onChange={(e) => updateFileMetadata(index, 'title', e.target.value)}
                            />
                            <Input
                              placeholder="Duration (seconds)"
                              type="number"
                              value={file.duration}
                              onChange={(e) => updateFileMetadata(index, 'duration', e.target.value)}
                            />
                            <Textarea
                              placeholder="Description (optional)"
                              value={file.description}
                              onChange={(e) => updateFileMetadata(index, 'description', e.target.value)}
                              className="md:col-span-2"
                              rows={2}
                            />
                          </div>
                        )}

                        {file.progress > 0 && file.status === 'uploading' && (
                          <Progress value={file.progress} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  onClick={handleBulkUpload}
                  disabled={uploading || !selectedArtist}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {files.length} File{files.length !== 1 ? 's' : ''} to Cloudinary
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio Tracks List */}
        <Card>
          <CardHeader>
            <CardTitle>All Audio Tracks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or artist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={artistFilter} onValueChange={setArtistFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by artist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Artists</SelectItem>
                  {artists.map(artist => (
                    <SelectItem key={artist.slug} value={artist.slug}>
                      {artist.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {filteredTracks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No audio tracks found</p>
              ) : (
                filteredTracks.map(track => (
                  <Card key={track.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{track.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {track.artists?.display_name} • {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </p>
                          {track.tags && track.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {track.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(track.status)}
                          <Badge variant={track.moderation_status === 'approved' ? 'default' : 'secondary'}>
                            {track.moderation_status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAudio;
