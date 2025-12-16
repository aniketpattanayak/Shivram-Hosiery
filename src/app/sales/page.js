import { redirect } from 'next/navigation';

export default function SalesRootPage() {
  // Automatically redirect anyone who clicks "Sales" to the Clients list
  redirect('/sales/clients');
}