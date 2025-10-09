import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Eye, EyeOff, ShoppingBag, Trash2 } from "lucide-react";
import { useArtistData } from "@/hooks/useArtistData";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Merch = () => {
  const { artist, products, surfaceProducts, loading } = useArtistData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    price: "",
    pitch: "",
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from("products")
      .insert({
        artist_id: artist.id,
        title: formData.title,
        type: formData.type,
        price: parseFloat(formData.price),
        pitch: formData.pitch,
        is_surface: false,
      });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Product added successfully!");
      setFormData({ title: "", type: "", price: "", pitch: "" });
      setIsDialogOpen(false);
      window.location.reload();
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
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Merch</h1>
            <p className="text-muted-foreground mt-1">
              Select up to 6 items to surface on your Port
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
                <DialogDescription>
                  Add a new merch item to your catalog
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProduct} className="space-y-4">
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
                  <Label htmlFor="price">Price ($)</Label>
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
                    {isSubmitting ? "Adding..." : "Add Product"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Surface Limit</h3>
                <p className="text-sm text-muted-foreground">
                  Only items marked as "Surface" will appear on your Port page
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
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
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
                  </div>

                  <div className="flex gap-2">
                    {product.is_surface ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleSurface(product.id, product.is_surface!)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={surfaceCount >= 6}
                        onClick={() => handleToggleSurface(product.id, product.is_surface!)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
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
    </DashboardLayout>
  );
};

export default Merch;
