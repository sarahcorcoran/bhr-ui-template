import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Icon } from '../Icon';
import {
  scene4ThinkingSteps,
  scene4ResponseHeader,
  scene4DiversityData,
} from '../../data/demoScriptData';

interface OmniResponseProps {
  onNavigate: () => void;
}

const CHART_COLORS = {
  female: '#73C06B',
  male: '#3AAFA9',
  nonBinary: '#A78BFA',
};

export function OmniResponse({ onNavigate }: OmniResponseProps) {
  const location = useLocation();
  const isOmniExplore = location.pathname === '/omni-explore';

  const [phase, setPhase] = useState<'thinking' | 'chart'>(isOmniExplore ? 'chart' : 'thinking');
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);

  // Stagger thinking steps
  useEffect(() => {
    if (phase !== 'thinking') return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    scene4ThinkingSteps.forEach((step, index) => {
      // Show step
      timers.push(
        setTimeout(() => {
          setVisibleSteps(index + 1);
        }, step.delay)
      );

      // Complete step (600ms after it appears, except last one)
      if (index < scene4ThinkingSteps.length - 1) {
        timers.push(
          setTimeout(() => {
            setCompletedSteps(index + 1);
          }, step.delay + 600)
        );
      }
    });

    // Complete last step and transition to chart
    const lastStep = scene4ThinkingSteps[scene4ThinkingSteps.length - 1];
    timers.push(
      setTimeout(() => {
        setCompletedSteps(scene4ThinkingSteps.length);
      }, lastStep.delay + 600)
    );
    timers.push(
      setTimeout(() => {
        setPhase('chart');
      }, lastStep.delay + 1100)
    );

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  if (phase === 'thinking') {
    return (
      <div className="flex flex-col gap-3 py-2">
        {scene4ThinkingSteps.slice(0, visibleSteps).map((step, index) => {
          const isCompleted = index < completedSteps;
          const isOmniStep = index === scene4ThinkingSteps.length - 1;

          return (
            <div
              key={index}
              className="flex items-center gap-2.5"
              style={{ animation: 'welcomeFadeIn 0.3s ease-out' }}
            >
              {isCompleted ? (
                <Icon name="check-circle" size={16} className="text-[var(--color-primary-strong)]" />
              ) : (
                <Icon name="spinner" size={16} className="text-[var(--text-neutral-medium)] animate-spin" />
              )}
              <span className="text-[14px] text-[var(--text-neutral-strong)]">
                {step.label}
              </span>
              {isOmniStep && (
                <span className="ml-1 px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-[#f0ebff] text-[#7c3aed] rounded-full">
                  Omni
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Compact confirmation state when viewing in the workbook ────────────
  if (isOmniExplore) {
    return (
      <div
        className="flex flex-col gap-3"
        style={{ animation: 'welcomeFadeIn 0.4s ease-out' }}
      >
        <div className="flex items-center gap-2.5 py-2.5 px-3 bg-[var(--surface-neutral-xx-weak)] rounded-lg">
          <Icon name="check-circle" size={16} className="text-[var(--color-primary-strong)]" />
          <span className="text-[14px] font-medium text-[var(--text-neutral-strong)]">
            Viewing in Data Workbook
          </span>
          <span className="ml-auto px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-[#f0ebff] text-[#7c3aed] rounded-full">
            Omni
          </span>
        </div>
        <p className="text-[14px] leading-[20px] text-[var(--text-neutral-medium)]">
          Looks like Marketing and HR skew female, while Engineering and Sales lean male. Explore the workbook to dig deeper.
        </p>
      </div>
    );
  }

  // ─── Full chart phase (floating Ask panel on /demo) ───────────────────
  return (
    <div
      className="flex flex-col gap-4"
      style={{ animation: 'welcomeFadeIn 0.4s ease-out' }}
    >
      <p className="text-[15px] font-semibold text-[var(--text-neutral-xx-strong)]">
        {scene4ResponseHeader}
      </p>

      <div className="bg-[var(--surface-neutral-xx-weak)] rounded-xl p-4" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={scene4DiversityData}
            margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-neutral-x-weak)" />
            <XAxis
              dataKey="department"
              tick={{ fontSize: 11, fill: 'var(--text-neutral-medium)' }}
              axisLine={{ stroke: 'var(--border-neutral-x-weak)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-neutral-medium)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border-neutral-weak)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Bar dataKey="female" name="Female" stackId="a" fill={CHART_COLORS.female} radius={[0, 0, 0, 0]} />
            <Bar dataKey="male" name="Male" stackId="a" fill={CHART_COLORS.male} radius={[0, 0, 0, 0]} />
            <Bar dataKey="nonBinary" name="Non-Binary" stackId="a" fill={CHART_COLORS.nonBinary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[14px] leading-[20px] text-[var(--text-neutral-medium)]">
        Looks like Marketing and HR skew female, while Engineering and Sales lean male. View the workbook to explore further.
      </p>

      <button
        onClick={onNavigate}
        className="self-start px-4 py-2.5 text-[14px] font-medium text-[var(--text-neutral-strong)] bg-[var(--surface-neutral-white)] border border-[var(--border-neutral-medium)] rounded-full hover:bg-[var(--surface-neutral-xx-weak)] transition-colors"
      >
        View Data Workbook
      </button>
    </div>
  );
}
