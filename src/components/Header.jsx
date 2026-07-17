export function Header({ warScore }) {
  return (
    <div style={{ padding: "18px 16px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#7E96AC", textTransform: "uppercase" }}>1940 · United Kingdom · v1</div>
      <h1 style={{ margin: "4px 0 0", fontSize: 26, letterSpacing: 1, color: "#D9B14B", fontWeight: 800 }}>HOME FRONT</h1>
      <div style={{ fontSize: 12, color: "#7E96AC" }}>War Score: <span style={{ color: "#D9B14B", fontWeight: 700 }}>{warScore} ⭐</span> · spend it on laws & doctrine</div>
    </div>
  );
}
