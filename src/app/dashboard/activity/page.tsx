'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-hooks';
import { EntityType, LogAction } from '@/types';

interface ActivityLog {
  id: number;
  entityType: EntityType;
  entityId: number;
  action: LogAction;
  userId: number;
  details: Record<string, unknown>;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function ActivityLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | 'all'>('all');
  const [actionFilter, setActionFilter] = useState<LogAction | 'all'>('all');

  useEffect(() => {
    async function fetchActivityLogs() {
      try {
        setIsLoading(true);
        
        const queryParams = new URLSearchParams();
        if (entityTypeFilter !== 'all') queryParams.append('entityType', entityTypeFilter);
        if (actionFilter !== 'all') queryParams.append('action', actionFilter);
        
        const response = await fetch(`/api/activity-logs?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch activity logs');
        }
        
        const data = await response.json();
        setLogs(data.logs);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        setError('Failed to load activity logs');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchActivityLogs();
    }
  }, [user, entityTypeFilter, actionFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionDescription = (log: ActivityLog): string => {
    const entityType = log.entityType === EntityType.TASK ? 'Task' : 'User';
    
    switch (log.action) {
      case LogAction.CREATED:
        return `Created a new ${entityType.toLowerCase()}`;
      case LogAction.UPDATED:
        return `Updated ${entityType.toLowerCase()} information`;
      case LogAction.STATUS_CHANGED: {
        // Add type assertions for the status values
        const previousStatus = log.details.previousStatus as string | undefined;
        const newStatus = log.details.newStatus as string | undefined;
        return `Changed task status from "${previousStatus?.replace(/_/g, ' ') || 'unknown'}" to "${newStatus?.replace(/_/g, ' ') || 'unknown'}"`;  
      }
      case LogAction.ASSIGNED:
        return log.details.newAssignee 
          ? `Assigned task to a team member` 
          : `Unassigned task from a team member`;
      default:
        return `Performed action on ${entityType.toLowerCase()}`;
    }
  };

  const getEntityTypeLabel = (type: EntityType): string => {
    switch (type) {
      case EntityType.TASK:
        return 'Task';
      case EntityType.USER:
        return 'User';
      default:
        return type;
    }
  };

  const getActionLabel = (action: LogAction): string => {
    switch (action) {
      case LogAction.CREATED:
        return 'Created';
      case LogAction.UPDATED:
        return 'Updated';
      case LogAction.STATUS_CHANGED:
        return 'Status Changed';
      case LogAction.ASSIGNED:
        return 'Assigned';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activity Logs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entity Type
              </label>
              <select
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value as EntityType | 'all')}
              >
                <option value="all">All Types</option>
                {Object.values(EntityType).map((type) => (
                  <option key={type} value={type}>
                    {getEntityTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action
              </label>
              <select
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as LogAction | 'all')}
              >
                <option value="all">All Actions</option>
                {Object.values(LogAction).map((action) => (
                  <option key={action} value={action}>
                    {getActionLabel(action)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No activity logs found</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {getEntityTypeLabel(log.entityType)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {getActionLabel(log.action)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  <p className="font-medium">{getActionDescription(log)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    By {log.user.name} ({log.user.email})
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
