export default function Progress({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div>
      <div className="progress-label">
        <span>Progression</span>
        <span>
          {completed}/{total} leçons · {percent}%
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progression : ${percent}%`}
      >
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
