import { useState } from 'react'
import { useHall } from '../../hall/HallContext.jsx'
import { BAR_CATEGORIES, fmt } from '../../data.js'
import {
  IconCoin,
  IconGift,
  IconCart,
  IconChart,
  IconPlus,
  IconMinus,
  IconTrash,
  IconCheck,
  IconX,
} from '../../components/Icons.jsx'

export default function AdminBar() {
  const hall = useHall()
  const [cat, setCat] = useState('All')
  const [cart, setCart] = useState([])
  const [addOpen, setAddOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ name: '', price: '', category: 'Drinks', stock: '' })
  const [paid, setPaid] = useState(false)

  const visible = hall.barProducts.filter((p) => cat === 'All' || p.cat === cat)

  const qtyOf = (id) => cart.find((c) => c.id === id)?.qty || 0

  function addToCart(p) {
    if (qtyOf(p.id) >= p.stock) {
      setToast(`${p.name} omborda yetarli emas`)
      setTimeout(() => setToast(''), 2000)
      return
    }
    setCart((prev) => {
      const found = prev.find((c) => c.id === p.id)
      if (found) return prev.map((c) => (c.id === p.id ? { ...c, qty: c.qty + 1 } : c))
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }]
    })
  }

  function removeFromCart(id) {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0)
    )
  }

  function clearCart() {
    setCart([])
    setPaid(false)
  }

  const total = cart.reduce((acc, c) => acc + c.price * c.qty, 0)

  function checkout() {
    if (!cart.length) return
    hall.placeOrder(cart, total)
    setCart([])
    setPaid(true)
    setToast('To‘lov qabul qilindi!')
    setTimeout(() => {
      setToast('')
      setPaid(false)
    }, 3000)
  }

  function handleAddProduct(e) {
    e.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim() || !price || stock < 0) return
    hall.addProduct({ name: form.name.trim(), cat: form.category, price, stock })
    setAddOpen(false)
    setForm({ name: '', price: '', category: 'Drinks', stock: '' })
  }

  const metrics = [
    { icon: IconCoin, label: 'Today Revenue', value: fmt(hall.barRevenue), unit: ' UZS' },
    { icon: IconGift, label: 'Total Products', value: hall.barProducts.length, sub: 'mahsulot turi' },
    { icon: IconChart, label: 'Low Stock', value: hall.lowStockCount, sub: 'ogohlantirish' },
    { icon: IconCart, label: 'Sales Count', value: hall.salesCount, sub: 'bugungi savdo' },
  ]

  return (
    <div className="page">
      <section className="metrics">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div className="metric card" key={m.label}>
              <div className="metric-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="metric-label">{m.label}</p>
                <p className="metric-value">
                  {m.value}
                  {m.unit ? <span className="metric-unit"> {m.unit}</span> : null}
                </p>
                {m.sub ? <p className="muted small">{m.sub}</p> : null}
              </div>
            </div>
          )
        })}
      </section>

      <section className="bar-layout">
        <div className="bar-catalog card">
          <div className="group-head">
            <h3 className="section-title">Mahsulotlar</h3>
            <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
              <IconPlus size={16} /> addProduct
            </button>
          </div>

          <div className="filters">
            {BAR_CATEGORIES.map((c) => (
              <button
                key={c}
                className={`filter-btn ${cat === c ? 'active' : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {visible.map((p) => (
              <div key={p.id} className="product card">
                <div className="product-top">
                  <strong>{p.name}</strong>
                  <span className={`stock-badge ${p.stock < 5 ? 'low' : ''}`}>
                    Omborda: {p.stock}
                  </span>
                </div>
                <p className="price-val">
                  <span className="grad-text">{fmt(p.price)}</span>
                  <span className="muted small"> UZS</span>
                </p>
                <div className="qty-row">
                  <button className="qty-btn minus" onClick={() => removeFromCart(p.id)}>
                    <IconMinus size={15} />
                  </button>
                  <span className="qty-val">{qtyOf(p.id)}</span>
                  <button className="qty-btn plus" onClick={() => addToCart(p)}>
                    <IconPlus size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hall.barOrders.length ? (
            <div className="recent-orders">
              <h4 className="section-title small">So‘nggi buyurtmalar</h4>
              {hall.barOrders.slice(0, 4).map((o) => (
                <div key={o.id} className="order-row">
                  <span className="muted small">#{o.id} · {o.time}</span>
                  <span className="muted small">
                    {o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                  </span>
                  <b className="small">{fmt(o.total)} so‘m</b>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="cart card">
          <h3 className="section-title">
            <IconCart size={16} /> Savat
          </h3>
          {cart.length ? (
            <ul className="cart-list">
              {cart.map((c) => (
                <li key={c.id} className="cart-item">
                  <div className="book-info">
                    <strong>{c.name}</strong>
                    <span className="muted small">
                      {c.qty} × {fmt(c.price)} so‘m
                    </span>
                  </div>
                  <div className="cart-ctrl">
                    <span className="muted small">{fmt(c.price * c.qty)} so‘m</span>
                    <button className="qty-btn minus" onClick={() => removeFromCart(c.id)}>
                      <IconTrash size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">Savat bo‘sh — mahsulot qo‘shing</p>
          )}

          <div className="cart-total">
            <span>Jami</span>
            <b className="grad-text">{fmt(total)} so‘m</b>
          </div>
          <button className="btn btn-primary btn-block" disabled={!cart.length} onClick={checkout}>
            <IconCheck size={16} /> To‘lovni qabul qilish
          </button>
          {cart.length ? (
            <button className="btn btn-ghost btn-block" onClick={clearCart}>
              Savatni tozalash
            </button>
          ) : null}
        </aside>
      </section>

      {addOpen ? (
        <div className="overlay" onClick={() => setAddOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleAddProduct}>
            <div className="modal-head">
              <h3>Yangi mahsulot qo‘shish</h3>
              <button type="button" className="icon-btn" onClick={() => setAddOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <label className="field">
              <span>Mahsulot nomi</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cola 1L"
                required
              />
            </label>
            <label className="field">
              <span>Narx (UZS)</span>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="10000"
                required
              />
            </label>
            <label className="field">
              <span>Kategoriya</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {BAR_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Ombordagi soni</span>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="10"
                required
              />
            </label>
            <button className="btn btn-primary btn-block" type="submit">
              <IconPlus size={16} /> Qo‘shish
            </button>
          </form>
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}