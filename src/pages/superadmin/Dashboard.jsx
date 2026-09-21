import { MONTHLY_FINANCE, SUPER_METRICS, fmt } from '../../data.js'
import {
  IconCoin,
  IconTrendUp,
  IconTrendDown,
  IconChart,
  IconUsers,
  IconCalendar,
  IconCart,
} from '../../components/Icons.jsx'

export default function SuperAdminDashboard() {
  const m = SUPER_METRICS

  const metrics = [
    {
      icon: IconCoin,
      label: 'Oylik daromad',
      value: fmt(m.revenue),
      unit: ' UZS',
      delta: m.revenueDelta,
      deltaLabel: "o'tgan oyga nisbatan",
      color: 'metric-violet',
    },
    {
      icon: IconTrendDown,
      label: 'Oylik xarajat',
      value: fmt(m.expense),
      unit: ' UZS',
      sub: 'Operatsion xarajatlar',
      color: 'metric-red',
    },
    {
      icon: IconChart,
      label: 'Sof foyda',
      value: fmt(m.profit),
      unit: ' UZS',
      badge: `${m.margin}% marja`,
      sub: 'Daromadlilik darajasi',
      color: 'metric-green',
    },
    {
      icon: IconTrendUp,
      label: 'Bandlik',
      value: `${m.utilization}%`,
      sub: 'Zalning bandlik darajasi',
      color: 'metric-cyan',
    },
  ]

  const max = Math.max(...MONTHLY_FINANCE.map((x) => x.rev))

  const topStats = [
    { icon: IconUsers, label: 'Jami foydalanuvchilar', value: 2, sub: "Faol a'zolar" },
    { icon: IconCalendar, label: 'Jami bronlar', value: 6, sub: 'jami bronlar' },
    { icon: IconCart, label: 'Bar sotuvlari', value: 3, sub: 'umumiy savdolar' },
  ]

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
                {mt.delta ? (
                  <span className="delta-badge up">
                    <IconTrendUp size={13} /> +{mt.delta}%
                  </span>
                ) : null}
                {mt.badge ? <span className="delta-badge">{mt.badge}</span> : null}
              </div>
            </div>
          )
        })}
      </section>

      <section className="finance-chart card">
        <div className="group-head">
          <h3 className="section-title">Daromad vs Xarajat</h3>
          <div className="chart-legend">
            <span>
              <i className="lg-dot rev" /> Daromad
            </span>
            <span>
              <i className="lg-dot exp" /> Xarajat
            </span>
          </div>
        </div>
        <div className="finance-bars">
          {MONTHLY_FINANCE.map((x) => (
            <div className="fmonth" key={x.m}>
              <div className="fpair">
                <div
                  className="bar-rev"
                  style={{ height: `${(x.rev / max) * 100}%` }}
                  title={`${x.m}: ${x.rev} mln`}
                >
                  <span>{x.rev}</span>
                </div>
                <div
                  className="bar-exp"
                  style={{ height: `${(x.exp / max) * 100}%` }}
                  title={`${x.m}: ${x.exp} mln`}
                >
                  <span>{x.exp}</span>
                </div>
              </div>
              <span className="fmonth-label">{x.m}</span>
            </div>
          ))}
        </div>
        <p className="muted small">Miqdorlar million (mln UZS) ko&#39;rinishida</p>
      </section>

      <div className="two-col">
        <section className="card">
          <h3 className="section-title">Bandlik</h3>
          <div className="util-wrap">
            <div className="util-ring" style={{ '--p': `${m.utilization}%` }}>
              <div>
                <b>{m.utilization}%</b>
                <span className="muted small">bandlik</span>
              </div>
            </div>
            <div className="util-info">
              <p className="muted small">
                Umumiy imkoniyatga nisbatan joriy foydalanish ko&#39;rsatkichi.
              </p>
              <span className="delta-badge up">
                <IconTrendUp size={13} /> +4% o&#39;tgan oyga nisbatan
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="section-title">Foydalanuvchilar va Bronlar</h3>
          <div className="sa-stats-grid">
            {topStats.map((s) => {
              const Icon = s.icon
              return (
                <div className="sa-stat" key={s.label}>
                  <div className="metric-icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <b className="sa-stat-value">{s.value}</b>
                    <p className="metric-label">{s.label}</p>
                    <span className="muted small">{s.sub}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}