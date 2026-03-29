export default function App() {
  const legacyVersion = "2026-03-29-vendor-directory";

  return (
    <div className="legacy-shell">
      <div className="legacy-bar">
        <div className="legacy-title">Livio Legacy AI</div>
      </div>

      <iframe
        className="legacy-frame"
        title="Livio Legacy AI"
        src={`/legacy/livio.html?v=${legacyVersion}`}
      />
    </div>
  );
}
