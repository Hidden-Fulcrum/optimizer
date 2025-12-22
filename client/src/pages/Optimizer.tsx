import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calculator, Clock, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MealQuantities {
  [key: string]: number;
}

interface TaskTimes {
  [key: string]: number;
}

export default function Optimizer() {
  const [mealQuantities, setMealQuantities] = useState<MealQuantities>({});
  const [taskTimes, setTaskTimes] = useState<TaskTimes>({});
  const [blastChillerCapacity, setBlastChillerCapacity] = useState(5);
  const [proteinPerTray, setProteinPerTray] = useState(7);
  const [workflow, setWorkflow] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");

  const { data: mealItems = [] } = trpc.mealItems.list.useQuery();
  const { data: taskTemplates = [] } = trpc.taskTemplates.list.useQuery();
  const optimizeMutation = trpc.optimize.calculate.useMutation();
  const saveScenarioMutation = trpc.scenarios.create.useMutation();

  useEffect(() => {
    // Initialize meal quantities
    const initialQuantities: MealQuantities = {};
    mealItems.forEach(item => {
      initialQuantities[item.id] = 0;
    });
    setMealQuantities(initialQuantities);
  }, [mealItems]);

  useEffect(() => {
    // Initialize task times with defaults
    const initialTimes: TaskTimes = {};
    taskTemplates.forEach(template => {
      initialTimes[template.id] = template.defaultDurationMinutes;
    });
    setTaskTimes(initialTimes);
  }, [taskTemplates]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      // Prepare meals data
      const meals = mealItems
        .filter(item => mealQuantities[item.id] > 0)
        .map(item => ({
          mealItemId: item.id,
          name: item.name,
          quantity: mealQuantities[item.id],
          category: item.category,
          proteinType: item.proteinType,
          requiresProtein: item.requiresProtein === 1,
        }));

      if (meals.length === 0) {
        toast.error("Please enter at least one meal quantity");
        setIsCalculating(false);
        return;
      }

      // Prepare task estimates
      const taskEstimates = taskTemplates.map(template => ({
        taskType: template.taskType,
        name: template.name,
        durationMinutes: taskTimes[template.id] || template.defaultDurationMinutes,
        canRunInParallel: template.canRunInParallel === 1,
      }));

      const result = await optimizeMutation.mutateAsync({
        meals,
        taskEstimates,
        equipment: {
          blastChillerCapacity,
          proteinPerTray,
        },
      });

      setWorkflow(result);
      toast.success("Workflow optimized successfully!");
    } catch (error) {
      toast.error("Failed to calculate workflow");
      console.error(error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    if (!workflow) {
      toast.error("Please calculate a workflow first");
      return;
    }

    try {
      const items = mealItems
        .filter(item => mealQuantities[item.id] > 0)
        .map(item => ({
          mealItemId: item.id,
          quantity: mealQuantities[item.id],
        }));

      await saveScenarioMutation.mutateAsync({
        name: scenarioName,
        description: scenarioDescription,
        items,
        totalEstimatedMinutes: workflow.totalMinutes,
      });

      toast.success("Scenario saved successfully!");
      setShowSaveDialog(false);
      setScenarioName("");
      setScenarioDescription("");
    } catch (error) {
      toast.error("Failed to save scenario");
      console.error(error);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const getTaskColor = (taskType: string): string => {
    const colors: { [key: string]: string } = {
      grind_protein: "bg-purple-500",
      cook_protein: "bg-purple-600",
      blast_chill: "bg-blue-500",
      cook_rice_pasta: "bg-green-500",
      make_sauces: "bg-yellow-500",
      assemble_meals: "bg-orange-500",
      package_label: "bg-pink-500",
      bake_desserts: "bg-red-500",
    };
    return colors[taskType] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Workflow Optimizer</h1>
              </div>
            </div>
            <Link href="/scenarios">
              <Button variant="outline">View Scenarios</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Meal Quantities */}
            <Card>
              <CardHeader>
                <CardTitle>Production Quantities</CardTitle>
                <CardDescription>Enter the number of each meal type to produce</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mealItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <Label htmlFor={`meal-${item.id}`} className="text-base">
                      {item.name}
                    </Label>
                    <Input
                      id={`meal-${item.id}`}
                      type="number"
                      min="0"
                      value={mealQuantities[item.id] || ""}
                      onChange={(e) => setMealQuantities(prev => ({
                        ...prev,
                        [item.id]: parseInt(e.target.value) || 0
                      }))}
                      onFocus={(e) => {
                        if (mealQuantities[item.id] === 0) {
                          e.target.value = "";
                        }
                      }}
                      placeholder="0"
                      className="w-24"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Task Time Estimates */}
            <Card>
              <CardHeader>
                <CardTitle>Task Time Estimates</CardTitle>
                <CardDescription>Configure duration for each task (in minutes)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {taskTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between">
                    <Label htmlFor={`task-${template.id}`} className="text-base">
                      {template.name}
                    </Label>
                    <Input
                      id={`task-${template.id}`}
                      type="number"
                      min="0"
                      value={taskTimes[template.id] || template.defaultDurationMinutes}
                      onChange={(e) => setTaskTimes(prev => ({
                        ...prev,
                        [template.id]: parseInt(e.target.value) || template.defaultDurationMinutes
                      }))}
                      className="w-24"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Equipment Constraints */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Constraints</CardTitle>
                <CardDescription>Configure your kitchen equipment limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="blast-chiller" className="text-base">
                    Blast Chiller Capacity (trays)
                  </Label>
                  <Input
                    id="blast-chiller"
                    type="number"
                    min="1"
                    value={blastChillerCapacity}
                    onChange={(e) => setBlastChillerCapacity(parseInt(e.target.value) || 5)}
                    className="w-24"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="protein-per-tray" className="text-base">
                    Protein per Tray (lbs)
                  </Label>
                  <Input
                    id="protein-per-tray"
                    type="number"
                    min="1"
                    value={proteinPerTray}
                    onChange={(e) => setProteinPerTray(parseInt(e.target.value) || 7)}
                    className="w-24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={handleCalculate} 
                disabled={isCalculating}
                className="flex-1"
                size="lg"
              >
                <Calculator className="mr-2 h-5 w-5" />
                {isCalculating ? "Calculating..." : "Calculate Workflow"}
              </Button>
              {workflow && (
                <Button 
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  size="lg"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Save
                </Button>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-6">
            {workflow ? (
              <>
                {/* Summary Card */}
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Total Production Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">
                      {formatDuration(workflow.totalMinutes)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {workflow.tasks.length} tasks scheduled
                    </p>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Optimized Timeline</CardTitle>
                    <CardDescription>Follow these steps in order for maximum efficiency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workflow.tasks.map((task: any, index: number) => (
                        <div key={task.id} className="relative">
                          {index > 0 && (
                            <div className="absolute left-4 -top-2 w-0.5 h-4 bg-border" />
                          )}
                          <div className="flex gap-4">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getTaskColor(task.taskType)} text-white flex items-center justify-center text-sm font-semibold`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-semibold text-foreground">{task.name}</h4>
                                <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">
                                  {formatDuration(task.duration)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Start: {formatDuration(task.startTime)} • End: {formatDuration(task.endTime)}
                              </p>
                              {task.details && (
                                <p className="text-sm text-muted-foreground mt-1">{task.details}</p>
                              )}
                              {task.canRunInParallel && (
                                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  Can run in parallel
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Workflow Yet</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Enter your production quantities and task times, then click Calculate Workflow to see your optimized timeline.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Save Scenario Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Production Scenario</DialogTitle>
            <DialogDescription>
              Save this configuration to reuse later for similar production runs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                placeholder="e.g., Weekly Production - 100 meals"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario-description">Description (optional)</Label>
              <Input
                id="scenario-description"
                placeholder="Add notes about this scenario..."
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScenario}>
              Save Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
