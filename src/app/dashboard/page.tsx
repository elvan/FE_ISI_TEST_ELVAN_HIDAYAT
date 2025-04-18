'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-hooks';
import { EntityType, LogAction, TaskStatus, UserRole } from '@/types';
import Link from 'next/link';

// Types for task summary
type TaskSummary = {
  [key in TaskStatus]: number;
} & {
  total: number;
};

// Types for tasks and activity logs
interface User {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
}

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  createdAt: string;
  createdBy: User;
  assignedTo: User | null;
}

interface ActivityLog {
  id: number;
  entityType: EntityType;
  entityId: number;
  action: LogAction;
  userId: number;
  details: any;
  createdAt: string;
  user: User;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    [TaskStatus.NOT_STARTED]: 0,
    [TaskStatus.IN_PROGRESS]: 0,
    [TaskStatus.DONE]: 0,
    [TaskStatus.REJECTED]: 0,
    total: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isLead = user?.role === UserRole.LEAD;

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        
        // Fetch task summary
        const summaryResponse = await fetch('/api/tasks/summary');
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setTaskSummary(summaryData.summary);
        }
        
        // Fetch recent tasks (limited to 5)
        const tasksResponse = await fetch('/api/tasks?limit=5');
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setRecentTasks(tasksData.tasks || []);
        }
        
        // Fetch recent activity (limited to 5)
        const activityResponse = await fetch('/api/activity-logs?limit=5');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.logs || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
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
            ) : recentTasks.length === 0 ? (
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
              <div className="space-y-4">
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <Link href={`/dashboard/tasks/${task.id}`} key={task.id}>
                      <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColorMap[task.status]}`}>
                            {task.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.assignedTo ? 
                            `Assigned to: ${task.assignedTo.name}` : 
                            'Not assigned'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
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
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No activity found</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {recentActivity.map((log) => {
                    // Format the activity log message
                    let actionText = '';
                    switch (log.action) {
                      case LogAction.CREATED:
                        actionText = 'created';
                        break;
                      case LogAction.UPDATED:
                        actionText = 'updated';
                        break;
                      case LogAction.STATUS_CHANGED:
                        actionText = 'changed status of';
                        break;
                      case LogAction.ASSIGNED:
                        actionText = 'assigned';
                        break;
                      default:
                        actionText = log.action.toLowerCase();
                    }
                    
                    const entityText = log.entityType === EntityType.TASK ? 'a task' : 'an item';
                    const formattedDate = new Date(log.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return (
                      <div className="p-3 border rounded-md" key={log.id}>
                        <div className="flex justify-between items-start">
                          <p className="text-sm">
                            <span className="font-medium">{log.user.name}</span>
                            {' '}{actionText}{' '}{entityText}
                          </p>
                          <span className="text-xs text-gray-500">{formattedDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
