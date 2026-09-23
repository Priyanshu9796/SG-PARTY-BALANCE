import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PartyDetailClient from '@/components/entries/PartyDetailClient'
import type { Party, PartyEntry } from '@/lib/calculations'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('parties')
    .select('party_name')
    .eq('id', id)
    .single()
  return { title: data ? `${data.party_name} — Party Balance` : 'Party — Party Balance' }
}

export default async function PartyDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (partyError || !party) notFound()

  const { data: entries } = await supabase
    .from('party_entries')
    .select('*')
    .eq('party_id', id)
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <PartyDetailClient
      party={party as Party}
      initialEntries={(entries || []) as PartyEntry[]}
    />
  )
}
