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
        <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
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
        <div className="group relative flex flex-col justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-5 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_35px_rgba(212,175,55,0.2)]">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">Team Members (L1-{maxLevel})</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black font-mono tracking-tight text-gold-gradient">{totals.members}</p>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">Users</span>
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-inner transition group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-mono text-[#A7C4B8]">Network downline total</span>
            </div>
          </div>
        </div>

        <div className="group relative flex flex-col justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-5 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_35px_rgba(212,175,55,0.2)]">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">Team Volume (Staked)</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black font-mono tracking-tight text-gold-gradient">{fmt(totals.volume)}</p>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">USDT</span>
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-inner transition group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Coins className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-mono text-[#A7C4B8]">Total staked across downlines</span>
            </div>
          </div>
        </div>

        <div className="group relative flex flex-col justify-between rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-5 shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/70 hover:shadow-[0_8px_35px_rgba(212,175,55,0.2)]">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F1D78A]">Commission Earned</p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-black font-mono tracking-tight text-gold-gradient">{fmt(totals.earned)}</p>
                  <span className="text-xs font-mono font-bold text-[#D4AF37]">USDT</span>
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-inner transition group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3">
              {totals.pendingEarned > 0 ? (
                <span className="text-xs font-mono text-[#F1D78A]">+{fmt(totals.pendingEarned)} USDT pending Saturday release</span>
              ) : (
                <span className="text-xs font-mono text-[#A7C4B8]">18% 10-level commission pool</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
        <div className="border-b border-[#1E493B] px-6 py-4">
          <h3 className="text-sm font-semibold text-[#ECFDF5]">Team Breakdown by Level (L1 - {maxLevel})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-[#0B2720]/70 text-[11px] uppercase tracking-wider text-[#91A89E]">
                <th className="px-6 py-3 font-medium">Level</th>
                <th className="px-6 py-3 font-medium">Rate</th>
                <th className="px-6 py-3 font-medium">Members</th>
                <th className="px-6 py-3 font-medium">Team Volume</th>
                <th className="px-6 py-3 font-medium">Earned (Released)</th>
                <th className="px-6 py-3 font-medium">Pending</th>
                <th className="px-6 py-3 font-medium">Members (preview)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E493B]">
              {levels.map((l) => (
                <tr key={l.level} className={`text-[#ECFDF5] transition hover:bg-[#164B3A]/40 ${l.members === 0 ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-[#164B3A] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#34D399]">
                      L{l.level}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-[#34D399]">{l.rate}</td>
                  <td className="px-6 py-3">{l.members}</td>
                  <td className="whitespace-nowrap px-6 py-3">{fmt(l.volume)} USDT</td>
                  <td className="whitespace-nowrap px-6 py-3 font-semibold text-[#34D399]">{fmt(l.earned)} USDT</td>
                  <td className="whitespace-nowrap px-6 py-3 text-[#F1D78A]">{l.pendingEarned > 0 ? fmt(l.pendingEarned) : '—'}</td>
                  <td className="max-w-[260px] truncate px-6 py-3 text-[11px] text-[#91A89E]">
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
        <Loader2 className="h-8 w-8 animate-spin text-[#34D399]" />
      </div>
    );
  }
  if (error) {
    return <p className="py-14 text-center text-sm text-rose-400">{error}</p>;
  }

  if (data.tree.children.length === 0) {
    return (
      <section className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] p-8 shadow-card-gold">
        <div className="flex flex-col items-center justify-center py-14">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#F1D78A] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Network className="h-8 w-8" />
          </div>
          <p className="font-mono text-base font-bold text-[#ECFDF5]">Your team is currently empty</p>
          <p className="mt-1.5 max-w-sm text-center text-xs text-[#A7C4B8]">
            Share your referral link with friends. Every direct and indirect member will appear in this interactive tree automatically!
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
    <section className="rounded-2xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#10352C] via-[#10352C] to-[#0B2720] shadow-card-gold transition-all duration-300 hover:border-[#D4AF37]/60">
      <div className="flex items-center gap-2 border-b border-[#1E493B] px-6 py-4">
        <Link2 className="h-4 w-4 text-[#D4AF37]" />
        <h3 className="text-sm font-semibold font-mono text-[#F1D78A]">Your Referral Link & Sponsor Code</h3>
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#1E493B] bg-[#0B2720] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#91A89E]">Sponsor Code (share this)</p>
              <p className="font-mono text-base font-bold text-gold-gradient">{identity?.referralCode || '...'}</p>
            </div>
            <button
              onClick={() => identity && copyText(identity.referralCode, 'code', 'Sponsor code copied')}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-mono font-bold text-[#F1D78A] transition hover:bg-[#D4AF37]/25"
            >
              {copied === 'code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'code' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#1E493B] bg-[#0B2720] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#91A89E]">My Sponsor (upline L1)</p>
              <p className="font-mono text-sm text-[#A7C4B8]">{identity?.sponsorCode || 'Direct account'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            readOnly
            value={identity?.referralLink || ''}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-xl border border-[#1E493B] bg-[#0B2720] px-4 py-2.5 font-mono text-sm text-[#F1D78A] outline-none focus:border-[#D4AF37]"
          />
          <button
            onClick={() => identity && copyText(identity.referralLink, 'link', 'Referral link copied to clipboard')}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F1D78A] to-[#D4AF37] hover:brightness-110 text-[#071C18] px-5 py-2.5 text-sm font-bold font-mono transition sm:w-auto shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === 'link' ? 'Copied' : 'Copy Link'}
          </button>
        </div>
        <p className="text-xs text-[#91A89E]">
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
    <div className="text-[#ECFDF5]">
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#ECFDF5]">Referrals & My Team</h2>
            <p className="mt-1 text-sm text-[#91A89E]">10-level referral hierarchy with weekly Saturday release</p>
          </div>
          <div className="flex gap-2">
            {SUB_TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setSearchParams({ tab: key })}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                  tab === key
                    ? 'border-[#34D399] bg-[#164B3A] text-[#34D399]'
                    : 'border-[#1E493B] text-[#91A89E] hover:bg-[#10352C] hover:text-[#ECFDF5]'
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
