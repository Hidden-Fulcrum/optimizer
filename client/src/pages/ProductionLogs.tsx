import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function ProductionLogs() {
  const { data: logs = [], isLoading } = trpc.productionLogs.list.useQuery();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
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

  const getVarianceBadge = (estimated: number, actual: number) => {
    const diff = actual - estimated;
    const percentDiff = ((diff / estimated) * 100).toFixed(0);
    
    if (Math.abs(diff) < 5) {
      return (
        <Badge variant="outline" className="gap-1">
          <Minus className="h-3 w-3" />
          On target
        </Badge>
      );
    } else if (diff < 0) {
      return (
        <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
          <TrendingDown className="h-3 w-3" />
          {Math.abs(parseInt(percentDiff))}% faster
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
          <TrendingUp className="h-3 w-3" />
          {percentDiff}% slower
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Production Logs</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Track actual vs estimated production times</p>
            </div>
          </div>
          <Link href="/optimizer" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              New Production Run
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading production logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No Production Logs Yet</h3>
              <p className="text-muted-foreground mt-2">
                Start tracking your production runs to build historical data and insights
              </p>
              <Link href="/optimizer">
                <Button className="mt-4">
                  Create First Log
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="secondary" className="mr-2">
                          #{log.runNumber || log.id}
                        </Badge>
                        <Calendar className="h-5 w-5" />
                        {formatDate(log.productionDate)}
                      </CardTitle>
                      {log.notes && (
                        <CardDescription className="mt-2">{log.notes}</CardDescription>
                      )}
                    </div>
                    {log.totalWallClockMinutes && log.totalEstimatedMinutes && (
                      <div>
                        {getVarianceBadge(log.totalEstimatedMinutes, log.totalWallClockMinutes)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Estimated Time</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground">
                        {log.totalEstimatedMinutes ? formatDuration(log.totalEstimatedMinutes) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Actual Time</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground">
                        {log.totalWallClockMinutes ? formatDuration(log.totalWallClockMinutes) : 'In Progress'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Variance</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground">
                        {log.totalWallClockMinutes && log.totalEstimatedMinutes
                          ? formatDuration(Math.abs(log.totalWallClockMinutes - log.totalEstimatedMinutes))
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <Link href={`/production-log/${log.id}`} className="w-full md:w-auto">
                        <Button variant="outline" size="sm" className="w-full md:w-auto">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {logs.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Insights Coming Soon</CardTitle>
              <CardDescription>
                We're analyzing your production data to provide smart insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Average Accuracy</p>
                  <p className="text-xl font-bold">Coming Soon</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Most Variable Task</p>
                  <p className="text-xl font-bold">Coming Soon</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Suggested Adjustments</p>
                  <p className="text-xl font-bold">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
