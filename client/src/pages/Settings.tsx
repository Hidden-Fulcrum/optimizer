import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, LogOut, User } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

type MealIngredients = {
  chickenOz?: string;
  beefOz?: string;
  pastaGrams?: string;
  riceCups?: string;
  potatoOz?: string;
};

export default function Settings() {
  const { data: meals, isLoading: mealsLoading, refetch: refetchMeals } = trpc.mealItems.list.useQuery();
  const { userName, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    setLocation('/');
  };
  
  const updateMealMutation = trpc.mealItems.updateIngredients.useMutation();

  const [editedMeals, setEditedMeals] = useState<{ [key: number]: MealIngredients }>({});

  useEffect(() => {
    if (meals) {
      const initial: { [key: number]: MealIngredients } = {};
      meals.forEach((meal: any) => {
        initial[meal.id] = {
          chickenOz: meal.chickenOz || "0",
          beefOz: meal.beefOz || "0",
          pastaGrams: meal.pastaGrams || "0",
          riceCups: meal.riceCups || "0",
          potatoOz: meal.potatoOz || "0",
        };
      });
      setEditedMeals(initial);
    }
  }, [meals]);

  const handleMealInputChange = (mealId: number, field: keyof MealIngredients, value: string) => {
    setEditedMeals(prev => ({
      ...prev,
      [mealId]: {
        ...prev[mealId],
        [field]: value
      }
    }));
  };

  const handleSaveMeal = async (mealId: number) => {
    const edited = editedMeals[mealId];
    if (!edited) return;

    try {
      await updateMealMutation.mutateAsync({
        id: mealId,
        chickenOz: edited.chickenOz ? parseFloat(edited.chickenOz) : undefined,
        beefOz: edited.beefOz ? parseFloat(edited.beefOz) : undefined,
        pastaGrams: edited.pastaGrams ? parseFloat(edited.pastaGrams) : undefined,
        riceCups: edited.riceCups ? parseFloat(edited.riceCups) : undefined,
        potatoOz: edited.potatoOz ? parseFloat(edited.potatoOz) : undefined,
      });
      toast.success("Ingredient quantities updated successfully");
      refetchMeals();
    } catch (error) {
      toast.error("Failed to update ingredient quantities");
    }
  };

  // Helper to determine which ingredient fields to show per meal
  const getIngredientFields = (meal: any) => {
    const fields: Array<{ key: keyof MealIngredients; label: string; unit: string }> = [];
    
    // Chicken items
    if (meal.category === 'chicken') {
      fields.push({ key: 'chickenOz', label: 'Chicken', unit: 'oz (uncooked)' });
    }
    
    // Beef items
    if (meal.category === 'beef') {
      fields.push({ key: 'beefOz', label: 'Beef', unit: 'oz (uncooked)' });
    }
    
    // Pasta items
    if (meal.name.includes('Alfredo') || meal.name.includes('Parmesan')) {
      fields.push({ key: 'pastaGrams', label: 'Pasta', unit: 'grams (uncooked)' });
    }
    
    // Rice items
    if (meal.name.includes('Taco') || meal.name.includes('Birria')) {
      fields.push({ key: 'riceCups', label: 'Rice', unit: 'cups (uncooked)' });
    }
    
    // Potato items
    if (meal.name.includes('Burger')) {
      fields.push({ key: 'potatoOz', label: 'Potato', unit: 'oz (uncooked)' });
    }
    
    return fields;
  };

  if (mealsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container py-8">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Configure ingredient quantities per meal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6 sm:py-8 px-4 space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
            <CardDescription>
              Your account information and session management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <p className="text-lg font-medium mt-1">{userName || 'Not logged in'}</p>
            </div>
            <div>
              <Label>PIN</Label>
              <p className="text-sm text-muted-foreground mt-1">••••</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>

        {/* Ingredient Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredient Quantities per Meal</CardTitle>
            <CardDescription>
              Configure how much of each ingredient goes into each meal item. These values are used in time formula calculations.
              All weights are <strong>uncooked</strong> measurements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {meals?.map((meal: any) => {
              const fields = getIngredientFields(meal);
              if (fields.length === 0) return null;

              return (
                <div key={meal.id} className="border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-base sm:text-lg">{meal.name}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {fields.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${field.key}-${meal.id}`}>{field.label} ({field.unit})</Label>
                        <Input
                          id={`${field.key}-${meal.id}`}
                          type="number"
                          step="0.01"
                          value={editedMeals[meal.id]?.[field.key] || "0"}
                          onChange={(e) => handleMealInputChange(meal.id, field.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => handleSaveMeal(meal.id)}
                    disabled={updateMealMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    Save
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
