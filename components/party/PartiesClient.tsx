'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, TrendingDown, TrendingUp, Users, Building2, X } from 'lucide-react'
import type { PartyWithBalance } from '@/lib/calculations'
import { formatCurrency } from '@/lib/calculations'
import AddPartyModal from './AddPartyModal'
import PartyCard from './PartyCard'

type FilterTab = 'all' | 'supplier' | 'customer'

interface Props {
  parties: PartyWithBalance[]
}

export default function PartiesClient({ parties }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const suppliers = useMemo(() => parties.filter(p => p.party_type === 'supplier'), [parties])
  const customers = useMemo(() => parties.filter(p => p.party_type === 'customer'), [parties])

  const totalPayable = useMemo(
    () => suppliers.reduce((sum, p) => sum + (p.balance > 0 ? p.balance : 0), 0),
    [suppliers]
  )
  const totalReceivable = useMemo(
    () => customers.reduce((sum, p) => sum + (p.balance > 0 ? p.balance : 0), 0),
    [customers]
  )

  const filtered = useMemo(() => {
    let list = parties
    if (activeTab === 'supplier') list = suppliers
    if (activeTab === 'customer') list = customers
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p => p.party_name.toLowerCase().includes(q))
    }
    return list
  }, [parties, activeTab, search, suppliers, customers])

  const filteredSuppliers = filtered.filter(p => p.party_type === 'supplier')
  const filteredCustomers = filtered.filter(p => p.party_type === 'customer')

  function handlePartyAdded() {
    setShowAddModal(false)
    router.refresh()
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Parties</h1>
          <p className="text-slate-500 text-xs lg:text-sm mt-0.5 hidden sm:block">
            Manage suppliers and customers
          </p>
        </div>
        <button
          id="add-party-btn"
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs lg:text-sm px-3 lg:px-4 py-2 lg:py-2.5"
        >
          <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <span className="hidden sm:inline">Add New Party</span>
          <span className="sm:hidden">Add Party</span>
        </button>
      </div>

      {/* ── Summary Cards — 2 cols on mobile, 4 on desktop ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="stat-card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">
            Total Payable
          </p>
          <p className="text-lg lg:text-xl font-bold text-red-600 mt-1">
            {formatCurrency(totalPayable)}
          </p>
          <div className="hidden sm:flex items-center gap-1 mt-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-slate-500">to suppliers</span>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">
            Total Receivable
          </p>
          <p className="text-lg lg:text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalReceivable)}
          </p>
          <div className="hidden sm:flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-500">from customers</span>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">
            Suppliers
          </p>
          <p className="text-lg lg:text-xl font-bold text-slate-800 mt-1">{suppliers.length}</p>
          <div className="hidden sm:flex items-center gap-1 mt-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">total parties</span>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">
            Customers
          </p>
          <p className="text-lg lg:text-xl font-bold text-slate-800 mt-1">{customers.length}</p>
          <div className="hidden sm:flex items-center gap-1 mt-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">total parties</span>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card p-3 lg:p-4 mb-3 lg:mb-4">
        <div className="flex flex-col sm:flex-row gap-2.5 lg:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="search-parties"
              type="text"
              placeholder="Search party..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input form-input-search"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
            {(['all', 'supplier', 'customer'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 px-3 lg:px-4 py-2 text-xs lg:text-sm font-semibold transition-colors capitalize
                  ${activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                  }
                `}
              >
                {tab === 'all' ? 'All' : tab === 'supplier' ? 'Suppliers' : 'Customers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Parties List ── */}
      {filtered.length === 0 ? (
        <div className="card py-12 lg:py-16 text-center">
          <Users className="w-10 h-10 lg:w-12 lg:h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm lg:text-base">
            {search ? 'No parties match your search.' : 'No parties yet. Tap + Add Party to start!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 lg:space-y-6">
          {/* Suppliers */}
          {(activeTab === 'all' || activeTab === 'supplier') && filteredSuppliers.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Suppliers ({filteredSuppliers.length})
              </h2>
              <div className="card divide-y divide-slate-100 overflow-hidden">
                {filteredSuppliers
                  .sort((a, b) => a.party_name.localeCompare(b.party_name))
                  .map(party => <PartyCard key={party.id} party={party} />)}
              </div>
            </div>
          )}

          {/* Customers */}
          {(activeTab === 'all' || activeTab === 'customer') && filteredCustomers.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Customers ({filteredCustomers.length})
              </h2>
              <div className="card divide-y divide-slate-100 overflow-hidden">
                {filteredCustomers
                  .sort((a, b) => a.party_name.localeCompare(b.party_name))
                  .map(party => <PartyCard key={party.id} party={party} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Party Modal */}
      {showAddModal && (
        <AddPartyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handlePartyAdded}
        />
      )}
    </div>
  )
}
