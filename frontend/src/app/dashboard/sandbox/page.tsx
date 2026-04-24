import { redirect } from 'next/navigation';

export default function DashboardSandboxRedirect() {
  redirect('/dashboard/agent?focus=workspace');
}
