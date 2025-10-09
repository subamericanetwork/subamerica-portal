import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, EyeOff, ShoppingBag } from "lucide-react";

const Merch = () => {
  const products = [
    {
      id: "1",
      title: "Tour Tee",
      type: "Apparel",
      price: 28,
      isSurface: true,
      imageUrl: "/placeholder.svg",
    },
    {
      id: "2",
      title: "Vinyl LP - Lunar Static",
      type: "Music",
      price: 35,
      isSurface: true,
      imageUrl: "/placeholder.svg",
    },
    {
      id: "3",
      title: "Enamel Pin Set",
      type: "Accessories",
      price: 15,
      isSurface: true,
      imageUrl: "/placeholder.svg",
    },
    {
      id: "4",
      title: "Signed Poster",
      type: "Art",
      price: 20,
      isSurface: true,
      imageUrl: "/placeholder.svg",
    },
    {
      id: "5",
      title: "Hoodie - Black",
      type: "Apparel",
      price: 45,
      isSurface: false,
      imageUrl: "/placeholder.svg",
    },
  ];

  const surfaceCount = products.filter((p) => p.isSurface).length;

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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Surface Limit</span>
              <Badge variant={surfaceCount >= 6 ? "destructive" : "outline"}>
                {surfaceCount} / 6
              </Badge>
            </CardTitle>
            <CardDescription>
              Only items marked as "Surface" will appear on your Port page
            </CardDescription>
          </CardHeader>
        </Card>

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
                    {product.isSurface && (
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
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  {product.isSurface ? (
                    <Button variant="ghost" size="sm">
                      <EyeOff className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={surfaceCount >= 6}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Merch;
