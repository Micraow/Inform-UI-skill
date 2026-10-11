export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(...d.body); return d; };
  const positives = [
    ['independent supplied estimate, true zero, missing and no-income snapshots', structuredClone(input)],
    ['masked amounts preserve absent data', edit((known, unknown) => { known.masked = true; known.maskedLabel = 'Hidden by the host'; unknown.masked = true; })],
    ['explicitly no upcoming paycheck', edit(known => { known.nextPaycheck = null; known.noUpcomingLabel = 'No upcoming paycheck supplied'; })],
    ['omitted optional paycheck and subtitle', edit(known => { delete known.nextPaycheck; known.subtitle = 'Original local teaching data'; })],
    ['safe supplied source link', edit(known => { known.source = { label: 'Fictional source reference', url: 'https://example.org/supplied-income' }; })],
    ['alternate original reading icon', edit(known => { known.nextPaycheck.icon = 'calendar'; delete known.nextPaycheck.logoUrl; })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('blank accessible label', known => { known.label = ' '; }, 'INCOME_LABEL', '/body/0/label'),
    negative('income requires a supplied estimate label', known => { delete known.estimatedMonthlyIncomeLabel; }, 'INCOME_LABEL', '/body/0/estimatedMonthlyIncomeLabel'),
    negative('blank supplied source summary', known => { known.incomeSourcesLabel = ' '; }, 'INCOME_LABEL', '/body/0/incomeSourcesLabel'),
    negative('blank optional paycheck name', known => { known.nextPaycheck.name = ' '; }, 'INCOME_LABEL', '/body/0/nextPaycheck/name'),
    negative('unsafe paycheck logo', known => { known.nextPaycheck.logoUrl = 'javascript:untrusted()'; }, 'UNSAFE_URL', '/body/0/nextPaycheck/logoUrl'),
    negative('unsafe reference link', known => { known.source = { label: 'Unsafe', url: 'javascript:untrusted()' }; }, 'UNSAFE_URL', '/body/0/source/url'),
    negative('hasIncome is a literal boolean', known => { known.hasIncome = 'true'; }),
    negative('paycheck must be record or null', known => { known.nextPaycheck = []; }),
    negative('money operations are outside this supplied contract', known => { known.nextPaycheck.transferAmount = 100; }),
    negative('unknown glyph', known => { known.nextPaycheck.icon = 'rocket'; }),
    negative('automatic account discovery is not supported', known => { known.accountLookup = true; }),
    negative('date is supplied display text', known => { known.nextPaycheck.nextPayment = 42; }),
    negative('unbounded empty-state copy', (known, unknown, empty) => { empty.emptyLabel = 'x'.repeat(2001); })
  ];
  return { positives, negatives };
}
