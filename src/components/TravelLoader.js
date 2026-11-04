import styles from "./TravelLoader.module.css";

export default function TravelLoader({
  label = "Preparing your journey",
  compact = false,
  hideLabel = false,
}) {
  return (
    <div
      className={`${styles.loader} ${compact ? styles.compact : ""}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className={styles.visual} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.innerRing} />
        <span className={styles.spark} />
        <svg
          className={styles.plane}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m21.5 3-7.2 18-3.8-7.5L3 9.7 21.5 3Z"
            fill="currentColor"
          />
          <path d="m10.5 13.5 5.2-5.2" stroke="#fff" strokeWidth="1.4" />
        </svg>
      </span>
      {!hideLabel && <span className={styles.label}>{label}</span>}
      {hideLabel && <span className={styles.visuallyHidden}>{label}</span>}
    </div>
  );
}
