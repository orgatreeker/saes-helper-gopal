import React, { useMemo, useState } from 'react';

const EXPENSE_CATEGORIES = [
  { key: 'food', label: 'Food', idealPct: 12 },
  { key: 'rent', label: 'Rent', idealPct: 30 },
  { key: 'shopping', label: 'Shopping', idealPct: 8 },
  { key: 'subscriptions', label: 'Subscriptions', idealPct: 5 },
  { key: 'transport', label: 'Transport', idealPct: 10 },
  { key: 'misc', label: 'Misc', idealPct: 7 },
];

const DEBT_OPTIONS = [
  { value: 'none', label: 'None', scoreFactor: 1 },
  { value: 'low', label: 'Low', scoreFactor: 0.75 },
  { value: 'medium', label: 'Medium', scoreFactor: 0.45 },
  { value: 'high', label: 'High', scoreFactor: 0.15 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseAmount = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, num);
};

const scoreToColor = (score) => {
  if (score >= 75) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const riskToColor = {
  Low: '#22c55e',
  Medium: '#f59e0b',
  High: '#ef4444',
};

export default function App() {
  const [income, setIncome] = useState('100000');
  const [savings, setSavings] = useState('10000');
  const [expenses, setExpenses] = useState({
    food: '12000',
    rent: '30000',
    shopping: '7000',
    subscriptions: '2500',
    transport: '6000',
    misc: '4000',
  });
  const [debt, setDebt] = useState('low');
  const [emergencyFundMonths, setEmergencyFundMonths] = useState('2');

  const data = useMemo(() => {
    const monthlyIncome = parseAmount(income);
    const monthlySavings = parseAmount(savings);
    const emergencyMonths = parseAmount(emergencyFundMonths);

    const numericExpenses = Object.fromEntries(
      Object.entries(expenses).map(([key, val]) => [key, parseAmount(val)]),
    );
    const totalExpenses = Object.values(numericExpenses).reduce((sum, value) => sum + value, 0);

    const savingsPct = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    const expenseBreakdown = EXPENSE_CATEGORIES.map((category) => {
      const amount = numericExpenses[category.key] || 0;
      const pct = monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0;
      return {
        ...category,
        amount,
        pct,
      };
    });

    const savingsComponent =
      savingsPct >= 20 ? 25 : savingsPct <= 5 ? 4 : clamp(((savingsPct - 5) / 15) * 21 + 4, 4, 25);

    const spendingRatio = monthlyIncome > 0 ? totalExpenses / monthlyIncome : 1;
    const expenseControlComponent = clamp((1 - Math.max(0, spendingRatio - 0.5)) * 20, 0, 20);

    const debtFactor = DEBT_OPTIONS.find((opt) => opt.value === debt)?.scoreFactor ?? 0.45;
    const debtComponent = 15 * debtFactor;

    const incomeStabilityComponent = monthlyIncome > 0 ? 20 : 4;

    const behaviorFromEmergency =
      emergencyMonths >= 6 ? 20 : emergencyMonths <= 0 ? 2 : clamp((emergencyMonths / 6) * 20, 2, 20);

    const healthScore = clamp(
      incomeStabilityComponent +
        expenseControlComponent +
        savingsComponent +
        debtComponent +
        behaviorFromEmergency,
      0,
      100,
    );

    let riskLevel = 'Medium';
    if (savingsPct < 5 || emergencyMonths < 1) {
      riskLevel = 'High';
    } else if (savingsPct > 20) {
      riskLevel = 'Low';
    } else if (savingsPct >= 5 && savingsPct <= 15) {
      riskLevel = 'Medium';
    }

    const missedSavingsMonthly =
      savingsPct < 20 && monthlyIncome > 0 ? ((20 - savingsPct) / 100) * monthlyIncome : 0;
    const missedSavingsYearly = missedSavingsMonthly * 12;

    const insights = [];

    if (savingsPct < 20) {
      insights.push('Your savings rate is below the 20% optimal benchmark.');
      insights.push(
        `You are losing ₹${Math.round(missedSavingsMonthly).toLocaleString('en-IN')} per month due to lack of savings structure.`,
      );
    } else {
      insights.push('Great job: your savings rate meets or exceeds the recommended benchmark.');
    }

    expenseBreakdown
      .filter((exp) => exp.pct > exp.idealPct)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 2)
      .forEach((exp) => {
        insights.push(
          `You are overspending on ${exp.label.toLowerCase()} (${exp.pct.toFixed(1)}%) compared to ideal levels (${exp.idealPct}%).`,
        );
      });

    if (emergencyMonths < 3) {
      insights.push('Your emergency fund is thin; target at least 3–6 months of coverage.');
    }

    if (debt === 'high' || debt === 'medium') {
      insights.push('Debt pressure is reducing your financial health score; prioritize repayment strategy.');
    }

    if (monthlyIncome > 0 && totalExpenses + monthlySavings > monthlyIncome) {
      insights.push('Monthly outflow exceeds income. Reduce discretionary spending immediately.');
    }

    if (insights.length === 0) {
      insights.push('Financial profile appears balanced. Keep monitoring savings and expenses monthly.');
    }

    return {
      monthlyIncome,
      monthlySavings,
      totalExpenses,
      savingsPct,
      expenseBreakdown,
      healthScore,
      riskLevel,
      missedSavingsMonthly,
      missedSavingsYearly,
      insights,
    };
  }, [income, savings, expenses, debt, emergencyFundMonths]);

  const updateExpense = (key, value) => {
    setExpenses((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Financial Audit Tool</h1>
          <p style={styles.subtitle}>Internal call dashboard for instant financial diagnostics</p>
        </header>

        <section style={styles.grid}>
          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>Input Panel</h2>

            <label style={styles.label}>Monthly Income</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Enter monthly income"
            />

            <label style={styles.label}>Monthly Savings</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              placeholder="Enter monthly savings"
            />

            <h3 style={styles.subHeading}>Expenses</h3>
            {EXPENSE_CATEGORIES.map((category) => (
              <div key={category.key} style={styles.inputRow}>
                <label style={styles.labelInline}>{category.label}</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={expenses[category.key]}
                  onChange={(e) => updateExpense(category.key, e.target.value)}
                />
              </div>
            ))}

            <label style={styles.label}>Debt</label>
            <select style={styles.select} value={debt} onChange={(e) => setDebt(e.target.value)}>
              {DEBT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label style={styles.label}>Emergency Fund (months)</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              value={emergencyFundMonths}
              onChange={(e) => setEmergencyFundMonths(e.target.value)}
              placeholder="e.g. 3"
            />
          </article>

          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>Output Dashboard</h2>

            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Savings %</div>
                <div style={styles.metricValue}>{data.savingsPct.toFixed(1)}%</div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Health Score</div>
                <div style={{ ...styles.metricValue, color: scoreToColor(data.healthScore) }}>
                  {Math.round(data.healthScore)} / 100
                </div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Risk Level</div>
                <div style={{ ...styles.metricValue, color: riskToColor[data.riskLevel] }}>{data.riskLevel}</div>
              </div>

              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Total Expenses</div>
                <div style={styles.metricValue}>₹{Math.round(data.totalExpenses).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div style={styles.subCard}>
              <h3 style={styles.subCardTitle}>Expense Breakdown</h3>
              {data.expenseBreakdown.map((expense) => (
                <div key={expense.key} style={styles.breakdownRow}>
                  <span>{expense.label}</span>
                  <span>
                    {expense.pct.toFixed(1)}% · ₹{Math.round(expense.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.subCard}>
              <h3 style={styles.subCardTitle}>Missed Savings</h3>
              <p style={styles.bodyText}>
                Monthly: <strong>₹{Math.round(data.missedSavingsMonthly).toLocaleString('en-IN')}</strong>
              </p>
              <p style={styles.bodyText}>
                Yearly: <strong>₹{Math.round(data.missedSavingsYearly).toLocaleString('en-IN')}</strong>
              </p>
            </div>

            <div style={styles.subCard}>
              <h3 style={styles.subCardTitle}>Auto Insights</h3>
              <ul style={styles.insightList}>
                {data.insights.map((insight, index) => (
                  <li key={`${insight}-${index}`} style={styles.insightItem}>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.85rem',
    fontWeight: 700,
    color: '#f8fafc',
  },
  subtitle: {
    marginTop: '0.4rem',
    marginBottom: 0,
    color: '#94a3b8',
  },
  grid: {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    alignItems: 'start',
  },
  card: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '14px',
    padding: '1rem',
    boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '1rem',
    fontSize: '1.1rem',
    color: '#f8fafc',
  },
  label: {
    display: 'block',
    fontSize: '0.88rem',
    marginBottom: '0.35rem',
    color: '#cbd5e1',
  },
  labelInline: {
    fontSize: '0.88rem',
    color: '#cbd5e1',
    flex: 1,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.55rem',
  },
  input: {
    width: '100%',
    border: '1px solid #334155',
    background: '#020617',
    color: '#f8fafc',
    borderRadius: '8px',
    padding: '0.55rem 0.65rem',
    marginBottom: '0.75rem',
    outline: 'none',
  },
  select: {
    width: '100%',
    border: '1px solid #334155',
    background: '#020617',
    color: '#f8fafc',
    borderRadius: '8px',
    padding: '0.55rem 0.65rem',
    marginBottom: '0.75rem',
    outline: 'none',
  },
  subHeading: {
    marginTop: '0.45rem',
    marginBottom: '0.7rem',
    color: '#f1f5f9',
    fontSize: '0.95rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '0.7rem',
    marginBottom: '0.9rem',
  },
  metricCard: {
    background: '#0b1222',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '0.75rem',
  },
  metricLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginBottom: '0.35rem',
  },
  metricValue: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#f8fafc',
  },
  subCard: {
    background: '#0b1222',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '0.8rem',
    marginTop: '0.8rem',
  },
  subCardTitle: {
    marginTop: 0,
    marginBottom: '0.6rem',
    fontSize: '0.95rem',
    color: '#f8fafc',
  },
  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.35rem 0',
    borderBottom: '1px solid #1e293b',
    fontSize: '0.9rem',
  },
  bodyText: {
    margin: '0.3rem 0',
    color: '#dbeafe',
  },
  insightList: {
    margin: 0,
    paddingLeft: '1rem',
    display: 'grid',
    gap: '0.4rem',
  },
  insightItem: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    lineHeight: 1.45,
  },
};
