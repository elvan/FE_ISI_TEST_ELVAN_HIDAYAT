'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TaskStatus, UserRole } from '@/types';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  createdBy: User;
  assignedTo: User | null;
}

export default function TaskDetailPage() {
  const params = useParams();
  const { isLead } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<TaskStatus | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<number | null>(null);

  const taskId = params.id as string;

  useEffect(() => {
    async function fetchTask() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tasks/${taskId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch task');
        }
        const data = await response.json();
        setTask(data.task);
        setNewStatus(data.task.status);
        setSelectedTeamMember(data.task.assignedToId);
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('Failed to load task details');
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchTeamMembers() {
      if (!isLead) return;
      
      try {
        const response = await fetch('/api/users?role=team_member');
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.users);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      }
    }

    if (taskId) {
      fetchTask();
      fetchTeamMembers();
    }
  }, [taskId, isLead]);

  const handleUpdateStatus = async () => {
    if (!task || !newStatus) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignTask = async () => {
    if (!task || !isLead) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: selectedTeamMember,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign task');
      }

      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error('Error assigning task:', error);
      setError('Failed to assign task');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColorMap = {
    [TaskStatus.NOT_STARTED]: 'bg-gray-100 text-gray-800',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [TaskStatus.DONE]: 'bg-green-100 text-green-800',
    [TaskStatus.REJECTED]: 'bg-red-100 text-red-800',
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Task not found'}</p>
            <Link href="/dashboard/tasks">
              <Button>Back to Tasks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <Link href="/dashboard/tasks">
          <Button variant="outline">Back to Tasks</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className={`px-3 py-1 rounded-full text-sm ${statusColorMap[task.status]}`}>
              {task.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
            {task.dueDate && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Due: {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Created By</h3>
              <p className="text-gray-700 dark:text-gray-300">{task.createdBy.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{task.createdBy.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Assigned To</h3>
              {task.assignedTo ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300">{task.assignedTo.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{task.assignedTo.email}</p>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Not assigned</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Created At</h3>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(task.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Last Updated</h3>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(task.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-200 dark:border-gray-700 space-y-4 flex flex-col items-start p-6">
          {/* Status Update Section (Available to all users) */}
          <div className="w-full space-y-3">
            <h3 className="font-medium">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(TaskStatus).map((status) => (
                <button
                  key={status}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    newStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setNewStatus(status)}
                >
                  {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </button>
              ))}
            </div>
            <Button 
              onClick={handleUpdateStatus} 
              isLoading={isUpdating}
              disabled={newStatus === task.status}
            >
              Update Status
            </Button>
          </div>

          {/* Assignment Section (Only for Lead users) */}
          {isLead && (
            <div className="w-full space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-medium">Assign Task</h3>
              <div className="flex gap-3">
                <select
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={selectedTeamMember || ''}
                  onChange={(e) => setSelectedTeamMember(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">-- Unassigned --</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={handleAssignTask} 
                  isLoading={isUpdating}
                  disabled={selectedTeamMember === task.assignedToId}
                >
                  Assign
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
