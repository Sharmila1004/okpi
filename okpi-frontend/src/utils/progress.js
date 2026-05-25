export function computeObjectiveProgress(keyResults = []) {
  if (!Array.isArray(keyResults) || keyResults.length === 0) return 0;

  const percentages = keyResults.map((kr) => {
    const metric = (kr.metricType || "NUMBER").toUpperCase();

    if (metric === "BOOLEAN") {
      return kr.currentValue ? 100 : 0;
    }

    let start = Number(kr.startValue ?? 0);
    let target = Number(kr.targetValue ?? 0);
    let current = Number(kr.currentValue ?? 0);

    if (metric === "PERCENTAGE") {
      start = 0;
      target = 100;
    }

    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(target)) target = 0;
    if (Number.isNaN(current)) current = 0;

    if (target === start) {
      return current >= target ? 100 : 0;
    }

    let ratio;
    if (target > start) {
      ratio = (current - start) / (target - start);
    } else {
      ratio = (start - current) / (start - target);
    }

    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round(clamped * 100);
  });

  const sum = percentages.reduce((a, b) => a + b, 0);
  return Math.round(sum / percentages.length);
}

export default computeObjectiveProgress;
