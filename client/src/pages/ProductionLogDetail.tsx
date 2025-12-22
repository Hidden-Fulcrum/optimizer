import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, Edit2, Save, X, Trash2 } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProductionLogDetail() {
  const params = useParams();
  const logId = parseInt(params.id || "0");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTimes, setEditedTimes] = useState<{ [key: number]: number }>({});
  const [editedNotes, setEditedNotes] = useState("");
  const [editedWallClockTime, setEditedWallClockTime] = useState<number>(0);
  const [editedStartTime, setEditedStartTime] = useState("");
  const [editedEndTime, setEditedEndTime] = useState("");

  const [, setLocation] = useLocation();
  const { data: log, isLoading, refetch } = trpc.productionLogs.getById.useQuery({ id: logId });
  const updateMutation = trpc.productionLogs.update.useMutation();
  const deleteMutation = trpc.productionLogs.delete.useMutation();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleEdit = () => {
    if (log) {
      setIsEditing(true);
      setEditedNotes(log.log.notes || "");
      setEditedWallClockTime(log.log.totalWallClockMinutes || 0);
      
      // Format start and end times for datetime-local input
      if (log.log.startTime) {
        const start = new Date(log.log.startTime);
        setEditedStartTime(start.toISOString().slice(0, 16));
      }
      if (log.log.endTime) {
        const end = new Date(log.log.endTime);
        setEditedEndTime(end.toISOString().slice(0, 16));
      }
      
      const times: { [key: number]: number } = {};
      log.tasks.forEach((task) => {
        times[task.id] = task.actualMinutes || 0;
      });
      setEditedTimes(times);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTimes({});
    setEditedNotes("");
  };

  const handleSave = async () => {
    if (!log) return;

    try {
      const tasks = log.tasks.map((task) => ({
        id: task.id,
        actualMinutes: editedTimes[task.id] || task.actualMinutes || 0,
      }));

      await updateMutation.mutateAsync({
        id: logId,
        notes: editedNotes,
        totalWallClockMinutes: editedWallClockTime,
        tasks,
      });

      toast.success("Production log updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update production log");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: logId });
      toast.success("Production log deleted successfully!");
      setLocation("/production-logs");
    } catch (error) {
      toast.error("Failed to delete production log");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading production log...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold">Production Log Not Found</h3>
              <Link href="/production-logs">
                <Button className="mt-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Logs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Only use wall-clock time for actual total (not sum of tasks)
  const totalActual = log.log.totalWallClockMinutes || 0;
  const hasActualTime = log.log.totalWallClockMinutes && log.log.totalWallClockMinutes > 0;
  // Use concurrent workflow estimated time
  const totalEstimated = log.log.totalEstimatedMinutes || 0;
  const variance = hasActualTime ? totalActual - totalEstimated : 0;
  const variancePercent = hasActualTime && totalEstimated > 0 ? ((variance / totalEstimated) * 100).toFixed(1) : "0";

  // Power rank tasks by variance for insights
  const rankedTasks = [...log.tasks]
    .map(task => ({
      ...task,
      variance: (task.actualMinutes || 0) - task.estimatedMinutes,
      variancePercent: task.estimatedMinutes > 0 ? (((task.actualMinutes || 0) - task.estimatedMinutes) / task.estimatedMinutes * 100) : 0
    }))
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  const topBottlenecks = rankedTasks.filter(t => t.actualMinutes && t.actualMinutes > 0 && t.variance > 0).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/production-logs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Logs
            </Button>
          </Link>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button onClick={handleEdit} variant="outline">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Production Log?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this production log and all associated task data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatDate(log.log.productionDate)}
              </CardTitle>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Run #{log.log.runNumber || log.log.id}
              </Badge>
            </div>
            {!isEditing && log.log.notes && (
              <CardDescription>{log.log.notes}</CardDescription>
            )}
            {isEditing && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={editedStartTime}
                      onChange={(e) => {
                        setEditedStartTime(e.target.value);
                        if (editedEndTime) {
                          const start = new Date(e.target.value);
                          const end = new Date(editedEndTime);
                          const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                          setEditedWallClockTime(diffMinutes > 0 ? diffMinutes : 0);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={editedEndTime}
                      onChange={(e) => {
                        setEditedEndTime(e.target.value);
                        if (editedStartTime) {
                          const start = new Date(editedStartTime);
                          const end = new Date(e.target.value);
                          const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
                          setEditedWallClockTime(diffMinutes > 0 ? diffMinutes : 0);
                        }
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="wallClockTime">Total Wall-Clock Time (minutes)</Label>
                  <Input
                    id="wallClockTime"
                    type="number"
                    value={editedWallClockTime || ""}
                    onChange={(e) => setEditedWallClockTime(parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder="Auto-calculated or enter manually"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes about this production run"
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estimated Time</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatDuration(totalEstimated)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Concurrent workflow</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Actual Time</p>
                <p className="text-3xl font-bold text-foreground">
                  {hasActualTime ? formatDuration(totalActual) : 'In Progress'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{hasActualTime ? 'Wall-clock time' : 'Enter wall-clock time to complete'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Variance</p>
                <p className={`text-3xl font-bold ${!hasActualTime ? 'text-muted-foreground' : variance > 0 ? 'text-orange-600' : variance < 0 ? 'text-green-600' : 'text-foreground'}`}>
                  {hasActualTime ? (variance > 0 ? '+' : '') + formatDuration(Math.abs(variance)) : '--'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                <p className={`text-3xl font-bold ${!hasActualTime ? 'text-muted-foreground' : Math.abs(parseFloat(variancePercent)) < 10 ? 'text-green-600' : 'text-orange-600'}`}>
                  {hasActualTime ? (variance > 0 ? '+' : '') + variancePercent + '%' : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights Card */}
        {topBottlenecks.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Clock className="h-5 w-5" />
                Top Bottlenecks
              </CardTitle>
              <CardDescription>
                Tasks that took significantly longer than estimated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topBottlenecks.map((task, index) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{task.taskName}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.estimatedMinutes} min → {task.actualMinutes} min
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">+{formatDuration(task.variance)}</p>
                      <p className="text-sm text-muted-foreground">+{task.variancePercent.toFixed(0)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Details */}
        <Card>
          <CardHeader>
            <CardTitle>Task Breakdown</CardTitle>
            <CardDescription>
              Detailed time tracking for each production step (sorted by variance)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankedTasks.map((task) => {
                const taskVariance = task.variance;
                const taskVariancePercent = task.variancePercent.toFixed(0);
                const isBottleneck = taskVariance > 5; // More than 5 min over

                return (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{task.taskName}</p>
                        {task.taskType === 'active' && (
                          <Badge variant="outline">Active</Badge>
                        )}
                        {task.taskType === 'passive' && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">Passive</Badge>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Estimated: {task.estimatedMinutes} min</span>
                        {!isEditing && task.actualMinutes && (
                          <>
                            <span>Actual: {task.actualMinutes} min</span>
                            <span className={taskVariance > 0 ? 'text-orange-600' : taskVariance < 0 ? 'text-green-600' : ''}>
                              {taskVariance > 0 ? '+' : ''}{taskVariancePercent}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`task-${task.id}`} className="text-sm whitespace-nowrap">
                          Actual (min):
                        </Label>
                        <Input
                          id={`task-${task.id}`}
                          type="number"
                          min="0"
                          value={editedTimes[task.id] || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setEditedTimes(prev => ({ ...prev, [task.id]: value }));
                          }}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
