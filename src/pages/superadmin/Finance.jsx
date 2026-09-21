import { useState } from 'react'
import { useHall } from '../../hall/HallContext.jsx'
import { EXPENSE_CATEGORIES, FINANCE_REVENUE, fmt } from '../../data.js'
import {
  IconCoin,
  IconTrendDown,
  IconChart,
  IconPlus,
  IconX,
} from '../../components/Icons.jsx'

export default function SuperFinance() {
  const hall = useHall()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', category: 'Kommunal' })
  const [toast, setToast] = useState('')

  const expenses = [...hall.expenses].sort((a, b) => (a.date > b.date ? -1 : 1))
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0)
  const netProfit = FINANCE_REVENUE - totalExpense
  const margin = Math.round((netProfit / FINANCE_REVENUE) * 100)

  const metrics = [
    {
      icon: IconCoin,
      label: 'Revenue',
      value: fmt(FINANCE_REVENUE),
      unit: ' UZS',
      sub: 'Bronlar, bar va boshqa xizmatlar',
      color: 'metric-violet',
    },
    {
      icon: IconTrendDown,
      label: 'Total Expense',
      value: fmt(totalExpense),
      unit: ' UZS',
      sub: 'Operatsion va boshqa chiqimlar',
      color: 'metric-red',
    },
    {
      icon: IconChart,
      label: 'Net Profit',
      value: fmt(netProfit),
      unit: ' UZS',
      badge: `%${margin} margin`,
      sub: 'Xarajatlardan keyingi sof daromad',
      color: 'metric-green',
    },
  ]

  const byCategory = EXPENSE_CATEGORIES.map((c) => {
    const sum = expenses.filter((e) => e.category === c.key).reduce((a, e) => a + e.amount, 0)
    const pct = totalExpense ? Math.round((sum / totalExpense) * 100) : 0
    return { ...c, sum, pct }
  }).filter((c) => c.sum > 0)

  function handleAdd(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.name.trim() || !amount) return
    hall.addExpense({ name: form.name.trim(), category: form.category, amount })
    setAddOpen(false)
    setForm({ name: '', amount: '', category: 'Kommunal' })
    setToast('Xarajat qo\u2018shildi')
    setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="page">
      <section className="metrics">
        {metrics.map((mt) => {
          const Icon = mt.icon
          return (
            <div className={`metric card ${mt.color}`} key={mt.label}>
              <div className="metric-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="metric-label">{mt.label}</p>
                <p className="metric-value">
                  {mt.value}
                  {mt.unit ? <span className="metric-unit"> {mt.unit}</span> : null}
                </p>
                <p className="muted small">{mt.sub}</p>
                {mt.badge ? <span className="delta-badge">{mt.badge}</span> : null}
              </div>
            </div>
          )
        })}
      </section>

      <div className="two-col">
        <section className="card">
          <h3 className="section-title">Xarajatlar kategoriyalari</h3>
          <div className="exp-cat-list">
            {byCategory.map((c) => (
              <div className="exp-cat-row" key={c.key}>
                <div className="exp-cat-head">
                  <span className="muted small">{c.label}</span>
                  <b className="small">
                    {c.pct}%
                  </b>
                </div>
                <div className="progress">
                  <span className={c.cls} style={{ width: `${c.pct}%` }} />
                </div>
                <span className="muted small">{fmt(c.sum)} UZS</span>
              </div>
            ))}
          </div>
          <p className="muted small">Jami xarajatlardan ulushi</p>
        </section>

        <section className="card">
          <div className="group-head">
            <h3 className="section-title">Xarajatlar tarixi</h3>
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <IconPlus size={16} /> addExpense
            </button>
          </div>
          {expenses.length ? (
            <ul className="exp-list">
              {expenses.map((e) => (
                <li key={e.id} className="exp-item">
                  <div className="exp-date">
                    <b>{e.date.slice(8, 10)}</b>
                    <span>{e.date.slice(0, 7)}</span>
                  </div>
                  <div className="book-info">
                    <strong>{e.name}</strong>
                    <span className={`exp-cat-badge exp-cat-${e.category}`}>{e.category}</span>
                  </div>
                  <b className="exp-amount">{fmt(e.amount)} so\u2018m</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Xarajatlar hozircha yo\u2018q</p>
          )}
        </section>
      </div>

      {addOpen ? (
        <div className="overlay" onClick={() => setAddOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleAdd}>
            <div className="modal-head">
              <h3>Yangi xarajat qo\u2018shish</h3>
              <button type="button" className="icon-btn" onClick={() => setAddOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <label className="field">
              <span>Xarajat nomi</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Internet (1Gbps)"
                required
              />
            </label>
            <label className="field">
              <span>Summa (UZS)</span>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="1800000"
                required
              />
            </label>
            <label className="field">
              <span>Kategoriya</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary btn-block" type="submit">
              <IconPlus size={16} /> Qo\u2018shish
            </button>
          </form>
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}