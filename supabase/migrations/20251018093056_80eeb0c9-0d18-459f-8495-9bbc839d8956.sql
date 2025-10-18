-- Create orders table for tracking Printify product purchases
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  stripe_session_id TEXT NOT NULL UNIQUE,
  artist_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_variant TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  printify_product_id TEXT,
  fulfillment_status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  shipping_carrier TEXT,
  admin_email_sent BOOLEAN DEFAULT false,
  customer_email_sent BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Artists can view their own orders
CREATE POLICY "Artists can view their own orders" 
ON public.orders 
FOR SELECT 
USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- Policy: Service role can insert orders
CREATE POLICY "Service role can insert orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Policy: Artists can update fulfillment status
CREATE POLICY "Artists can update their orders" 
ON public.orders 
FOR UPDATE 
USING (artist_id IN (SELECT id FROM public.artists WHERE user_id = auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_orders_artist_id ON public.orders(artist_id);
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);