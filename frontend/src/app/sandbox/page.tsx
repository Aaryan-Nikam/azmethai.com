import { redirect } from 'next/navigation';

export default function LegacySandboxRedirect() {
  redirect('/dashboard/agent?focus=workspace');
}
