import { Gridlet } from '../../components';
import { Icon } from '../../components/Icon';

const whosOut = [
  { name: 'Cdam Ahristensen', type: 'Vacation', dates: 'Mar 10–14', department: 'Engineering' },
  { name: 'Crian Brofts', type: 'Sick Leave', dates: 'Mar 12', department: 'Engineering' },
  { name: 'Nustin Dudd', type: 'PTO', dates: 'Mar 12–13', department: 'Product' },
];

const timeOffRequests = [
  { name: 'Bark Mallard', dates: 'Mar 18–20', type: 'PTO', submitted: 'Mar 10' },
  { name: 'Lave Desue', dates: 'Mar 24–28', type: 'Vacation', submitted: 'Mar 11' },
];

const timesheetDays = [
  { day: 'Mon', hours: 8.0 },
  { day: 'Tue', hours: 8.5 },
  { day: 'Wed', hours: 7.5 },
  { day: 'Thu', hours: 0, current: true },
  { day: 'Fri', hours: 0 },
];

export function DemoDashboard() {
  return (
    <div className="p-10">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-8">
          {/* Default avatar — grey circle with person silhouette */}
          <div
            className="w-[96px] h-[96px] rounded-full bg-[#e8e6e4] flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <Icon name="circle-user" size={56} className="text-[#c5c2bf]" />
          </div>
          <div className="flex flex-col">
            <h1
              className="text-[44px] font-bold leading-[52px] text-[var(--color-primary-strong)]"
              style={{ fontFamily: 'Fields, system-ui, sans-serif' }}
            >
              Good morning, Rad
            </h1>
            <p
              className="font-medium text-[15px] leading-[22px] text-[var(--text-neutral-medium)]"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              HR Admin at OakHR
            </p>
          </div>
        </div>
      </div>

      {/* Gridlet Dashboard */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))',
        }}
      >
        {/* Who's Out */}
        <Gridlet title="Who's Out" icon="circle-user">
          <div className="space-y-4">
            {whosOut.map((person) => (
              <div key={person.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-neutral-x-weak)] flex items-center justify-center">
                    <Icon name="circle-user" size={16} className="text-[var(--icon-neutral-strong)]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-[var(--text-neutral-xx-strong)]">{person.name}</p>
                    <p className="text-[13px] text-[var(--text-neutral-medium)]">{person.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-medium text-[var(--text-neutral-strong)]">{person.type}</p>
                  <p className="text-[13px] text-[var(--text-neutral-medium)]">{person.dates}</p>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-[var(--border-neutral-x-weak)]">
              <p className="text-[13px] text-[var(--text-neutral-medium)]">
                3 of 187 employees out today
              </p>
            </div>
          </div>
        </Gridlet>

        {/* Time Off Requests */}
        <Gridlet title="Time Off Requests" icon="file-lines">
          <div className="space-y-4">
            {timeOffRequests.map((request) => (
              <div key={request.name} className="flex items-center justify-between p-3 bg-[var(--surface-neutral-xx-weak)] rounded-lg">
                <div>
                  <p className="text-[15px] font-medium text-[var(--text-neutral-xx-strong)]">{request.name}</p>
                  <p className="text-[13px] text-[var(--text-neutral-medium)]">{request.type} &middot; {request.dates}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[12px] font-medium rounded-full border border-amber-200">
                    Pending
                  </span>
                </div>
              </div>
            ))}
            <p className="text-[13px] text-[var(--text-neutral-medium)]">
              Submitted {timeOffRequests[timeOffRequests.length - 1].submitted}
            </p>
          </div>
        </Gridlet>

        {/* My Timesheet */}
        <Gridlet title="My Timesheet" icon="chart-pie-simple">
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-medium text-[var(--text-neutral-medium)]">This Week</p>
              <p className="text-[15px] font-semibold text-[var(--text-neutral-xx-strong)]">24.0 hrs</p>
            </div>
            <div className="flex gap-2">
              {timesheetDays.map((day) => (
                <div key={day.day} className="flex-1 text-center">
                  <div
                    className={`h-16 rounded-lg mb-2 flex items-end justify-center pb-1.5 text-[12px] font-medium ${
                      day.hours > 0
                        ? 'bg-[var(--color-primary-weak)] text-[var(--color-primary-strong)]'
                        : day.current
                          ? 'bg-[var(--surface-neutral-x-weak)] border-2 border-dashed border-[var(--border-neutral-weak)] text-[var(--text-neutral-weak)]'
                          : 'bg-[var(--surface-neutral-xx-weak)] text-[var(--text-neutral-weak)]'
                    }`}
                  >
                    {day.hours > 0 ? `${day.hours}h` : '—'}
                  </div>
                  <p className={`text-[12px] ${day.current ? 'font-semibold text-[var(--color-primary-strong)]' : 'text-[var(--text-neutral-medium)]'}`}>
                    {day.day}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Gridlet>

        {/* Announcements */}
        <Gridlet title="Announcements" icon="file-lines">
          <div className="space-y-4">
            <div className="p-3 bg-[var(--surface-neutral-xx-weak)] rounded-lg">
              <p className="text-[15px] font-medium text-[var(--text-neutral-xx-strong)] mb-1">
                Q2 Planning Kickoff
              </p>
              <p className="text-[13px] text-[var(--text-neutral-medium)] leading-5">
                All-hands meeting next Tuesday at 10 AM PT to review Q1 results and discuss Q2 priorities. Please come prepared with your team's highlights.
              </p>
              <p className="text-[12px] text-[var(--text-neutral-weak)] mt-2">Posted Mar 11</p>
            </div>
            <div className="p-3 bg-[var(--surface-neutral-xx-weak)] rounded-lg">
              <p className="text-[15px] font-medium text-[var(--text-neutral-xx-strong)] mb-1">
                New Benefits Portal
              </p>
              <p className="text-[13px] text-[var(--text-neutral-medium)] leading-5">
                The updated benefits portal is now live. Employees can review and update their selections through March 31.
              </p>
              <p className="text-[12px] text-[var(--text-neutral-weak)] mt-2">Posted Mar 8</p>
            </div>
          </div>
        </Gridlet>
      </div>
    </div>
  );
}

export default DemoDashboard;
