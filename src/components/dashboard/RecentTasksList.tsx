import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskStatus, UserRole } from '@/types';

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

interface RecentTasksListProps {
  tasks: Task[];
  isLoading: boolean;
  isLead: boolean;
}

export function RecentTasksList({ tasks, isLoading, isLead }: RecentTasksListProps) {
  return (
    <Card className="h-full overflow-hidden hover:shadow-card-hover transition-shadow duration-200">
      <CardHeader className="bg-card border-b border-border">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Recent Tasks
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-md animate-pulse"></div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-muted-foreground">No tasks found</p>
            {isLead && (
              <Link href="/dashboard/tasks/create">
                <Button variant="outline" className="mt-4">
                  Create your first task
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <Link href={`/dashboard/tasks/${task.id}`} key={task.id} className="block">
                <div className="p-4 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="font-medium truncate pr-3">{task.title}</h4>
                    <span className={`whitespace-nowrap text-xs px-2 py-1 rounded-full status-${task.status.toLowerCase().replace(/_/g, '-')}`}>
                      {task.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    {task.assignedTo ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{task.assignedTo.name}</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Not assigned</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            <div className="p-4">
              <Link href="/dashboard/tasks" className="block">
                <Button variant="outline" className="w-full">
                  View All Tasks
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
