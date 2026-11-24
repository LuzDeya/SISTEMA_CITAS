import { STATUS_LABEL } from '../utils/format';

export default function StatusBadge({ status }) {
  return <span className={`badge st-${status}`}>{STATUS_LABEL[status] || status}</span>;
}
