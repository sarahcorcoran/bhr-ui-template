import { Gridlet } from '../../components';
import { Icon } from '../../components/Icon';


export function Home() {
  return (
    <div className="p-10">
      {/* Profile Header */}
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
          gridTemplateColumns: 'repeat(3, minmax(300px, 1fr))',
          gridTemplateRows: 'auto',
        }}
      >
        {/* Row 1 */}
        <Gridlet title="Timesheet" minHeight={302} />
        <Gridlet
          title="What's happening at BambooHR"
          className="col-span-2 row-span-2"
          minHeight={684}
        />

        {/* Row 2 */}
        <Gridlet title="Time off" minHeight={350} />

        {/* Row 3 */}
        <Gridlet title="Welcome to BambooHR" minHeight={332} />
        <Gridlet title="Celebrations" minHeight={332} />
        <Gridlet title="Who's out" minHeight={332} />

        {/* Row 4 */}
        <Gridlet title="Starting soon" minHeight={332} />
        <Gridlet title="Company links" minHeight={332} />
        <Gridlet title="Gender breakdown" minHeight={332} />
      </div>
    </div>
  );
}

export default Home;
