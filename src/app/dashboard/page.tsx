'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-hooks';
import { TaskStatus, UserRole } from '@/types';
import Link from 'next/link';

// Types for task summary
type TaskSummary = {
  [key in TaskStatus]: number;
} & {
  total: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    [TaskStatus.NOT_STARTED]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.DONE]: 0,
    [TaskStatus.REJECTED]: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const isLead = user?.role === UserRole.LEAD;

  useEffect(() => {
    async function fetchTaskSummary() {
      try {
        const response = await fetch('/api/tasks/summary');
        if (response.ok) {
          const data = await response.json();
          setTaskSummary(data.summary);
        }
      } catch (error) {
        console.error('Error fetching task summary:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchTaskSummary();
    }
  }, [user]);

  const statusColorMap = {
    [TaskStatus.NOT_STARTED]: 'bg-gray-100 text-gray-800',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TaskStatus.DONE]: 'bg-green-100 text-green-800',
    [TaskStatus.REJECTED]: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {isLead && (
          <Link href="/dashboard/tasks/create">
            <Button>Create New Task</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                taskSummary.total
              )}
            </div>
          </CardContent>
        </Card>

        {Object.entries(statusColorMap).map(([status, colorClass]) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {status
                  .replace(/_/g, ' ')
                  .split(' ')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold mr-2">
                  {isLoading ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    taskSummary[status as TaskStatus]
                  )}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${colorClass}`}>
                  {isLoading ? (
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded-full"></div>
                  ) : (
                    `${Math.round(
                      (taskSummary[status as TaskStatus] / Math.max(taskSummary.total, 1)) * 100
                    )}%`
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-md animate-pulse"></div>
                ))}
              </div>
            ) : taskSummary.total === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No tasks found</p>
                {isLead && (
                  <Link href="/dashboard/tasks/create">
                    <Button variant="outline" className="mt-2">
                      Create your first task
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/dashboard/tasks" className="block">
                  <Button variant="outline" fullWidth>
                    View All Tasks
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-md animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/dashboard/activity" className="block">
                  <Button variant="outline" fullWidth>
                    View Activity Logs
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
