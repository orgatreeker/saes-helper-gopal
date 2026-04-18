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

const formatINR = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;

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
  const [prospectName, setProspectName] = useState('');
  const [lifeGoal, setLifeGoal] = useState('Buy a house');
  const [goalAmount, setGoalAmount] = useState('2000000');
  const [goalMonths, setGoalMonths] = useState('60');

  const [income, setIncome] = useState('50000');
  const [savings, setSavings] = useState('5000');
  const [expenses, setExpenses] = useState({
    food: '7000',
    rent: '15000',
    shopping: '5000',
    subscriptions: '1500',
    transport: '3500',
    misc: '3000',
  });
  const [coffeeSpending, setCoffeeSpending] = useState('2500');
  const [debt, setDebt] = useState('low');
  const [emergencyFundMonths, setEmergencyFundMonths] = useState('2');
  const [notes, setNotes] = useState('');

  const data = useMemo(() => {
    const monthlyIncome = parseAmount(income);
    const monthlySavings = parseAmount(savings);
    const emergencyMonths = parseAmount(emergencyFundMonths);
    const targetGoalAmount = parseAmount(goalAmount);
    const targetGoalMonths = parseAmount(goalMonths);
    const coffee = parseAmount(coffeeSpending);

    const numericExpenses = Object.fromEntries(
      Object.entries(expenses).map(([key, val]) => [key, parseAmount(val)]),
    );
    const totalExpenses = Object.values(numericExpenses).reduce((sum, value) => sum + value, 0);

    const savingsPct = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    const expenseBreakdown = EXPENSE_CATEGORIES.map((category) => {
      const amount = numericExpenses[category.key] || 0;
      const pct = monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0;
      return { ...category, amount, pct };
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
    }

    const missedSavingsMonthly =
      savingsPct < 20 && monthlyIncome > 0 ? ((20 - savingsPct) / 100) * monthlyIncome : 0;
    const missedSavingsYearly = missedSavingsMonthly * 12;

    const overspentCategories = expenseBreakdown
      .filter((exp) => exp.pct > exp.idealPct)
      .sort((a, b) => b.pct - a.pct);

    const coffeeOptimization = coffee * 0.4;
    const shoppingOptimization = (numericExpenses.shopping || 0) * 0.25;
    const subscriptionsOptimization = (numericExpenses.subscriptions || 0) * 0.2;

    const estimatedRecoverableMonthly = missedSavingsMonthly + coffeeOptimization + shoppingOptimization + subscriptionsOptimization;
    const projectedMonthlySavings = monthlySavings + estimatedRecoverableMonthly;
    const projectedSavingsPct = monthlyIncome > 0 ? (projectedMonthlySavings / monthlyIncome) * 100 : 0;

    const currentGoalTimelineMonths = monthlySavings > 0 ? targetGoalAmount / monthlySavings : Infinity;
    const projectedGoalTimelineMonths = projectedMonthlySavings > 0 ? targetGoalAmount / projectedMonthlySavings : Infinity;

    const currentAnnualSavings = monthlySavings * 12;
    const projectedAnnualSavings = projectedMonthlySavings * 12;

    const insights = [];
    if (savingsPct < 20) {
      insights.push('Your savings rate is below the 20% benchmark that drives long-term financial stability.');
      insights.push(`You are currently missing approximately ${formatINR(missedSavingsMonthly)} every month.`);
    } else {
      insights.push('Strong savings behavior: you already meet or beat the 20% benchmark.');
    }

    overspentCategories.slice(0, 2).forEach((exp) => {
      insights.push(
        `Overspending alert: ${exp.label} is ${exp.pct.toFixed(1)}% of income vs ideal ${exp.idealPct}%.`,
      );
    });

    if (coffee > monthlyIncome * 0.05) {
      insights.push(`Lifestyle leak: coffee spend at ${formatINR(coffee)} is high and can be partially redirected to goals.`);
    }

    if (emergencyMonths < 3) {
      insights.push('Emergency fund is fragile. Build 3–6 months to reduce stress and risk.');
    }

    if (debt === 'high' || debt === 'medium') {
      insights.push('Debt level is suppressing growth. Add a debt payoff lane in your monthly plan.');
    }

    if (monthlyIncome > 0 && totalExpenses + monthlySavings > monthlyIncome) {
      insights.push('Cashflow mismatch: monthly outflow exceeds income. Immediate expense reset is needed.');
    }

    const scriptPrompts = [
      `Where are you financially today on a scale of 1 to 10, and why?`,
      `Your monthly income is ${formatINR(monthlyIncome)}. What is your most important goal right now?`,
      `How much are you willing to allocate monthly to achieve “${lifeGoal || 'your goal'}”?`,
      `If we optimize leaks like coffee, shopping, and subscriptions, would you commit that difference to wealth-building?`,
      `If you follow this system, your potential monthly savings can move from ${formatINR(monthlySavings)} to ${formatINR(projectedMonthlySavings)}. Are you ready to start now?`,
    ];

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
      overspentCategories,
      estimatedRecoverableMonthly,
      projectedMonthlySavings,
      projectedSavingsPct,
      currentGoalTimelineMonths,
      projectedGoalTimelineMonths,
      currentAnnualSavings,
      projectedAnnualSavings,
      targetGoalAmount,
      targetGoalMonths,
      insights,
      scriptPrompts,
    };
  }, [income, savings, expenses, debt, emergencyFundMonths, coffeeSpending, lifeGoal, goalAmount, goalMonths]);

  const updateExpense = (key, value) => {
    setExpenses((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Financial Audit + Guided Call Tool</h1>
          <p style={styles.subtitle}>Control the conversation. Diagnose the present. Show the future.</p>
        </header>

        <section style={styles.grid}>
          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>Prospect Intake</h2>

            <label style={styles.label}>Prospect Name</label>
            <input style={styles.input} value={prospectName} onChange={(e) => setProspectName(e.target.value)} placeholder="Client name" />

            <label style={styles.label}>Primary Goal</label>
            <input style={styles.input} value={lifeGoal} onChange={(e) => setLifeGoal(e.target.value)} placeholder="e.g. Buy home, retire early, education" />

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>Goal Amount (₹)</label>
                <input style={styles.input} type="number" min="0" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Target Timeline (months)</label>
                <input style={styles.input} type="number" min="0" value={goalMonths} onChange={(e) => setGoalMonths(e.target.value)} />
              </div>
            </div>

            <h3 style={styles.subHeading}>Current Financial Snapshot</h3>
            <label style={styles.label}>Monthly Income</label>
            <input style={styles.input} type="number" min="0" value={income} onChange={(e) => setIncome(e.target.value)} />

            <label style={styles.label}>Monthly Savings</label>
            <input style={styles.input} type="number" min="0" value={savings} onChange={(e) => setSavings(e.target.value)} />

            <h3 style={styles.subHeading}>Detailed Expenses</h3>
            {EXPENSE_CATEGORIES.map((category) => (
              <div key={category.key} style={styles.inputRow}>
                <label style={styles.labelInline}>{category.label}</label>
                <input style={styles.inputTight} type="number" min="0" value={expenses[category.key]} onChange={(e) => updateExpense(category.key, e.target.value)} />
              </div>
            ))}

            <label style={styles.label}>Coffee / Cafe Spend (monthly)</label>
            <input style={styles.input} type="number" min="0" value={coffeeSpending} onChange={(e) => setCoffeeSpending(e.target.value)} />

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>Debt</label>
                <select style={styles.select} value={debt} onChange={(e) => setDebt(e.target.value)}>
                  {DEBT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>Emergency Fund (months)</label>
                <input style={styles.input} type="number" min="0" value={emergencyFundMonths} onChange={(e) => setEmergencyFundMonths(e.target.value)} />
              </div>
            </div>

            <label style={styles.label}>Call Notes</label>
            <textarea style={styles.textArea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Capture objections, emotional goals, and commitment signals..." />
          </article>

          <article style={styles.card}>
            <h2 style={styles.sectionTitle}>Diagnostic Dashboard</h2>

            <div style={styles.metricsGrid}>
              <Metric label="Savings %" value={`${data.savingsPct.toFixed(1)}%`} />
              <Metric label="Health Score" value={`${Math.round(data.healthScore)} / 100`} color={scoreToColor(data.healthScore)} />
              <Metric label="Risk Level" value={data.riskLevel} color={riskToColor[data.riskLevel]} />
              <Metric label="Missed / Month" value={formatINR(data.missedSavingsMonthly)} />
            </div>

            <div style={styles.subCard}>
              <h3 style={styles.subCardTitle}>Expense Breakdown</h3>
              {data.expenseBreakdown.map((expense) => (
                <div key={expense.key} style={styles.breakdownRow}>
                  <span>{expense.label}</span>
                  <span>{expense.pct.toFixed(1)}% · {formatINR(expense.amount)}</span>
                </div>
              ))}
            </div>

            <div style={styles.subCard}>
              <h3 style={styles.subCardTitle}>Before vs After (if system followed)</h3>
              <p style={styles.bodyText}>Current Annual Savings: <strong>{formatINR(data.currentAnnualSavings)}</strong></p>
              <p style={styles.bodyText}>Projected Annual Savings: <strong>{formatINR(data.projectedAnnualSavings)}</strong></p>
              <p style={styles.bodyText}>Recoverable / Month: <strong>{formatINR(data.estimatedRecoverableMonthly)}</strong></p>
              <p style={styles.bodyText}>Projected Savings Rate: <strong>{data.projectedSavingsPct.toFixed(1)}%</strong></p>
              <p style={styles.bodyText}>Goal Timeline (current): <strong>{Number.isFinite(data.currentGoalTimelineMonths) ? `${Math.ceil(data.currentGoalTimelineMonths)} months` : 'Not reachable'}</strong></p>
              <p style={styles.bodyText}>Goal Timeline (projected): <strong>{Number.isFinite(data.projectedGoalTimelineMonths) ? `${Math.ceil(data.projectedGoalTimelineMonths)} months` : 'Not reachable'}</strong></p>
            </div>

            <div style={styles.subCard}>
              <h3 style={styles.subCardTitle}>Auto Insights</h3>
              <ul style={styles.insightList}>
                {data.insights.map((insight, index) => (
                  <li key={`${insight}-${index}`} style={styles.insightItem}>{insight}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section style={styles.callScriptCard}>
          <h2 style={styles.sectionTitle}>Guided Call Narrative</h2>
          <p style={styles.bodyText}>
            {prospectName ? `${prospectName}, based on your numbers, here's how to guide the conversation:` : 'Use this structure to guide every prospect conversation:'}
          </p>
          <ol style={styles.scriptList}>
            {data.scriptPrompts.map((prompt, idx) => (
              <li key={prompt} style={styles.scriptItem}><strong>Q{idx + 1}:</strong> {prompt}</li>
            ))}
          </ol>
          <div style={styles.closingBox}>
            <p style={styles.closingText}>
              <strong>Closer statement:</strong> “Right now you are missing {formatINR(data.missedSavingsMonthly)} every month.
              With our structured system, you can potentially recover {formatINR(data.estimatedRecoverableMonthly)} monthly
              and move faster toward {lifeGoal || 'your goal'}.”
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: color || '#f8fafc' }}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0b1220',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    padding: '2rem 1rem',
  },
  container: { maxWidth: '1280px', margin: '0 auto' },
  header: { marginBottom: '1.4rem' },
  title: { margin: 0, fontSize: '1.9rem', color: '#f8fafc' },
  subtitle: { marginTop: '0.4rem', color: '#93c5fd' },
  grid: { display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' },
  card: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '14px',
    padding: '1rem',
  },
  sectionTitle: { marginTop: 0, marginBottom: '0.8rem', color: '#f8fafc' },
  subHeading: { marginTop: '0.4rem', color: '#cbd5e1', marginBottom: '0.6rem' },
  label: { display: 'block', fontSize: '0.86rem', marginBottom: '0.3rem', color: '#cbd5e1' },
  labelInline: { fontSize: '0.86rem', color: '#cbd5e1', flex: 1 },
  inputRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' },
  input: {
    width: '100%', border: '1px solid #334155', background: '#020617', color: '#f8fafc', borderRadius: '8px', padding: '0.55rem 0.65rem', marginBottom: '0.7rem',
  },
  inputTight: {
    width: '48%', border: '1px solid #334155', background: '#020617', color: '#f8fafc', borderRadius: '8px', padding: '0.45rem 0.55rem',
  },
  select: {
    width: '100%', border: '1px solid #334155', background: '#020617', color: '#f8fafc', borderRadius: '8px', padding: '0.55rem 0.65rem', marginBottom: '0.7rem',
  },
  textArea: {
    width: '100%', minHeight: '84px', border: '1px solid #334155', background: '#020617', color: '#f8fafc', borderRadius: '8px', padding: '0.6rem', resize: 'vertical',
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.7rem' },
  metricCard: { background: '#0b1222', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.75rem' },
  metricLabel: { fontSize: '0.78rem', color: '#93c5fd', marginBottom: '0.35rem' },
  metricValue: { fontSize: '1.12rem', fontWeight: 700 },
  subCard: { background: '#0b1222', border: '1px solid #1e293b', borderRadius: '10px', padding: '0.8rem', marginTop: '0.75rem' },
  subCardTitle: { marginTop: 0, marginBottom: '0.55rem', color: '#f8fafc' },
  breakdownRow: {
    display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.35rem 0', borderBottom: '1px solid #1e293b', fontSize: '0.9rem',
  },
  bodyText: { margin: '0.28rem 0', color: '#dbeafe' },
  insightList: { margin: 0, paddingLeft: '1rem', display: 'grid', gap: '0.4rem' },
  insightItem: { color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.45 },
  callScriptCard: {
    marginTop: '1rem',
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '14px',
    padding: '1rem',
  },
  scriptList: { margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: '0.45rem' },
  scriptItem: { color: '#e2e8f0', lineHeight: 1.4 },
  closingBox: { marginTop: '0.8rem', padding: '0.8rem', background: '#052e16', border: '1px solid #166534', borderRadius: '10px' },
  closingText: { margin: 0, color: '#dcfce7', lineHeight: 1.45 },
};
