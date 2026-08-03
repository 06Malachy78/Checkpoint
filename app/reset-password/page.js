import { redirect } from 'next/navigation';

export default function ResetPasswordRedirectPage({ searchParams }) {
  const query = new URLSearchParams(searchParams).toString();
  redirect(`/auth/reset-password${query ? `?${query}` : ''}`);
}
