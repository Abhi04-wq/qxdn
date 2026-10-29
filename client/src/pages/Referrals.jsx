import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Loader2, Link2, Copy, Check, Users, TrendingUp, Coins,
  Network, Layers,
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Toast from '../components/Toast.jsx';
import TeamTree from '../components/TeamTree.jsx';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 6 });

const SUB_TABS = [
  { key: 'breakdown', label: 'Referrals & Levels', Icon: Layers },
  { key: 'team', label: 'My Team (Tree)', Icon: Network },
];

const BreakdownCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get('/api/referral/team');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }
  if (error) {
    return <p className="py-14 text-center text-sm text-rose-400">{error}</p>;
  }

  const { levels, totals, maxLevel } = data;

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Team Members (L1-{maxLevel})</p>
              <p className="mt-2 text-2xl font-bold text-white">{totals.members}</p>
            </div>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Team Volume (Staked)</p>
              <p className="mt-2 text-2xl font-bold text-white">{fmt(totals.volume)} USDT</p>
            </div>
            <Coins className="h-4 w-4 text-indigo-400" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Commission Earned</p>
              <p className="mt-2 text-2xl font-bold text-emerald-400">{fmt(totals.earned)} USDT</p>
              {totals.pendingEarned > 0 && (
                <p className="mt-1 text-[11px] text-amber-400">+{fmt(totals.pendingEarned)} USDT pending Saturday release</p>
              )}
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="text-sm font-semibold text-white">Team Breakdown by Level (L1 - {maxLevel})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3 font-medium">Level</th>
                <th className="px-6 py-3 font-medium">Rate</th>
                <th className="px-6 py-3 font-medium">Members</th>
                <th className="px-6 py-3 font-medium">Team Volume</th>
                <th className="px-6 py-3 font-medium">Earned (Released)</th>
                <th className="px-6 py-3 font-medium">Pending</th>
                <th className="px-6 py-3 font-medium">Members (preview)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {levels.map((l) => (
                <tr key={l.level} className={`text-slate-300 ${l.members === 0 ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${l.level <= 3 ? 'bg-violet-500/15 text-violet-300' : 'bg-slate-800 text-slate-400'}`}>
                      L{l.level}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-cyan-300">{l.rate}</td>
                  <td className="px-6 py-3">{l.members}</td>
                  <td className="whitespace-nowrap px-6 py-3">{fmt(l.volume)} USDT</td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-emerald-400">{fmt(l.earned)} USDT</td>
                  <td className="whitespace-nowrap px-6 py-3 text-amber-400">{l.pendingEarned > 0 ? fmt(l.pendingEarned) : '—'}</td>
                  <td className="max-w-[260px] truncate px-6 py-3 text-[11px] text-slate-500">
                    {l.memberPreview.map((m) => m.email).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const TeamTreeCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get('/api/referral/tree');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load team tree');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }
  if (error) {
    return <p className="py-14 text-center text-sm text-rose-400">{error}</p>;
  }

  if (data.tree.children.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="flex flex-col items-center justify-center py-14">
          <Network className="mb-4 h-12 w-12 text-slate-700" />
          <p className="text-base font-semibold text-slate-300">Your team is empty</p>
          <p className="mt-1 max-w-sm text-center text-xs text-slate-500">
            Share your referral link with friends. Every direct and indirect member will appear in this tree automatically!
          </p>
        </div>
      </section>
    );
  }

  return <TeamTree node={data.tree} maxDepth={data.maxLevel} />;
};

const ReferralLinkCard = ({ user }) => {
  const [identity, setIdentity] = useState(null);
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get('/api/referral/link');
        setIdentity(res.data);
      } catch {
        setToast('Failed to load referral link');
      }
    })();
  }, []);

  const copyText = async (text, key, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setToast(msg);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setToast('Copy failed - please copy manually');
    }
  };

  void user;

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-slate-900 shadow-[0_0_40px_-10px_rgba(34,211,238,0.12)]">
      <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-4">
        <Link2 className="h-4 w-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Your Referral Link & Sponsor Code</h3>
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Sponsor Code (share this)</p>
              <p className="font-mono text-sm text-cyan-300">{identity?.referralCode || '...'}</p>
            </div>
            <button
              onClick={() => identity && copyText(identity.referralCode, 'code', 'Sponsor code copied')}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:bg-cyan-400/20"
            >
              {copied === 'code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'code' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">My Sponsor (upline L1)</p>
              <p className="font-mono text-sm text-slate-300">{identity?.sponsorCode || 'Direct account'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            readOnly
            value={identity?.referralLink || ''}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-4 py-2.5 text-sm text-cyan-300 outline-none focus:border-cyan-400/60"
          />
          <button
            onClick={() => identity && copyText(identity.referralLink, 'link', 'Referral link copied to clipboard')}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:shadow-[0_0_25px_rgba(34,211,238,0.35)] sm:w-auto"
          >
            {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === 'link' ? 'Copied' : 'Copy Link'}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Commissions: L1 6% - L2 3% - L3 2% - L4 to L10 1% - paid on every stake of your downline, released every Saturday.
        </p>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
    </section>
  );
};

const ReferralsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = location.pathname.endsWith('/team') ? 'team' : 'breakdown';
  const tab = [SUB_TABS[0].key, SUB_TABS[1].key].includes(searchParams.get('tab')) ? searchParams.get('tab') : defaultTab;

  return (
    <div className="text-slate-200">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Referrals & My Team</h2>
            <p className="mt-1 text-sm text-slate-500">10-level referral hierarchy with weekly Saturday release</p>
          </div>
          <div className="flex gap-2">
            {SUB_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setSearchParams({ tab: key })}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                  tab === key
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'breakdown' && (
          <>
            <ReferralLinkCard user={user} />
            <div className="mt-6">
              <BreakdownCard />
            </div>
          </>
        )}
        {tab === 'team' && <TeamTreeCard />}
      </main>
    </div>
  );
};

export default ReferralsPage;
