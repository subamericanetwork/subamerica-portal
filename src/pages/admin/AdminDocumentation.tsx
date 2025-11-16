import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BookOpen } from "lucide-react";

const AdminDocumentation = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold">Platform Documentation</h1>
            <p className="text-muted-foreground mt-1">Complete technical documentation for Subamerica</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>Introduction to the Subamerica platform architecture</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <h2>What is Subamerica?</h2>
                <p>Subamerica is a comprehensive music & media platform designed for underground artists to showcase their work, connect with fans, and monetize their content.</p>
                
                <h3>Core Technology Stack</h3>
                <ul>
                  <li><strong>Frontend:</strong> React 18, TypeScript, Vite, Tailwind CSS</li>
                  <li><strong>Backend:</strong> Supabase (PostgreSQL, Edge Functions)</li>
                  <li><strong>Authentication:</strong> Supabase Auth with JWT</li>
                  <li><strong>Storage:</strong> Supabase Storage (Cloudinary for video processing)</li>
                  <li><strong>Payments:</strong> Stripe</li>
                  <li><strong>Live Streaming:</strong> Livepush API</li>
                </ul>

                <h3>Key Features</h3>
                <ul>
                  <li>Artist Portals with custom domains</li>
                  <li>Live streaming with mobile & desktop support</li>
                  <li>Video & audio content management</li>
                  <li>Social media integration (TikTok, Instagram, YouTube)</li>
                  <li>E-commerce (merch, events, tips)</li>
                  <li>Content moderation system</li>
                  <li>Analytics & insights</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <ScrollArea className="h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Documentation</CardTitle>
                  <CardDescription>Detailed feature documentation and implementation guides</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none space-y-8">
                  <section>
                    <h2>Artist Management</h2>
                    <h3>Artist Applications</h3>
                    <p>Artists apply through the /become-artist page. Applications are reviewed by admins who can approve/reject with notes.</p>
                    <h4>Approval Process:</h4>
                    <pre className="bg-muted p-4 rounded"><code>{`-- Function: approve_artist_application
-- Creates artist record, assigns role, sets up port_settings
-- Handles slug conflicts by appending numbers`}</code></pre>
                  </section>

                  <section>
                    <h2>Live Streaming</h2>
                    <h3>Streaming Tiers</h3>
                    <ul>
                      <li><strong>Signal (Free):</strong> No streaming access</li>
                      <li><strong>Trident ($10/mo):</strong> 600 minutes/month included</li>
                    </ul>
                    <h4>Streaming Providers:</h4>
                    <ul>
                      <li><strong>Livepush:</strong> Managed streaming through our API</li>
                      <li><strong>Own Account:</strong> Artists use their own Mux/Cloudinary credentials</li>
                    </ul>
                  </section>

                  <section>
                    <h2>Content Moderation</h2>
                    <h3>Moderation Queue</h3>
                    <p>Content (videos, posts, products) enters moderation queue unless artist is verified.</p>
                    <h4>Auto-Approval:</h4>
                    <pre className="bg-muted p-4 rounded"><code>{`-- Verified artists bypass moderation
SELECT should_auto_approve_content(artist_id)`}</code></pre>
                  </section>

                  <section>
                    <h2>Monetization</h2>
                    <h3>Revenue Streams</h3>
                    <ul>
                      <li><strong>Tips:</strong> Fans can tip artists (80% to artist)</li>
                      <li><strong>Merch:</strong> Printify integration for POD products</li>
                      <li><strong>Events:</strong> Ticket sales with Stripe integration</li>
                      <li><strong>Subscriptions:</strong> Future feature for fan subscriptions</li>
                    </ul>
                  </section>

                  <section>
                    <h2>Social Media Integration</h2>
                    <h3>Supported Platforms</h3>
                    <ul>
                      <li>TikTok (OAuth + publishing)</li>
                      <li>Instagram (OAuth + publishing)</li>
                      <li>YouTube (OAuth + publishing)</li>
                    </ul>
                    <h4>Scheduled Publishing:</h4>
                    <p>Artists can schedule posts across platforms. Cron job processes scheduled posts every minute.</p>
                  </section>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="database">
            <ScrollArea className="h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>Database Schema</CardTitle>
                  <CardDescription>Complete database structure and relationships</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none space-y-6">
                  <section>
                    <h2>Core Tables</h2>
                    
                    <h3>artists</h3>
                    <pre className="bg-muted p-4 rounded text-xs overflow-x-auto"><code>{`CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio_short TEXT,
  bio_long TEXT,
  scene TEXT,
  subscription_tier subscription_tier DEFAULT 'signal',
  streaming_minutes_included INT DEFAULT 0,
  streaming_minutes_used INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);`}</code></pre>

                    <h3>videos</h3>
                    <pre className="bg-muted p-4 rounded text-xs overflow-x-auto"><code>{`CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumb_url TEXT,
  duration INT,
  moderation_status TEXT DEFAULT 'pending',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);`}</code></pre>

                    <h3>artist_live_streams</h3>
                    <pre className="bg-muted p-4 rounded text-xs overflow-x-auto"><code>{`CREATE TABLE artist_live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  rtmp_ingest_url TEXT NOT NULL,
  stream_key TEXT NOT NULL,
  hls_playback_url TEXT,
  provider TEXT DEFAULT 'livepush',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);`}</code></pre>
                  </section>

                  <section>
                    <h2>Row Level Security (RLS)</h2>
                    <h3>Key Policies</h3>
                    <ul>
                      <li><strong>Artists:</strong> Users can read all, update own</li>
                      <li><strong>Videos:</strong> Public read (published only), artist update own</li>
                      <li><strong>Streams:</strong> Artist CRUD own, public read (live only)</li>
                      <li><strong>Products:</strong> Public read, artist CRUD own</li>
                    </ul>
                  </section>

                  <section>
                    <h2>Database Functions</h2>
                    <h3>has_role(user_id, role)</h3>
                    <p>Security definer function to check user roles without RLS recursion.</p>
                    
                    <h3>approve_artist_application()</h3>
                    <p>Creates artist record, assigns role, handles slug conflicts.</p>
                    
                    <h3>can_start_stream(artist_id)</h3>
                    <p>Checks tier and remaining minutes before allowing stream start.</p>
                  </section>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="api">
            <ScrollArea className="h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>Edge Functions and external API integrations</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none space-y-6">
                  <section>
                    <h2>Edge Functions</h2>
                    <p>Base URL: <code>https://hxzjhhsvssqrjlmbeokn.supabase.co/functions/v1</code></p>

                    <h3>Payment Functions</h3>
                    <h4>create-tip-payment</h4>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`POST /create-tip-payment
Body: {
  artistId: string,
  amount: number,
  currency: string,
  message?: string
}
Returns: { sessionId: string, url: string }`}</code></pre>

                    <h4>purchase-streaming-time</h4>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`POST /purchase-streaming-time
Body: {
  artistId: string,
  minutes: number
}
Returns: { sessionId: string, url: string }`}</code></pre>

                    <h3>Live Streaming Functions</h3>
                    <h4>livepush-api</h4>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`POST /livepush-api
Body: {
  action: 'create-live-stream' | 'end-stream' | 'sync-video',
  artistId: string,
  streamId?: string,
  videoId?: string
}
Returns: varies by action`}</code></pre>

                    <h3>Social Media Functions</h3>
                    <h4>publish-to-tiktok</h4>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`POST /publish-to-tiktok
Body: {
  artistId: string,
  videoUrl: string,
  caption: string,
  privacy: 'public' | 'friends' | 'private'
}
Returns: { success: boolean, postId?: string }`}</code></pre>

                    <h4>process-scheduled-posts</h4>
                    <p>Cron job (runs every minute) that processes scheduled social media posts.</p>
                  </section>

                  <section>
                    <h2>External APIs</h2>
                    
                    <h3>Livepush</h3>
                    <ul>
                      <li>Base URL: <code>https://api.livepush.io</code></li>
                      <li>Auth: Client ID + Secret (Basic Auth)</li>
                      <li>Endpoints: /streams, /videos, /playlists</li>
                    </ul>

                    <h3>Stripe</h3>
                    <ul>
                      <li>Checkout Sessions for all payments</li>
                      <li>Webhooks for payment confirmations</li>
                      <li>Products & Prices for events/merch</li>
                    </ul>

                    <h3>Cloudinary</h3>
                    <ul>
                      <li>Video upload & processing</li>
                      <li>Image transformations</li>
                      <li>VOD storage for stream recordings</li>
                    </ul>
                  </section>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="troubleshooting">
            <ScrollArea className="h-[600px]">
              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting Guide</CardTitle>
                  <CardDescription>Common issues and their solutions</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none space-y-6">
                  <section>
                    <h2>Authentication Issues</h2>
                    
                    <h3>Session Not Found</h3>
                    <p><strong>Symptom:</strong> User logged out unexpectedly</p>
                    <p><strong>Solution:</strong></p>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`// Check session
const { data: { session } } = await supabase.auth.getSession();

// Refresh session if expired
const { data: { session: newSession } } = await supabase.auth.refreshSession();`}</code></pre>

                    <h3>RLS Policy Blocks Insert</h3>
                    <p><strong>Error:</strong> "new row violates row-level security policy"</p>
                    <p><strong>Solution:</strong> Ensure user_id is set in INSERT and user is authenticated:</p>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`const { data, error } = await supabase
  .from('videos')
  .insert({ 
    artist_id: artistId,
    user_id: user.id,  // Required!
    title: 'My Video'
  });`}</code></pre>
                  </section>

                  <section>
                    <h2>Streaming Issues</h2>
                    
                    <h3>Stream Won't Start</h3>
                    <p><strong>Checklist:</strong></p>
                    <ul>
                      <li>Artist has Trident subscription?</li>
                      <li>Artist has remaining minutes?</li>
                      <li>RTMP credentials valid?</li>
                      <li>Livepush API accessible?</li>
                    </ul>

                    <h3>Stream Buffering</h3>
                    <p><strong>Common causes:</strong></p>
                    <ul>
                      <li>Bitrate too high for upload speed</li>
                      <li>Recommended: 2500-4000 kbps for 1080p</li>
                      <li>Check OBS settings: CBR encoding, keyframe interval 2s</li>
                    </ul>
                  </section>

                  <section>
                    <h2>Payment Issues</h2>
                    
                    <h3>Webhook Not Received</h3>
                    <p><strong>Debug steps:</strong></p>
                    <ol>
                      <li>Check Stripe webhook logs</li>
                      <li>Verify webhook secret in Supabase secrets</li>
                      <li>Test webhook locally with Stripe CLI</li>
                    </ol>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`}</code></pre>
                  </section>

                  <section>
                    <h2>Database Issues</h2>
                    
                    <h3>Query Performance</h3>
                    <p><strong>Slow queries?</strong> Check indexes:</p>
                    <pre className="bg-muted p-4 rounded text-xs"><code>{`-- Common indexes
CREATE INDEX idx_videos_artist_id ON videos(artist_id);
CREATE INDEX idx_videos_published ON videos(published_at) 
  WHERE moderation_status = 'approved';
CREATE INDEX idx_streams_status ON artist_live_streams(status);`}</code></pre>

                    <h3>Connection Pooling</h3>
                    <p>If hitting connection limits, enable Supavisor in project settings.</p>
                  </section>

                  <section>
                    <h2>Getting Help</h2>
                    <ul>
                      <li><strong>Logs:</strong> Check Supabase Edge Function logs</li>
                      <li><strong>Database:</strong> Use Supabase SQL Editor</li>
                      <li><strong>Support:</strong> Email support@subamerica.com</li>
                    </ul>
                  </section>
                </CardContent>
              </Card>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDocumentation;
