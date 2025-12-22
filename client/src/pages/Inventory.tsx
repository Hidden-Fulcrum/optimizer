import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Package, Plus, AlertCircle, Home, Settings as SettingsIcon } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export default function Inventory() {
  const { data: items = [], isLoading } = trpc.inventory.list.useQuery();
  const [countDialogOpen, setCountDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState("");
  
  const utils = trpc.useUtils();
  const countMutation = trpc.inventory.count.useMutation({
    onSuccess: () => {
      toast.success("Inventory count updated successfully");
      utils.inventory.list.invalidate();
      setCountDialogOpen(false);
      setNewQuantity("");
    },
    onError: (error) => {
      toast.error(`Failed to update inventory: ${error.message}`);
    },
  });
  
  const handleCountInventory = (item: any) => {
    setSelectedItem(item);
    setNewQuantity(item.currentQuantity);
    setCountDialogOpen(true);
  };
  
  const handleSaveCount = () => {
    if (!selectedItem || !newQuantity) return;
    countMutation.mutate({
      inventoryItemId: selectedItem.id,
      countedQuantity: parseFloat(newQuantity),
      countedBy: "Nick Panos",
      notes: "Manual count",
    });
  };

  const getLowStockBadge = (current: string, min: string) => {
    const currentQty = parseFloat(current);
    const minQty = parseFloat(min);
    
    if (currentQty < minQty) {
      return (
        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
          <AlertCircle className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
        In Stock
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Navigation Bar */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold">Meal Prep Optimizer</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <SettingsIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Track ingredient stock levels and count inventory</p>
            </div>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 animate-pulse mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading inventory...</p>
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No Inventory Items Yet</h3>
              <p className="text-muted-foreground mt-2">
                Start tracking your ingredients to manage stock levels and costs
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-600" />
                        {item.name}
                      </CardTitle>
                      <CardDescription className="mt-2 capitalize">{item.category}</CardDescription>
                    </div>
                    <div>
                      {getLowStockBadge(item.currentQuantity, item.minThreshold)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Current Stock</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground">
                        {item.currentQuantity} <span className="text-sm font-normal">{item.unit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Minimum Threshold</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground">
                        {item.minThreshold} <span className="text-sm font-normal">{item.unit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Unit</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground">
                        {item.unit}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full md:w-auto"
                        onClick={() => handleCountInventory(item)}
                      >
                        Count Inventory
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Inventory Insights Coming Soon</CardTitle>
              <CardDescription>
                We're analyzing your inventory data to provide cost tracking and usage insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  <p className="text-xl font-bold">Coming Soon</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-xl font-bold">Coming Soon</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Depletion Rate</p>
                  <p className="text-xl font-bold">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Count Inventory Dialog */}
      <Dialog open={countDialogOpen} onOpenChange={setCountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Count Inventory</DialogTitle>
            <DialogDescription>
              Update the current quantity for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">New Quantity ({selectedItem?.unit})</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Enter new quantity"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Current: {selectedItem?.currentQuantity} {selectedItem?.unit}</p>
              <p>Minimum: {selectedItem?.minThreshold} {selectedItem?.unit}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCount} disabled={countMutation.isPending}>
              {countMutation.isPending ? "Saving..." : "Save Count"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
