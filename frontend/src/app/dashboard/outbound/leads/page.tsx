import { redirect } from 'next/navigation';

export default function OutboundLeadsRedirect() {
  redirect('/dashboard/leads?source=outbound');
}
