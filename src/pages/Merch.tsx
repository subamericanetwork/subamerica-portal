import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Eye, EyeOff, ShoppingBag, Trash2, Pencil, ImageIcon, Info } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Merch = () => {
  const { artist, products, surfaceProducts, loading } = useArtistData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    price: "",
    pitch: "",
    description: "",
    link: "",
    payment_type: "external" as "external" | "stripe",
    currency: "usd",
  });

  const resetForm = () => {
    setFormData({ 
      title: "", 
      type: "", 
      price: "", 
      pitch: "", 
      description: "", 
      link: "",
      payment_type: "external",
      currency: "usd"
    });
    setImageFile(null);
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      type: product.type,
      price: product.price?.toString() || "",
      pitch: product.pitch || "",
      description: product.description || "",
      link: product.link || "",
      payment_type: product.payment_type || "external",
      currency: product.currency || "usd",
    });
    setIsDialogOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist) return;

    setIsSubmitting(true);

    try {
      // Upload image if provided
      let imageUrl = editingProduct?.images?.[0] || null;
      if (imageFile) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          toast.error("User not authenticated");
          setIsSubmitting(false);
          return;
        }

        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${userData.user.id}/products/${crypto.randomUUID()}.${fileExt}`;

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

        imageUrl = publicUrl;
      }

      // Create Stripe product and price if payment type is Stripe
      let stripePriceId = editingProduct?.stripe_price_id || null;
      if (formData.payment_type === "stripe" && !editingProduct) {
        const priceAmount = parseFloat(formData.price);

        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          "create-stripe-event-product",
          {
            body: {
              productName: formData.title,
              productDescription: formData.description || `${formData.type} - ${formData.title}`,
              priceAmount: Math.round(priceAmount * 100), // Convert to cents
              priceCurrency: formData.currency,
            },
          }
        );

        if (stripeError) {
          console.error("Stripe error:", stripeError);
          toast.error(`Failed to create Stripe price: ${stripeError.message}`);
          setIsSubmitting(false);
          return;
        }

        if (!stripeData?.price_id) {
          toast.error("Failed to create Stripe price: No price ID returned");
          setIsSubmitting(false);
          return;
        }

        stripePriceId = stripeData.price_id;
        console.log("Created Stripe price:", stripePriceId);
      }

      const productData = {
        artist_id: artist.id,
        title: formData.title,
        type: formData.type,
        price: parseFloat(formData.price),
        pitch: formData.pitch || null,
        description: formData.description || null,
        link: formData.link,
        images: imageUrl ? [imageUrl] : null,
        is_surface: editingProduct?.is_surface || false,
        payment_type: formData.payment_type,
        stripe_price_id: stripePriceId,
        currency: formData.currency,
      };

      let error;
      if (editingProduct) {
        const result = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("products")
          .insert(productData);
        error = result.error;
      }

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(editingProduct ? "Product updated successfully!" : "Product added successfully!");
        resetForm();
        setIsDialogOpen(false);
        window.location.reload();
      }
    } catch (error) {
      toast.error(editingProduct ? "Failed to update product" : "Failed to create product");
    }

    setIsSubmitting(false);
  };

  const handleToggleSurface = async (productId: string, currentStatus: boolean) => {
    if (!currentStatus && surfaceProducts.length >= 6) {
      toast.error("Maximum 6 products can be surfaced");
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({ is_surface: !currentStatus })
      .eq("id", productId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(currentStatus ? "Removed from surface" : "Added to surface!");
      window.location.reload();
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product deleted successfully!");
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

  const surfaceCount = surfaceProducts.length;

  return (
    <DashboardLayout>
      <TooltipProvider>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Merch</h1>
            <p className="text-muted-foreground mt-1">
              Select up to 6 items to surface on your Port
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Update product details" : "Add a new merch item to your catalog"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Product Image {editingProduct && "(optional - leave blank to keep current)"}</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">Accepts PNG, JPEG, WebP, and GIF</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Product Name</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Tour Tee"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="Apparel"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ({formData.currency.toUpperCase()})</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="28.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toLowerCase() })}
                    placeholder="usd"
                    maxLength={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground">3-letter currency code (e.g., usd, eur, gbp)</p>
                </div>
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <RadioGroup
                    value={formData.payment_type}
                    onValueChange={(value: "external" | "stripe") => setFormData({ ...formData, payment_type: value })}
                    disabled={!!editingProduct}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="external" id="external" />
                      <Label htmlFor="external" className="font-normal cursor-pointer">
                        External Link (you handle payments)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="font-normal cursor-pointer">
                        Stripe (integrated checkout)
                      </Label>
                    </div>
                  </RadioGroup>
                  {editingProduct && (
                    <p className="text-xs text-muted-foreground">Payment type cannot be changed after creation</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product..."
                    rows={3}
                  />
                </div>
                {formData.payment_type === "external" && (
                  <div className="space-y-2">
                    <Label htmlFor="link">Product Link</Label>
                    <Input
                      id="link"
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://your-store.com/product"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Where customers can purchase this product</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="pitch">Pitch (optional)</Label>
                  <Input
                    id="pitch"
                    value={formData.pitch}
                    onChange={(e) => setFormData({ ...formData, pitch: e.target.value })}
                    placeholder="Limited run tee"
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting 
                      ? (editingProduct ? "Updating..." : "Adding...") 
                      : (editingProduct ? "Update Product" : "Add Product")
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
            <div className="space-y-1">
              <p><strong>What is "Surface"?</strong> Only products marked as "Surface" appear on your Port. You can add unlimited products but only 6 can be surfaced at once.</p>
              <p><strong>Why 6 items?</strong> This limit ensures your Port stays focused on your best merchandise without overwhelming visitors.</p>
              <p><strong>Tips:</strong> Add clear product images and descriptions. Link to your store for purchases. Toggle the eye icon to surface/unsurface items.</p>
            </div>
          </AlertDescription>
        </Alert>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Currently Surfaced</h3>
                <p className="text-sm text-muted-foreground">
                  Items visible on your public Port page
                </p>
              </div>
              <Badge variant={surfaceCount >= 6 ? "destructive" : "outline"}>
                {surfaceCount} / 6
              </Badge>
            </div>
          </CardContent>
        </Card>

        {products.length === 0 ? (
          <Card className="gradient-card">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No merch yet</h3>
              <p className="text-muted-foreground mb-4">Add your first product to get started</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="gradient-card overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{product.title}</h3>
                      {product.is_surface && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                          <Eye className="h-3 w-3 mr-1" />
                          Surface
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{product.type}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">${product.price}</span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {product.is_surface ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSurface(product.id, product.is_surface!)}
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove from Port</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={surfaceCount >= 6}
                            onClick={() => handleToggleSurface(product.id, product.is_surface!)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{surfaceCount >= 6 ? "Maximum 6 items can be surfaced" : "Add to Port"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default Merch;
