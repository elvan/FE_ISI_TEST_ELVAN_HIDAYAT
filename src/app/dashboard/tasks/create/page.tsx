'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRequireLead } from '@/lib/auth-hooks';

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

const createTaskSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters' }).max(255),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export default function CreateTaskPage() {
  useRequireLead(); // Only lead users can access this page
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedToId: '',
      dueDate: '',
    },
  });

  // Fetch team members for assigning tasks
  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        setIsLoadingTeamMembers(true);
        const response = await fetch('/api/users?role=team_member');
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.users);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setIsLoadingTeamMembers(false);
      }
    }

    fetchTeamMembers();
  }, []);

  const onSubmit = async (data: CreateTaskFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          assignedToId: data.assignedToId ? parseInt(data.assignedToId) : null,
          dueDate: data.dueDate || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to create task');
        return;
      }

      // Navigate back to tasks list on success
      router.push('/dashboard/tasks');
      router.refresh();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-md">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Title"
              placeholder="Task title"
              error={errors.title?.message}
              {...register('title')}
              required
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={4}
                placeholder="Enter task description (optional)"
                {...register('description')}
              ></textarea>
              {errors.description?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign To
              </label>
              <select
                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register('assignedToId')}
                disabled={isLoadingTeamMembers}
              >
                <option value="">-- Unassigned --</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
              {isLoadingTeamMembers && (
                <p className="mt-1 text-sm text-gray-500">Loading team members...</p>
              )}
              {errors.assignedToId?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.assignedToId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Due Date (Optional)
              </label>
              <input
                type="date"
                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register('dueDate')}
              />
              {errors.dueDate?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" isLoading={isLoading}>
                Create Task
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard/tasks')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
