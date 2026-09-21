import { IconUsers } from '../../components/Icons.jsx'

export default function SuperStaff() {
  return (
    <div className="page">
      <section className="card admin-placeholder">
        <div className="metric-icon accent-violet">
          <IconUsers size={26} />
        </div>
        <h2>Xodimlar</h2>
        <p className="muted">
          Klub xodimlari va adminlarni boshqarish hamda huquqlarni sozlash keyingi bosqichda
          qo&#39;shiladi.
        </p>
      </section>
    </div>
  )
}