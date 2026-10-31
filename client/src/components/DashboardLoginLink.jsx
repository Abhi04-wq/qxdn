import { Link } from 'react-router-dom';
import { ADMIN_ROUTES } from '../lib/adminConfig.js';

const DashboardLoginLink = () => (
  <Link
    to={typeof window !== 'undefined' && localStorage.getItem('qndx_user')?.includes('admin') ? ADMIN_ROUTES.LOGIN : '/login'}
    className="rounded-xl border border-[#1E493B] bg-[#10352C] px-4 py-2 text-sm font-semibold text-[#ECFDF5] transition hover:border-[#34D399] hover:text-[#34D399] hover:bg-[#164B3A]"
  >
    Go to sign in
  </Link>
);

export default DashboardLoginLink;
