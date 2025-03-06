import { redirect } from 'next/navigation';

export default function ClientDashboard() {
  redirect('/dashboard/client/campaign/all');
}
