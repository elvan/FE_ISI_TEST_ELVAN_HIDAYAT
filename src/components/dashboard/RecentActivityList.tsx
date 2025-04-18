import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EntityType, LogAction, UserRole } from '@/types';

interface User {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
}

interface ActivityLog {
  id: number;
  entityType: EntityType;
  entityId: number;
  action: LogAction;
  userId: number;
  details: Record<string, unknown>;
  createdAt: string;
  user: User;
}

interface RecentActivityListProps {
  activityLogs: ActivityLog[];
  isLoading: boolean;
}

export function RecentActivityList({ activityLogs, isLoading }: RecentActivityListProps) {
  return (
    <Card className="h-full overflow-hidden hover:shadow-card-hover transition-shadow duration-200">
      <CardHeader className="bg-card border-b border-border">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-md animate-pulse"></div>
            ))}
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-muted-foreground">No activity found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activityLogs.map((log) => {
              // Format the activity log message
              let actionText = '';
              let actionIcon = null;
              
              switch (log.action) {
                case LogAction.CREATED:
                  actionText = 'created';
                  actionIcon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  );
                  break;
                case LogAction.UPDATED:
                  actionText = 'updated';
                  actionIcon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  );
                  break;
                case LogAction.STATUS_CHANGED:
                  actionText = 'changed status of';
                  actionIcon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                    </svg>
                  );
                  break;
                case LogAction.ASSIGNED:
                  actionText = 'assigned';
                  actionIcon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  );
                  break;
                default:
                  // Convert the action enum to string and make it lowercase
                  actionText = (typeof log.action === 'string' ? log.action : String(log.action)).toLowerCase();
                  actionIcon = (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
              }
              
              const entityText = log.entityType === EntityType.TASK ? 'a task' : 'an item';
              const formattedDate = new Date(log.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              return (
                <div className="p-4 hover:bg-muted/40 transition-colors" key={log.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                        {actionIcon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm">
                          <span className="font-medium">{log.user.name}</span>
                          {' '}{actionText}{' '}{entityText}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 inline-block">{formattedDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="p-4">
              <Link href="/dashboard/activity" className="block">
                <Button variant="outline" className="w-full">
                  View Activity Logs
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
