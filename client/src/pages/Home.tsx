import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Calculator, ClipboardList, Package, Settings as SettingsIcon, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold">Meal Prep Optimizer</h1>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="container py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold">Kitchen Workflow Dashboard</h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Plan production runs, track performance, and optimize your meal prep workflow
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/optimizer">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calculator className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Optimizer</CardTitle>
                  </div>
                  <CardDescription>
                    Calculate optimal workflow for your production run
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Start Optimizing
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/production-logs">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ClipboardList className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>Production Logs</CardTitle>
                  </div>
                  <CardDescription>
                    View and analyze past production runs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Logs
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/inventory">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Inventory</CardTitle>
                  </div>
                  <CardDescription>
                    Track ingredient stock levels and count inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Count Inventory
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
