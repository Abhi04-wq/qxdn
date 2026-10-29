import { Link } from 'react-router-dom';

const DashboardLoginLink = () => (
  <Link
    to={typeof window !== 'undefined' && localStorage.getItem('qndx_user')?.includes('admin') ? '/admin/login' : '/login'}
    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-400"
  >
    Go to sign in
  </Link>
);

export default DashboardLoginLink;
