import type { PageProps } from './Overview';
import { Stats } from './Overview';
import { WeeklyChart, CompletionChart, CategoryChart } from '../components/Charts';
import { SectionHead } from '../components/UI';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
export default function Analytics({ data, today }: PageProps) {
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">THE STORY BEHIND YOUR EFFORT</span>
          <h2>Progress you can see.</h2>
          <p>Every checkmark adds up to something bigger.</p>
        </div>
        <span className="period-badge">Your personal activity</span>
      </div>
      <Stats data={data} today={today} />
      <div className="analytics-grid">
        <section className="panel">
          <SectionHead title="Weekly activity" detail="Completed tasks and habits · last 7 days" />
          <WeeklyChart data={data} today={today} />
        </section>
        <section className="panel">
          <SectionHead title="Habit completion" detail="Scheduled habits · last 14 days" />
          <CompletionChart data={data} today={today} />
        </section>
      </div>
      <div className="analytics-bottom">
        <section className="panel">
          <SectionHead title="Where your energy goes" detail="All completed activities" />
          <CategoryChart data={data} />
        </section>
        <section className="panel activity-panel">
          <SectionHead title="The consistency calendar" />
          <ActivityHeatmap data={data} today={today} />
        </section>
      </div>
    </>
  );
}
