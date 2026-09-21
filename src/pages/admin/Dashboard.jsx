import { useHall } from '../../hall/HallContext.jsx'
import { PEAK_HOURS, TEMP_HIGH, fmt } from '../../data.js'
import { IconCoin, IconClock, IconCart, IconGift } from '../../components/Icons.jsx'

export default function AdminDashboard() {
  const hall = useHall()

  const metrics = [
    {
      icon: IconClock,
      label: 'Faol seanslar',
      value: `${hall.bookedCount}/${hall.totalCount}`,
      sub: 'Hozirda band kompyuterlar',
    },
    {
      icon: IconGift,
      label: 'Mavjud',
      value: hall.availableCount,
      sub: 'Foydalanishga tayyor',
    },
    {
      icon: IconCart,
      label: 'Kutilayotgan bronlar',
      value: hall.adminBookings.filter((b) => b.status === 'pending').length,
      sub: 'Tasdiqlash kutilmoqda',
    },
    {
      icon: IconCoin,
      label: 'Bar daromadi',
      value: fmt(hall.barRevenue),
      unit: ' UZS',
      sub: "Bugungi bar tushumi",
    },
  ]

  const highTemp = hall.machines
    .filter((m) => m.temp >= TEMP_HIGH)
    .sort((a, b) => b.temp - a.temp)

  const park = [
    { key: 'available', label: 'Mavjud', n: hall.availableCount },
    { key: 'booked', label: 'Band', n: hall.bookedCount },
    { key: 'maintenance', label: 'Texnik xizmat', n: hall.maintenanceCount },
    { key: 'pending', label: 'Kutilmoqda', n: hall.pendingMachined },
  ]

  const pending = hall.adminBookings.filter((b) => b.status === 'pending')

  return (
    <div className="page">
      <section className="metrics">
        {metrics.map((h) => {
          const Icon = h.icon
          return (
            <div className="metric card" key={h.label}>
              <div className="metric-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="metric-label">{h.label}</p>
                <p className="metric-value">
                  {h.value}
                  {h.unit ? <span className="metric-unit"> {h.unit}</span> : null}
                </p>
                <p className="muted small">{h.sub}</p>
              </div>
            </div>
          )
        })}
      </section>

      <div className="two-col">
        <section className="card">
          <h3 className="section-title">Yuqori soatlar</h3>
          <p className="muted small">Kun davomidagi zal bandligi (%)</p>
          <div className="peak-chart">
            {PEAK_HOURS.map((x) => (
              <div className="peak-col" key={x.h}>
                <span className={`peak-val ${x.p >= 90 ? 'high' : ''}`}>{x.p}%</span>
                <div className={`peak-bar ${x.p >= 90 ? 'high' : ''}`} style={{ height: `${x.p}%` }} />
                <span className="peak-label">{x.h}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="section-title">Park holati</h3>
          <p className="muted small">Qurilmalarning umumiy taqsimoti</p>
          <div className="park-status">
            {park.map((p) => (
              <div className="park-row" key={p.key}>
                <span className={`dot dot-${p.key}`} />
                <span className="park-label">{p.label}</span>
                <span className="park-count">{p.n}</span>
                <div className="progress">
                  <span style={{ width: `${(p.n / hall.totalCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="two-col">
        <section className="card">
          <h3 className="section-title">Yuqori harorat</h3>
          {highTemp.length ? (
            <ul className="temp-list">
              {highTemp.map((m) => (
                <li key={m.id}>
                  <strong>{m.name}</strong>
                  <span className="muted small">{m.zone}</span>
                  <span className={`temp-chip ${m.temp >= TEMP_HIGH ? 'hot' : ''}`}>{Math.round(m.temp)}°C</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Yuqori haroratli qurilmalar yo&#39;q</p>
          )}
        </section>

        <section className="card">
          <h3 className="section-title">Kutilayotgan bronlar</h3>
          {pending.length ? (
            <ul className="pending-list">
              {pending.map((b) => (
                <li key={b.id} className="pending-item">
                  <div className="fav-main">
                    <strong>{b.customer}</strong>
                    <span className="muted small">
                      {b.machine} · {b.date} · {b.time} · {b.hours} soat
                    </span>
                  </div>
                  <div className="book-right">
                    <span className="muted small">{fmt(b.amount)} so&#39;m</span>
                    <span className={`badge ${b.status === 'confirmed' ? 'st-available' : 'st-pending'}`}>
                      {b.status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Kutilayotgan bronlar yo&#39;q</p>
          )}
        </section>
      </div>
    </div>
  )
}