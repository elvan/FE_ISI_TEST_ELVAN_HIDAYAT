'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-hooks';
import { EntityType, LogAction, TaskStatus, UserRole } from '@/types';
import Link from 'next/link';
import { TaskSummaryCard } from '@/components/dashboard/TaskSummaryCard';
import { RecentTasksList } from '@/components/dashboard/RecentTasksList';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';

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

  // Status labels to display in the dashboard
  const statusLabels = {
    [TaskStatus.NOT_STARTED]: 'Not Started',
    [TaskStatus.IN_PROGRESS]: 'In Progress',
    [TaskStatus.DONE]: 'Done',
    [TaskStatus.REJECTED]: 'Rejected',
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <header className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">Here's an overview of your tasks and recent activity.</p>
        </div>
        
        {isLead && (
          <Link href="/dashboard/tasks/create">
            <Button className="btn-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Task
            </Button>
          </Link>
        )}
      </header>

      {/* Task Summary Cards */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Task Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <TaskSummaryCard 
            title="Total Tasks"
            count={taskSummary.total}
            isLoading={isLoading}
          />
          
          {Object.entries(statusLabels).map(([status, label]) => (
            <TaskSummaryCard 
              key={status}
              title={label}
              count={taskSummary[status as TaskStatus]}
              status={status as TaskStatus}
              total={taskSummary.total}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>

      {/* Recent Tasks & Activity */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Updates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentTasksList 
            tasks={recentTasks} 
            isLoading={isLoading} 
            isLead={isLead}
          />
          
          <RecentActivityList 
            activityLogs={recentActivity} 
            isLoading={isLoading}
          />
        </div>
      </section>
    </div>
  );
}
