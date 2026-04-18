import React, { useMemo, useState } from "react";

const EXPENSE_FIELDS = [
  { key: "food", label: "Food", idealPct: 12 },
  { key: "rent", label: "Rent", idealPct: 30 },
  { key: "shopping", label: "Shopping", idealPct: 8 },
  { key: "subscriptions", label: "Subscriptions", idealPct: 5 },
  { key: "transport", label: "Transport", idealPct: 10 },
  { key: "misc", label: "Misc", idealPct: 10 },
];

const debtWeights = {
  none: 1,
  low: 0.75,
  medium: 0.45,
  high: 0.15,
};

const debtLabels = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const scoreColor = (score) => {
  if (score >= 80) return "#16a34a";
  if (score >= 55) return "#d97706";
  return "#dc2626";
};

const riskColor = (risk) => {
  if (risk === "Low") return "#16a34a";
  if (risk === "Medium") return "#d97706";
  return "#dc2626";
};

export default function FinancialAuditTool() {
  const [form, setForm] = useState({
    income: "120000",
    savings: "18000",
    food: "12000",
    rent: "36000",
    shopping: "6000",
    subscriptions: "2000",
    transport: "7000",
    misc: "5000",
    debt: "low",
    emergencyFundMonths: "2",
  });

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const metrics = useMemo(() => {
    const income = Math.max(0, Number(form.income) || 0);
    const savings = Math.max(0, Number(form.savings) || 0);
    const emergencyFundMonths = Math.max(0, Number(form.emergencyFundMonths) || 0);

    const expenses = EXPENSE_FIELDS.reduce((acc, field) => {
      acc[field.key] = Math.max(0, Number(form[field.key]) || 0);
      return acc;
    }, {});

    const totalExpenses = Object.values(expenses).reduce((sum, value) => sum + value, 0);
    const savingsPct = income > 0 ? (savings / income) * 100 : 0;

    const expenseBreakdown = EXPENSE_FIELDS.map((field) => {
      const amount = expenses[field.key];
      const pctOfIncome = income > 0 ? (amount / income) * 100 : 0;
      return {
        ...field,
        amount,
        pctOfIncome,
      };
    });

    const missedMonthlySavings = savingsPct >= 20 || income <= 0 ? 0 : ((20 - savingsPct) / 100) * income;
    const missedYearlySavings = missedMonthlySavings * 12;

    const savingsScore =
      savingsPct >= 20 ? 25 :
      savingsPct >= 15 ? 20 :
      savingsPct >= 10 ? 14 :
      savingsPct >= 5 ? 8 : 3;

    const debtScore = 15 * (debtWeights[form.debt] ?? 0.15);

    const emergencyScore =
      emergencyFundMonths >= 6 ? 20 :
      emergencyFundMonths >= 3 ? 14 :
      emergencyFundMonths >= 1 ? 8 : 2;

    const expenseRatio = income > 0 ? totalExpenses / income : 1;
    const expenseControlScore = clamp((1 - Math.max(0, expenseRatio - 0.5) / 0.5) * 20, 0, 20);

    const incomeStabilityScore = income > 0 ? 20 : 0;

    const healthScore = Math.round(
      clamp(
        incomeStabilityScore + expenseControlScore + savingsScore + debtScore + emergencyScore,
        0,
        100
      )
    );

    let riskLevel = "High";
    if (savingsPct > 20 && emergencyFundMonths >= 3) riskLevel = "Low";
    else if (savingsPct >= 5 && savingsPct <= 15 && emergencyFundMonths >= 1) riskLevel = "Medium";
    else if (savingsPct > 15 && emergencyFundMonths >= 1) riskLevel = "Medium";
    if (savingsPct < 5 || emergencyFundMonths < 1) riskLevel = "High";

    const insights = [];

    if (income <= 0) {
      insights.push("Add a valid monthly income to unlock accurate financial diagnostics.");
    }

    if (savingsPct < 20) {
      insights.push("Your savings rate is below the optimal 20% benchmark.");
      insights.push(`You are losing ${toCurrency(missedMonthlySavings)} per month due to lack of structure.`);
    } else {
      insights.push("Your savings rate is on or above the recommended benchmark.");
    }

    const highExpenseAreas = expenseBreakdown
      .filter((item) => item.pctOfIncome > item.idealPct)
      .sort((a, b) => b.pctOfIncome - a.pctOfIncome);

    if (highExpenseAreas.length > 0) {
      const top = highExpenseAreas[0];
      insights.push(
        `You are overspending on ${top.label.toLowerCase()} compared to ideal levels (${top.pctOfIncome.toFixed(1)}% vs ${top.idealPct}%).`
      );
    } else {
      insights.push("Expense distribution is within ideal allocation bands.");
    }

    if (form.debt === "high" || form.debt === "medium") {
      insights.push("Debt pressure is reducing your financial flexibility and health score.");
    }

    if (emergencyFundMonths < 3) {
      insights.push("Build emergency savings toward 3–6 months to reduce financial shocks.");
    }

    if (healthScore >= 80) insights.push("Overall financial behavior is strong and sustainable.");
    else if (healthScore >= 55) insights.push("Financial fundamentals are fair but need optimization.");
    else insights.push("Financial health is currently at risk and needs immediate action.");

    return {
      income,
      savings,
      totalExpenses,
      savingsPct,
      expenseBreakdown,
      healthScore,
      riskLevel,
      missedMonthlySavings,
      missedYearlySavings,
      insights,
    };
  }, [form]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Financial Audit Tool</h1>
          <p style={styles.subtitle}>Internal Client Call Dashboard</p>
        </header>

        <main style={styles.grid}>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Input Panel</h2>
            <div style={styles.formGrid}>
              <NumberField label="Monthly Income" value={form.income} onChange={onChange("income")} />
              <NumberField label="Monthly Savings" value={form.savings} onChange={onChange("savings")} />
              {EXPENSE_FIELDS.map((field) => (
                <NumberField
                  key={field.key}
                  label={field.label}
                  value={form[field.key]}
                  onChange={onChange(field.key)}
                />
              ))}

              <label style={styles.labelWrap}>
                <span style={styles.label}>Debt Level</span>
                <select value={form.debt} onChange={onChange("debt")} style={styles.input}>
                  {Object.entries(debtLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <NumberField
                label="Emergency Fund (Months)"
                value={form.emergencyFundMonths}
                onChange={onChange("emergencyFundMonths")}
              />
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Output Dashboard</h2>
            <div style={styles.kpiRow}>
              <StatCard
                label="Savings %"
                value={`${metrics.savingsPct.toFixed(1)}%`}
                accent={metrics.savingsPct >= 20 ? "#16a34a" : metrics.savingsPct >= 10 ? "#d97706" : "#dc2626"}
              />
              <StatCard
                label="Health Score"
                value={`${metrics.healthScore}/100`}
                accent={scoreColor(metrics.healthScore)}
              />
              <StatCard label="Risk Level" value={metrics.riskLevel} accent={riskColor(metrics.riskLevel)} />
            </div>

            <div style={styles.subCard}>
              <h3 style={styles.subTitle}>Expense Breakdown (% of income)</h3>
              <div style={styles.breakdownList}>
                {metrics.expenseBreakdown.map((item) => (
                  <div key={item.key} style={styles.breakdownRow}>
                    <span>{item.label}</span>
                    <strong style={{ color: item.pctOfIncome > item.idealPct ? "#dc2626" : "#0f172a" }}>
                      {item.pctOfIncome.toFixed(1)}%
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.dualRow}>
              <div style={styles.subCard}>
                <h3 style={styles.subTitle}>Missed Savings</h3>
                <p style={styles.metricText}>Monthly: {toCurrency(metrics.missedMonthlySavings)}</p>
                <p style={styles.metricText}>Yearly: {toCurrency(metrics.missedYearlySavings)}</p>
              </div>

              <div style={styles.subCard}>
                <h3 style={styles.subTitle}>Auto Insights</h3>
                <ul style={styles.insightList}>
                  {metrics.insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label style={styles.labelWrap}>
      <span style={styles.label}>{label}</span>
      <input type="number" min="0" value={value} onChange={onChange} style={styles.input} />
    </label>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ ...styles.statCard, borderColor: `${accent}22` }}>
      <p style={styles.statLabel}>{label}</p>
      <p style={{ ...styles.statValue, color: accent }}>{value}</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(140deg, #f8fafc 0%, #eef2ff 100%)",
    color: "#0f172a",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    padding: "28px",
  },
  container: {
    maxWidth: "1300px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#475569",
    fontWeight: 500,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 390px) minmax(0, 1fr)",
    gap: "16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
  },
  cardTitle: {
    margin: "0 0 14px",
    fontSize: "18px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  labelWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    color: "#334155",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },
  input: {
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff",
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
    gap: "10px",
    marginBottom: "14px",
  },
  statCard: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "12px",
    backgroundColor: "#f8fafc",
  },
  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontWeight: 600,
  },
  statValue: {
    margin: "8px 0 0",
    fontWeight: 800,
    fontSize: "24px",
    lineHeight: 1.1,
  },
  subCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "#fff",
    padding: "12px",
    marginTop: "10px",
  },
  subTitle: {
    margin: "0 0 10px",
    fontSize: "14px",
  },
  breakdownList: {
    display: "grid",
    gap: "7px",
  },
  breakdownRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    borderBottom: "1px dashed #e2e8f0",
    paddingBottom: "4px",
  },
  dualRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1.3fr",
    gap: "10px",
    alignItems: "stretch",
  },
  metricText: {
    margin: "6px 0",
    fontSize: "15px",
    fontWeight: 600,
  },
  insightList: {
    margin: 0,
    paddingLeft: "18px",
    display: "grid",
    gap: "8px",
    color: "#1e293b",
    fontSize: "14px",
  },
};
