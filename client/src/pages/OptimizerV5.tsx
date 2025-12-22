import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calculator, Clock, Save, Zap, User, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface MealQuantities {
  [key: string]: number;
}

interface TaskTimes {
  [key: string]: number;
}

interface WorkflowStep {
  stepNumber: number;
  taskName: string;
  duration: number;
  startTime: number;
  endTime: number;
  taskType: 'active' | 'passive';
  equipment?: string;
  details?: string;
  concurrentWith?: string[];
}

export default function OptimizerV5() {
  const [mealQuantities, setMealQuantities] = useState<MealQuantities>({});
  const [taskTimes, setTaskTimes] = useState<TaskTimes>({});
  const [blastChillerCapacity, setBlastChillerCapacity] = useState(5);
  const [proteinPerTray, setProteinPerTray] = useState(7);
  const [workflow, setWorkflow] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [actualTimes, setActualTimes] = useState<{ [key: number]: number }>({});
  const [wallClockTime, setWallClockTime] = useState<number>(0);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [logNotes, setLogNotes] = useState("");

  const { data: mealItems = [] } = trpc.mealItems.list.useQuery();
  const { data: taskTemplates = [] } = trpc.taskTemplates.list.useQuery();
  const optimizeMutation = trpc.optimize.calculate.useMutation();
  const saveScenarioMutation = trpc.scenarios.create.useMutation();
  const createProductionLogMutation = trpc.productionLogs.create.useMutation();

  useEffect(() => {
    const initialQuantities: MealQuantities = {};
    mealItems.forEach(item => {
      initialQuantities[item.id] = 0;
    });
    setMealQuantities(initialQuantities);
  }, [mealItems]);

  useEffect(() => {
    const initialTimes: TaskTimes = {};
    taskTemplates.forEach(template => {
      initialTimes[template.id] = template.defaultDurationMinutes;
    });
    setTaskTimes(initialTimes);
  }, [taskTemplates]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
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

    try {
      const scenarioItems = mealItems
        .filter(item => mealQuantities[item.id] > 0)
        .map(item => ({
          mealItemId: item.id,
          quantity: mealQuantities[item.id],
        }));

      await saveScenarioMutation.mutateAsync({
        name: scenarioName,
        description: scenarioDescription,
        items: scenarioItems,
        totalEstimatedMinutes: workflow?.totalTime || 0,
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

  const handleLogProduction = async () => {
    if (!workflow) return;

    try {
      const tasks = workflow.steps.map((step: WorkflowStep, index: number) => ({
        taskType: step.taskType,
        taskName: step.taskName,
        estimatedMinutes: step.duration,
        actualMinutes: actualTimes[index],
      }));

      await createProductionLogMutation.mutateAsync({
        totalEstimatedMinutes: workflow.totalTime,
        totalWallClockMinutes: wallClockTime || undefined,
        notes: logNotes,
        tasks,
      });

      toast.success("Production logged successfully!");
      setShowLogDialog(false);
      setActualTimes({});
      setWallClockTime(0);
      setLogNotes("");
    } catch (error) {
      toast.error("Failed to log production");
      console.error(error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins} min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Workflow Optimizer</h1>
            </div>
          </div>
          <Link href="/scenarios">
            <Button variant="outline" size="sm" className="sm:size-default">
              <span className="hidden sm:inline">View Scenarios</span>
              <span className="sm:hidden">Scenarios</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Production Quantities */}
            <Card>
              <CardHeader>
                <CardTitle>Production Quantities</CardTitle>
                <CardDescription>Enter the number of each meal type to produce</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mealItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <Label htmlFor={`meal-${item.id}`} className="text-base">
                      {item.name}
                    </Label>
                    <Input
                      id={`meal-${item.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={mealQuantities[item.id] || ""}
                      onFocus={(e) => {
                        if (e.target.value === "0") {
                          setMealQuantities(prev => ({ ...prev, [item.id]: 0 }));
                          e.target.value = "";
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                        setMealQuantities(prev => ({ ...prev, [item.id]: value }));
                      }}
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
                {taskTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between">
                    <Label htmlFor={`task-${template.id}`} className="text-base">
                      {template.name}
                    </Label>
                    <Input
                      id={`task-${template.id}`}
                      type="number"
                      min="1"
                      placeholder={template.defaultDurationMinutes.toString()}
                      value={taskTimes[template.id] || ""}
                      onFocus={(e) => {
                        // Clear the field on focus so user can type directly
                        e.target.select();
                      }}
                      onChange={(e) => {
                        const value = e.target.value === "" ? template.defaultDurationMinutes : parseInt(e.target.value) || template.defaultDurationMinutes;
                        setTaskTimes(prev => ({ ...prev, [template.id]: value }));
                      }}
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
                <>
                  <Button 
                    onClick={() => setShowSaveDialog(true)}
                    variant="outline"
                    size="lg"
                  >
                    <Save className="mr-2 h-5 w-5" />
                    Save
                  </Button>
                  <Button 
                    onClick={() => setShowLogDialog(true)}
                    variant="default"
                    size="lg"
                  >
                    <Clock className="mr-2 h-5 w-5" />
                    Log Production
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-6">
            {workflow ? (
              <>
                <Card className="border-2 border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Total Production Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl sm:text-4xl font-bold text-primary">
                      {formatDuration(workflow.totalTime)}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Meals</p>
                        <p className="font-semibold">{workflow.totalMeals}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Protein Batches</p>
                        <p className="font-semibold">{workflow.proteinBatches}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Worker Active Time</p>
                        <p className="font-semibold text-green-600">{formatDuration(workflow.workerActiveTime)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Equipment Running Time</p>
                        <p className="font-semibold text-blue-600">{formatDuration(workflow.equipmentRunningTime)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment Capacity Warnings */}
                {workflow.equipmentWarnings && workflow.equipmentWarnings.length > 0 && (
                  <Card className="border-2 border-amber-500 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                        Equipment Capacity Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {workflow.equipmentWarnings.map((warning: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-amber-700">
                            <span className="text-amber-500 mt-0.5">⚠️</span>
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-amber-600 mt-3">Consider splitting this production run into multiple batches or upgrading equipment capacity in Settings.</p>
                    </CardContent>
                  </Card>
                )}

                {/* Concurrent Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Concurrent Workflow Timeline</CardTitle>
                    <CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          <User className="h-3 w-3 mr-1" />
                          Active (you're working)
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          <Zap className="h-3 w-3 mr-1" />
                          Passive (equipment running)
                        </Badge>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workflow.steps.map((step: WorkflowStep, index: number) => (
                        <div key={step.stepNumber} className="relative">
                          {index > 0 && (
                            <div className="absolute left-4 -top-2 w-0.5 h-4 bg-border" />
                          )}
                          <div className="flex gap-3 sm:gap-4">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                              step.taskType === 'active' ? 'bg-green-600' : 'bg-blue-600'
                            } text-white flex items-center justify-center text-sm font-semibold`}>
                              {step.stepNumber}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-1 gap-1 sm:gap-0">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                  <h4 className="text-sm sm:text-base font-semibold text-foreground">{step.taskName}</h4>
                                  <Badge variant="outline" className={
                                    step.taskType === 'active' 
                                      ? 'bg-green-50 text-green-700 border-green-300' 
                                      : 'bg-blue-50 text-blue-700 border-blue-300'
                                  }>
                                    {step.taskType === 'active' ? (
                                      <><User className="h-3 w-3 mr-1" />Active</>
                                    ) : (
                                      <><Zap className="h-3 w-3 mr-1" />Passive</>
                                    )}
                                  </Badge>
                                </div>
                                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                  {formatDuration(step.duration)}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {formatTime(step.startTime)} → {formatTime(step.endTime)}
                              </p>
                              {step.details && (
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{step.details}</p>
                              )}
                              {step.equipment && (
                                <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs sm:text-sm rounded-full">
                                  {step.equipment}
                                </span>
                              )}
                              {step.concurrentWith && step.concurrentWith.length > 0 && (
                                <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                                  <p className="text-sm font-semibold text-amber-700 mb-2">🔄 Running concurrently with:</p>
                                  <ul className="space-y-1">
                                    {step.concurrentWith.map((concurrent: string, idx: number) => (
                                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span>{concurrent}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
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
                    Enter your production quantities and task times, then click Calculate Workflow to see your optimized concurrent timeline.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Production Scenario</DialogTitle>
            <DialogDescription>
              Save this production plan for future reference
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                placeholder="e.g., Weekly Production - 200 meals"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="scenario-description">Description (optional)</Label>
              <Input
                id="scenario-description"
                placeholder="Add notes about this scenario"
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

      {/* Production Log Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Production Run</DialogTitle>
            <DialogDescription>
              Enter actual completion times for each task to track performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="text-sm font-semibold">Estimated Total Time: {workflow && formatDuration(workflow.totalTime)}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      if (endTime) {
                        const start = new Date(e.target.value);
                        const end = new Date(endTime);
                        const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                        setWallClockTime(diffMinutes > 0 ? diffMinutes : 0);
                      }
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-sm font-medium">
                    End Time
                  </Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      if (startTime) {
                        const start = new Date(startTime);
                        const end = new Date(e.target.value);
                        const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                        setWallClockTime(diffMinutes > 0 ? diffMinutes : 0);
                      }
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="wall-clock-time" className="text-sm font-medium whitespace-nowrap">
                  Total Wall-Clock Time (min):
                </Label>
                <Input
                  id="wall-clock-time"
                  type="number"
                  min="0"
                  value={wallClockTime || ''}
                  onChange={(e) => setWallClockTime(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="Auto-calculated or enter manually"
                  className="max-w-xs"
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter start and end times to auto-calculate duration, or enter wall-clock time manually. Individual task times below help identify bottlenecks.</p>
            </div>
            
            <div className="space-y-3">
              {workflow?.steps.map((step: WorkflowStep, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{step.taskName}</p>
                    <p className="text-sm text-muted-foreground">
                      Estimated: {step.duration} min
                      {step.taskType === 'active' && (
                        <Badge variant="outline" className="ml-2">Active</Badge>
                      )}
                      {step.taskType === 'passive' && (
                        <Badge variant="outline" className="ml-2 text-blue-600 border-blue-600">Passive</Badge>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`actual-${index}`} className="text-sm whitespace-nowrap">
                      Actual (min):
                    </Label>
                    <Input
                      id={`actual-${index}`}
                      type="number"
                      min="0"
                      placeholder={step.duration.toString()}
                      value={actualTimes[index] || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                        setActualTimes(prev => ({ ...prev, [index]: value }));
                      }}
                      className="w-24"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor="log-notes">Notes (optional)</Label>
              <Input
                id="log-notes"
                placeholder="Add any observations or notes about this production run"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogProduction}>
              Save Production Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
