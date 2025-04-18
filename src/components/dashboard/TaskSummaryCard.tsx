import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatus } from '@/types';

interface TaskSummaryCardProps {
  title: string;
  count: number;
  status?: TaskStatus;
  total?: number;
  isLoading: boolean;
}

export function TaskSummaryCard({ title, count, status, total = 0, isLoading }: TaskSummaryCardProps) {
  // Calculate percentage if status and total are provided
  const percentage = status && total > 0 ? Math.round((count / Math.max(total, 1)) * 100) : null;

  // Get the appropriate status class
  let statusClass = '';
  if (status) {
    statusClass = `status-${status.toLowerCase().replace(/_/g, '-')}`;
  }

  return (
    <Card className="overflow-hidden border-border hover:shadow-card-hover transition-shadow duration-200">
      <CardHeader className="pb-2 bg-card">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-14 bg-muted animate-pulse rounded"></div>
              {percentage !== null && (
                <div className="h-6 w-12 bg-muted animate-pulse rounded-full"></div>
              )}
            </div>
          ) : (
            <>
              <span className="text-3xl font-bold mr-2">{count}</span>
              {percentage !== null && (
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusClass}`}>
                  {percentage}%
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
