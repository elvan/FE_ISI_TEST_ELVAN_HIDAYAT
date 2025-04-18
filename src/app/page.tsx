import { redirect } from 'next/navigation';

// This is a server component that redirects to the dashboard if logged in,
// or to the login page if not
export default function Home() {
  // In a server component, redirect to the dashboard or login
  redirect('/dashboard');
  
  // This won't be rendered, but included for type safety
  return null;
}
