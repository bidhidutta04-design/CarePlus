const navigation = [
  ['fa-th-large', 'Dashboard'], ['fa-calendar-check', 'Appointments'], ['fa-users', 'Patients'],
  ['fa-user-md', 'Doctors'], ['fa-building', 'Departments'], ['fa-file-invoice-dollar', 'Billing'],
  ['fa-pills', 'Pharmacy'], ['fa-flask', 'Lab Reports'], ['fa-boxes', 'Inventory'],
  ['fa-id-badge', 'Staff'], ['fa-chart-line', 'Reports'], ['fa-cog', 'Settings']
];

const appointments = [
  ['APT1255', 'Rahul Sharma', 'Cardiology', 'Dr. Amit Verma', '31 May 2025', '10:30 AM', 'Confirmed', ''],
  ['APT1257', 'Priya Patel', 'Gynecology', 'Dr. Neha Kapoor', '31 May 2025', '10:00 AM', 'Confirmed', ''],
  ['APT1258', 'Amit Singh', 'Orthopedics', 'Dr. Rajesh Kumar', '31 May 2025', '10:30 AM', 'Pending', 'pending'],
  ['APT1259', 'Sneha Joshi', 'Pediatrics', 'Dr. Pooja Sharma', '31 May 2025', '12:00 PM', 'Confirmed', ''],
  ['APT1260', 'Vikram Mehta', 'General Medicine', 'Dr. Sandeep Jain', '31 May 2025', '12:30 PM', 'Cancelled', 'cancelled']
];

const stats = [
  ['fa-calendar-alt', 'Total Appointments', '256', 'Today', 'fa-arrow-up'],
  ['fa-user-injured', 'Total Patients', '1,452', 'This Month', 'fa-calendar-alt'],
  ['fa-user-md', 'Total Doctors', '78', 'Active', 'fa-circle'],
  ['fa-indian-rupee-sign', "Today's Revenue", '₹ 2,450,000', 'vs yesterday', 'fa-arrow-down red']
];

function StatCard({ stat }) {
  return <div className="stat-card">
    <div className="stat-label"><i className={`fas ${stat[0]}`} /> {stat[1]}</div>
    <div className="stat-number">{stat[2]}</div>
    <div className="stat-sub"><i className={`fas ${stat[4]}`} /> {stat[3]}</div>
  </div>;
}

export default function Dashboard() {
  return <div className="dashboard">
    <aside className="sidebar">
      <div className="logo"><i className="fas fa-heartbeat" /> CarePlus</div>
      <nav className="nav">{navigation.map(([icon, label], index) =>
        <div className={`nav-item ${index === 0 ? 'active' : ''}`} key={label}>
          <i className={`fas ${icon}`} /> {label}
        </div>
      )}</nav>
      <div className="support">
        <div className="label"><i className="fas fa-headset" /> 24/7 Support</div>
        <div className="phone"><i className="fas fa-phone-alt" /> +1 (987) 765 4320</div>
      </div>
    </aside>

    <main className="main">
      <header className="top-bar">
        <h1>Dashboard</h1>
        <div className="user"><i className="fas fa-bell" /><div className="avatar">JD</div></div>
      </header>

      <section className="stats-grid">{stats.map((stat) => <StatCard stat={stat} key={stat[1]} />)}</section>

      <section className="row-2col">
        <div className="card"><div className="card-header"><h3>OPD Appointments Overview</h3><i className="fas fa-chevron-down" /></div>
          <div className="bar-chart">{[['52px','Mon'],['68px','Tue'],['45px','Wed'],['78px','Thu'],['60px','Fri'],['40px','Sat'],['30px','Sun']].map(([height, day]) =>
            <div className="bar-item" key={day}><div className="bar fill" style={{ '--h': height }} /><span>{day}</span></div>
          )}</div>
        </div>
        <div className="card"><div className="card-header"><h3>Appointments by Department</h3><i className="fas fa-ellipsis-v" /></div>
          <div className="dept-list">{[['General Medicine','37%'],['L&D','20%'],['Pediatrics','10%'],['Oncology','10%'],['Others','10%']].map(([name, percentage]) =>
            <div className="dept-row" key={name}><span className="label">{name}</span><div className="bar-bg"><div className="bar-fill" style={{ width: percentage }} /></div><span className="perc">{percentage}</span></div>
          )}</div>
        </div>
      </section>

      <div className="quick-actions"><span><i className="fas fa-bolt" /> Quick Actions</span>
        {['New Appointment','Add New Patient','Billing','Add Doctor','Lab Test','Pharmacy'].map((action, index) => <button className="action" key={action}><i className={`fas ${['fa-plus-circle','fa-user-plus','fa-file-invoice','fa-user-md','fa-vial','fa-capsules'][index]}`} /> {action}</button>)}
      </div>

      <section className="table-wrap"><h3>Recent Appointments</h3><table><thead><tr>{['ID','Patient Name','Department','Doctor','Date','Time','Status'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
        <tbody>{appointments.map((appointment) => <tr key={appointment[0]}>{appointment.slice(0, 6).map((value) => <td key={value}>{value}</td>)}<td><span className={`status ${appointment[7]}`}>{appointment[6]}</span></td></tr>)}</tbody>
      </table></section>

      <section className="notif-footer"><div><h3 className="section-title"><i className="fas fa-bell" /> Notifications</h3><div className="notif-list">
        <div className="notif-item"><i className="fas fa-calendar-plus" /><div className="content"><div className="title">New appointment booked</div><div className="desc">Rahul Sharma with Dr. Amit Verma</div></div><span className="time">10 mins ago</span></div>
        <div className="notif-item"><i className="fas fa-flask" /><div className="content"><div className="title">Lab report ready</div><div className="desc">Report for Amit Singh is ready</div></div><span className="time">30 mins ago</span></div>
        <div className="notif-item"><i className="fas fa-exclamation-triangle warning" /><div className="content"><div className="title">Low stock alert</div><div className="desc">Paracetamol stock is running low</div></div><span className="time">1 hour ago</span></div>
      </div></div><footer className="footer"><span>© 2023 CarePlus Hospital Management System. All rights reserved.</span><div><a href="#privacy">Privacy Policy</a><a href="#terms">Terms &amp; Conditions</a></div></footer></section>
    </main>
  </div>;
}
