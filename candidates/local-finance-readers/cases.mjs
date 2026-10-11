export function buildCases(input) {
  const edit = fn => { const d = structuredClone(input); fn(...d.body); return d; };
  const positives = [
    ['independent total, category fractions, zero and missing records', structuredClone(input)],
    ['explicit masking retains unknown values', edit((u, s) => { u.masked = s.masked = true; u.maskedLabel = s.maskedLabel = 'Hidden by local host'; })],
    ['explicitly disabled local readers', edit((u, s) => { u.disabled = s.disabled = true; })],
    ['explicit empty collections', edit((u, s) => { u.activities = []; s.categories = []; u.emptyLabel = 'No supplied activity'; s.emptyLabel = 'No supplied categories'; })],
    ['unknown total and activity values', edit((u, s) => { s.totalLabel = null; u.activities.forEach(a => { a.amountLabel = null; a.dateLabel = null; }); })],
    ['finite maximum supplied collections', edit((u, s) => { u.activities = Array.from({ length: 60 }, (_, i) => ({ ...structuredClone(u.activities[i % 3]), id: 'activity_' + i })); s.categories = Array.from({ length: 24 }, (_, i) => ({ ...structuredClone(s.categories[i % 3]), id: 'category_' + i })); })]
  ];
  const negative = (name, fn, code = 'SCHEMA', path) => [name, edit(fn), code, path];
  const negatives = [
    negative('duplicate activity ID', u => { u.activities[1].id = u.activities[0].id; }, 'UPCOMING_ID', '/body/0/activities/1/id'),
    negative('duplicate category ID', (u, s) => { s.categories[1].id = s.categories[0].id; }, 'SPEND_ID', '/body/1/categories/1/id'),
    negative('blank upcoming group label', u => { u.label = ' '; }, 'UPCOMING_LABEL', '/body/0/label'),
    negative('blank activity title', u => { u.activities[0].title = ' '; }, 'UPCOMING_LABEL', '/body/0/activities/0/title'),
    negative('blank activity amount is not unknown', u => { u.activities[0].amountLabel = ' '; }, 'UPCOMING_LABEL', '/body/0/activities/0/amountLabel'),
    negative('blank activity date is not unknown', u => { u.activities[0].dateLabel = ' '; }, 'UPCOMING_LABEL', '/body/0/activities/0/dateLabel'),
    negative('blank spend group label', (u, s) => { s.label = ' '; }, 'SPEND_LABEL', '/body/1/label'),
    negative('blank supplied period', (u, s) => { s.periodLabel = ' '; }, 'SPEND_LABEL', '/body/1/periodLabel'),
    negative('blank total is not unknown', (u, s) => { s.totalLabel = ' '; }, 'SPEND_LABEL', '/body/1/totalLabel'),
    negative('blank category label', (u, s) => { s.categories[0].label = ' '; }, 'SPEND_LABEL', '/body/1/categories/0/label'),
    negative('blank category amount is not unknown', (u, s) => { s.categories[0].amountLabel = ' '; }, 'SPEND_LABEL', '/body/1/categories/0/amountLabel'),
    negative('negative fraction', (u, s) => { s.categories[0].fraction = -0.1; }),
    negative('fraction above one', (u, s) => { s.categories[0].fraction = 1.1; }),
    negative('fraction must be numeric or null', (u, s) => { s.categories[0].fraction = '0.7'; }),
    negative('unsupported activity kind', u => { u.activities[0].kind = 'transfer'; }),
    negative('sixty-one activities exceed bound', u => { u.activities = Array.from({ length: 61 }, (_, i) => ({ ...structuredClone(u.activities[0]), id: 'activity_' + i })); }),
    negative('twenty-five categories exceed bound', (u, s) => { s.categories = Array.from({ length: 25 }, (_, i) => ({ ...structuredClone(s.categories[0]), id: 'category_' + i })); }),
    negative('disabled is literal boolean', u => { u.disabled = 'true'; }),
    negative('total is supplied display text', (u, s) => { s.totalLabel = 900; }),
    negative('missing date differs from explicit null', u => { delete u.activities[0].dateLabel; })
  ];
  return { positives, negatives };
}
