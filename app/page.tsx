import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartiesClient from '@/components/party/PartiesClient'
import type { PartyWithBalance } from '@/lib/calculations'

export const metadata = {
  title: 'Parties — Party Balance',
  description: 'View and manage all your supplier and customer parties.',
}

export default async function PartiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rawParties } = await supabase
    .from('parties')
    .select(`
      *,
      party_entries(entry_type, amount)
    `)
    .eq('user_id', user.id)
    .order('party_name')

  const parties: PartyWithBalance[] = (rawParties || []).map(p => {
    const entries = p.party_entries || []
    const total_bills = entries
      .filter((e: { entry_type: string; amount: number }) => e.entry_type === 'bill')
      .reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0)
    const total_paid = entries
      .filter((e: { entry_type: string; amount: number }) => e.entry_type === 'paid')
      .reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0)
    const total_received = entries
      .filter((e: { entry_type: string; amount: number }) => e.entry_type === 'received')
      .reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0)
    const balance =
      p.party_type === 'supplier'
        ? total_bills - total_paid
        : total_bills - total_received
    return { ...p, total_bills, total_paid, total_received, balance }
  })

  return <PartiesClient parties={parties} />
}
