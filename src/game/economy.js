// Pure economy helpers — cost scaling and affordability.

// Cost grows ×1.15 per unit already owned.
export const costOf = (base, owned) => {
  const c = {};
  for (const k in base) c[k] = Math.ceil(base[k] * Math.pow(1.15, owned));
  return c;
};

export const canAfford = (stock, cost) =>
  Object.keys(cost).every((k) => (stock[k] || 0) >= cost[k]);
