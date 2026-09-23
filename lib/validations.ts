import { z } from 'zod'

export const partySchema = z.object({
  party_name: z.string().min(1, 'Party name is required').max(200),
  party_type: z.enum(['supplier', 'customer'], {
    required_error: 'Party type is required',
  }),
})

export const entrySchema = z.object({
  entry_number: z.string().min(1, 'Entry number is required').max(100),
  entry_date: z.string().min(1, 'Date is required'),
  entry_type: z.enum(['bill', 'paid', 'received'], {
    required_error: 'Entry type is required',
  }),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(999999999999.99, 'Amount too large'),
})

export type PartyFormData = z.infer<typeof partySchema>
export type EntryFormData = z.infer<typeof entrySchema>
