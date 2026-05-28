import { useApp } from '../context/AppContext';
import { OutreachStatus } from '../types';
import { ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';

const STATUS_COLORS: Record<OutreachStatus, string> = {
  Queued: 'bg-stone-100 text-stone-600',
  Sent: 'bg-blue-100 text-blue-700',
  Opened: 'bg-amber-100 text-amber-700',
  Responded: 'bg-green-100 text-green-700',
  Confirmed: 'bg-emerald-100 text-emerald-700',
  Declined: 'bg-red-100 text-red-600',
};

const STATUS_ORDER: OutreachStatus[] = ['Queued', 'Sent', 'Opened', 'Responded', 'Confirmed', 'Declined'];

export default function OutreachDashboard() {
  const { outreach, advanceOutreachStatus } = useApp();

  const totalSent = outreach.filter(o => o.status !== 'Queued').length;
  const totalResponded = outreach.filter(o => ['Responded', 'Confirmed'].includes(o.status)).length;
  const totalConfirmed = outreach.filter(o => o.status === 'Confirmed').length;
  const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 md:px-8 py-6 border-b border-stone-200">
        <div className="flex items-center gap-3 mb-1">
          <BackButton
            warningTitle="Go back to Pitch Drafts?"
            warningBody="Your outreach queue will be cleared. All approved pitches will return to draft state and you'll need to re-approve them before queuing again. Any status updates you've logged will be lost."
          />
          <h1 className="text-xl font-semibold text-stone-900">Outreach Dashboard</h1>
        </div>
        <p className="text-sm text-stone-500 mt-1">Track and update the status of each pitch.</p>
      </div>

      <div className="px-4 md:px-8 py-5 border-b border-stone-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-2xl">
          {[
            { label: 'Total Queued', value: outreach.length },
            { label: 'Sent', value: totalSent },
            { label: 'Responses', value: totalResponded },
            { label: 'Confirmed', value: totalConfirmed },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-stone-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-stone-900">{stat.value}</div>
              <div className="text-xs text-stone-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        {totalSent > 0 && (
          <div className="mt-3 text-sm text-stone-500">
            Response rate: <span className="font-medium text-stone-800">{responseRate}%</span>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 md:px-8 py-5 overflow-x-auto">
        <div className="max-w-4xl min-w-[600px]">
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Venue</th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Topic</th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {outreach.map((item, i) => {
                  const currentIdx = STATUS_ORDER.indexOf(item.status);
                  const isTerminal = item.status === 'Confirmed' || item.status === 'Declined';
                  return (
                    <tr key={item.venueId} className={`border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}>
                      <td className="px-5 py-4">
                        <div className="font-medium text-stone-900">{item.venueName}</div>
                        <div className="text-xs text-stone-400 mt-0.5 truncate max-w-[200px]">{item.subjectLine}</div>
                      </td>
                      <td className="px-5 py-4 text-stone-600 text-xs max-w-[160px]">
                        <div className="truncate">{item.topicTitle}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-400 whitespace-nowrap">{item.lastUpdated}</td>
                      <td className="px-5 py-4">
                        {!isTerminal && (
                          <button
                            onClick={() => advanceOutreachStatus(item.venueId)}
                            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 transition-colors group whitespace-nowrap"
                          >
                            <span>Mark {STATUS_ORDER[currentIdx + 1]}</span>
                            <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
