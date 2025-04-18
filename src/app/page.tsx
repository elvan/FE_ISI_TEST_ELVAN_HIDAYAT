import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';

export default async function Home() {
  // Check if the user is already logged in
  const session = await getServerSession(authOptions);

  // If user is already logged in, redirect them to the dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative bg-primary/5 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 text-primary p-2 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-xl font-bold">TodoSync</div>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-blue-600 px-4 py-2 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            </div>
          </nav>

          <div className="text-center md:text-left md:w-3/5">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              <span className="block">Task Management</span>
              <span className="block text-primary mt-3">Made Simple</span>
            </h1>
            <p className="mt-6 max-w-lg md:max-w-xl mx-auto md:mx-0 text-lg md:text-xl text-muted-foreground">
              Streamline your team&apos;s workflow with our task management system designed specifically for internal company use. Assign, track, and complete tasks efficiently.
            </p>
            <div className="mt-10">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-blue-600 px-6 py-3 text-base font-medium shadow-sm transition-colors"
              >
                Login to Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Key Features</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Designed to improve your team&apos;s productivity and collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-border rounded-lg hover:shadow-card-hover transition-shadow duration-200">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Task Assignment</h3>
              <p className="text-muted-foreground">Easily assign tasks to team members and track their progress from start to finish.</p>
            </div>

            <div className="p-6 border border-border rounded-lg hover:shadow-card-hover transition-shadow duration-200">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Activity Tracking</h3>
              <p className="text-muted-foreground">Monitor all task changes and updates with a comprehensive activity log.</p>
            </div>

            <div className="p-6 border border-border rounded-lg hover:shadow-card-hover transition-shadow duration-200">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Role-Based Access</h3>
              <p className="text-muted-foreground">Differentiate between team leaders and members with appropriate permissions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border pt-8">
            <p className="text-center text-muted-foreground text-sm">
              © {new Date().getFullYear()} Your Company. All rights reserved. Internal use only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
