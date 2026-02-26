// ============================================================
// Demo Script Data — All scripted content for the AI demo prototype
// ============================================================

// --- Types ---

export interface DemoIntent {
  id: string;
  keywords: string[];
  thinkingText: string;
  thinkingDuration: number;
  response: string;
  actionButton?: {
    label: string;
    navigateTo: string;
    closeAsk: boolean;
  };
}

export interface DemoFallback {
  response: string;
}

export interface InsightCard {
  id: string;
  icon: 'warning' | 'trend-down' | 'calendar';
  title: string;
  description: string;
  cardTitle: string;
  cardDescription: string;
  userMessage: string;
  askPreSeededMessage: string;
}

export interface TimeOffEmployee {
  employee: string;
  department: string;
  ptoUsed: number;
  ptoRemaining: number;
  accrualRate: string;
  status: 'Normal' | 'Low' | 'Near Cap' | 'Maxed';
}

export interface GenerationStep {
  id: string;
  label: string;
  duration: number;
  content: string;
}

export interface HeadcountRow {
  department: string;
  location: string;
  headcount: number;
}

export interface EditIntent {
  id: string;
  keywords: string[];
  thinkingText: string;
  thinkingDuration: number;
  response: string;
  canvasUpdate: string;
}

export interface RecentlyViewedReport {
  name: string;
  lastViewed: string;
  createdBy: string;
}

// --- Scene 1: Conversational Pattern ---

export const askWelcomeMessage = "Hey Rad! What are we diving into today?";

export const scene1Intents: DemoIntent[] = [
  {
    id: 'whos-out',
    keywords: ['out', 'off', 'today', 'gone', 'absent', 'away', 'who', 'taking', 'PTO', 'vacation', 'OOO'],
    thinkingText: 'Checking Time Off records...',
    thinkingDuration: 1500,
    response: `Here's who's out at OakHR today:

| Employee | Type | Dates | Returns |
|---|---|---|---|
| Cdam Ahristensen | Vacation | Mar 10–14 | Mar 17 |
| Crian Brofts | Sick Leave | Mar 12 | — |
| Nustin Dudd | PTO | Mar 12–13 | Mar 14 |

3 employees out of 187 active employees are out today. Engineering has 2 people out — you might want to flag that for their team lead.`,
    actionButton: {
      label: 'View Time Off Report',
      navigateTo: '/reports/time-off',
      closeAsk: true,
    },
  },
  {
    id: 'next-holiday',
    keywords: ['holiday', 'next', 'company', 'day off', 'closed', 'upcoming', 'break', 'long weekend'],
    thinkingText: 'Checking company calendar...',
    thinkingDuration: 1500,
    response: `The next company holiday is **Memorial Day — Monday, May 26**. That's 11 weeks away.

After that: Independence Day (July 4), Labor Day (September 1).

Heads up: Memorial Day falls right after the May PTO accrual. You might see a spike in extended weekend requests around that time.`,
  },
  {
    id: 'pto-balances',
    keywords: ['balance', 'PTO', 'remaining', 'accrued', 'how much', 'left', 'vacation days', 'time off left', 'cap', 'maxed'],
    thinkingText: 'Pulling PTO balance data...',
    thinkingDuration: 1500,
    response: `Here's the PTO snapshot for OakHR:

- **Average balance:** 8.2 days remaining across all employees
- **Near cap (>90% used):** 4 employees — Cdam Ahristensen, Lonathan Jeaf, Mara Tartell, Pyan Racker
- **Zero balance:** 1 employee — Randy Mounkles (used all 15 days)
- **Highest balance:** Vonathan Jaas — 14 of 15 days remaining

4 employees are approaching their PTO cap before Q2. Might be worth a nudge to their managers so they don't lose days.`,
    actionButton: {
      label: 'View Time Off Report',
      navigateTo: '/reports/time-off',
      closeAsk: true,
    },
  },
];

export const scene1Fallback: DemoFallback = {
  response: "I can help with that! For this demo, try asking me about who's out today, the next company holiday, or PTO balances — I'll pull the data for you in seconds.",
};

// --- Scene 2: Inline Pattern ---

export const scene2InsightCards: InsightCard[] = [
  {
    id: 'pto-cap-risk',
    icon: 'warning',
    title: '3 employees approaching PTO cap',
    description: 'Cdam Ahristensen, Mara Tartell, and Pyan Racker will hit their PTO cap before Q2 if they don\'t take time off soon. Consider notifying their managers.',
    cardTitle: '3 Nearing PTO Cap',
    cardDescription: 'May lose accrued hours',
    userMessage: 'Which employees are near their PTO cap?',
    askPreSeededMessage: '3 employees are approaching their PTO cap before Q2: Cdam Ahristensen (3 days left), Mara Tartell (1 day left), and Pyan Racker (2 days left). Want me to draft a reminder to their managers, or pull up their full PTO history?',
  },
  {
    id: 'low-usage',
    icon: 'trend-down',
    title: 'Marketing PTO usage 40% below average',
    description: 'The Marketing team has used significantly less PTO than other departments. This could indicate workload concerns or a culture of not taking time off.',
    cardTitle: 'Low PTO in Marketing',
    cardDescription: '40% below company avg',
    userMessage: 'Tell me about PTO usage in Marketing',
    askPreSeededMessage: "Marketing's PTO usage is 40% below the company average. Lave Desue has only used 2 of 15 days. This is common in high-growth teams where people feel they can't step away. Want me to compare Marketing's usage trends over the past 6 months, or flag this for the Marketing manager?",
  },
  {
    id: 'coverage-gap',
    icon: 'calendar',
    title: 'Spring break coverage gap risk',
    description: 'Based on historical patterns, Engineering and Product may have overlapping PTO requests in late March. Last year, 40% of Engineering was out the week of March 24.',
    cardTitle: 'Spring Break Coverage Risk',
    cardDescription: 'Overlap risk in late March',
    userMessage: 'Show me the spring break coverage risk',
    askPreSeededMessage: "Based on last year's data, the week of March 24 had heavy PTO overlap in Engineering (40% of the team). This year, 2 requests are already in for that week. Want me to show a coverage forecast for late March, or set up an alert if overlap exceeds 30%?",
  },
];

export const scene2FollowUpIntents: DemoIntent[] = [
  {
    id: 'draft-send',
    keywords: ['draft', 'send', 'notify', 'email', 'message', 'remind', 'manager', 'slack'],
    thinkingText: 'Drafting message...',
    thinkingDuration: 1500,
    response: `Here's a draft message for the relevant manager(s):

---

**Subject: PTO Balance Reminder — Action Needed**

Hi [Manager],

I wanted to flag that some of your team members are approaching their PTO cap for this quarter. To avoid losing accrued days, it might be a good time to encourage them to take some time off.

Here are the employees to check in with:
- **[Employee Name]** — [X] days remaining

Let me know if you'd like to discuss coverage planning.

Best,
Rad Bencher

---

Want me to adjust the tone or add anyone else?`,
  },
  {
    id: 'show-more-data',
    keywords: ['show', 'more', 'history', 'trend', 'compare', 'details', 'full', 'breakdown', 'pull up'],
    thinkingText: 'Pulling detailed data...',
    thinkingDuration: 1500,
    response: `Here's a deeper look at the data:

- **Q1 PTO usage** is tracking 15% higher than the same period last year
- **Engineering** leads in PTO usage at 11.2 days average (vs. 8.2 company-wide)
- **Marketing** is the lowest at 4.8 days average — nearly half the company average

This pattern has been consistent for the past 3 quarters. Marketing's low usage correlates with the team growing from 12 to 18 people over the same period.`,
  },
];

export const scene2Fallback: DemoFallback = {
  response: "I can help dig deeper into this. Try asking me to draft a message to their manager, show the full trend data, or compare across departments.",
};

export const scene2TableData: TimeOffEmployee[] = [
  { employee: 'Cdam Ahristensen', department: 'Engineering', ptoUsed: 12, ptoRemaining: 3, accrualRate: '1.25/mo', status: 'Low' },
  { employee: 'Bark Mallard', department: 'Engineering', ptoUsed: 8, ptoRemaining: 7, accrualRate: '1.25/mo', status: 'Normal' },
  { employee: 'Lave Desue', department: 'Marketing', ptoUsed: 2, ptoRemaining: 13, accrualRate: '1.25/mo', status: 'Normal' },
  { employee: 'Crian Brofts', department: 'Engineering', ptoUsed: 10, ptoRemaining: 5, accrualRate: '1.25/mo', status: 'Normal' },
  { employee: 'Nustin Dudd', department: 'Product', ptoUsed: 9, ptoRemaining: 6, accrualRate: '1.25/mo', status: 'Normal' },
  { employee: 'Lonathan Jeaf', department: 'Sales', ptoUsed: 13, ptoRemaining: 2, accrualRate: '1.25/mo', status: 'Low' },
  { employee: 'Mara Tartell', department: 'Customer Success', ptoUsed: 14, ptoRemaining: 1, accrualRate: '1.25/mo', status: 'Near Cap' },
  { employee: 'Vonathan Jaas', department: 'Finance', ptoUsed: 1, ptoRemaining: 14, accrualRate: '1.25/mo', status: 'Normal' },
  { employee: 'Randy Mounkles', department: 'Marketing', ptoUsed: 15, ptoRemaining: 0, accrualRate: '1.25/mo', status: 'Maxed' },
  { employee: 'Pyan Racker', department: 'Engineering', ptoUsed: 13, ptoRemaining: 2, accrualRate: '1.25/mo', status: 'Near Cap' },
];

// --- Scene 3: Shared UI State ---

export const scene3ReportRequestKeywords: string[] = [
  'headcount', 'department', 'location', 'active', 'employee', 'count', 'report', 'head count',
];

export const scene3AgentPlan = `Here's my plan for your headcount report:

📊 Dataset: Active Employees
📋 Group by: Department, then Location
📏 Metric: Headcount (count of employees)
🔍 Filter: Status = Active only

Building it now...`;

export const scene3GenerationSteps: GenerationStep[] = [
  {
    id: 'dataset',
    label: 'Dataset selected',
    duration: 750,
    content: 'Dataset: Active Employees (187 records)',
  },
  {
    id: 'columns',
    label: 'Columns appear',
    duration: 600,
    content: 'Department | Location | Headcount',
  },
  {
    id: 'filter',
    label: 'Filter applied',
    duration: 500,
    content: 'Status: Active',
  },
  {
    id: 'data',
    label: 'Data populates',
    duration: 1000,
    content: 'Full table populated',
  },
  {
    id: 'summary',
    label: 'Summary row',
    duration: 500,
    content: 'Total: 187',
  },
];

export const scene3HeadcountData: HeadcountRow[] = [
  { department: 'Engineering', location: 'San Francisco', headcount: 18 },
  { department: 'Engineering', location: 'Denver', headcount: 14 },
  { department: 'Engineering', location: 'Austin', headcount: 7 },
  { department: 'Engineering', location: 'Remote', headcount: 3 },
  { department: 'Product', location: 'San Francisco', headcount: 10 },
  { department: 'Product', location: 'Denver', headcount: 6 },
  { department: 'Product', location: 'Austin', headcount: 4 },
  { department: 'Product', location: 'Remote', headcount: 3 },
  { department: 'Marketing', location: 'San Francisco', headcount: 8 },
  { department: 'Marketing', location: 'Denver', headcount: 5 },
  { department: 'Marketing', location: 'Austin', headcount: 3 },
  { department: 'Marketing', location: 'Remote', headcount: 2 },
  { department: 'Sales', location: 'San Francisco', headcount: 8 },
  { department: 'Sales', location: 'Denver', headcount: 10 },
  { department: 'Sales', location: 'Austin', headcount: 6 },
  { department: 'Sales', location: 'Remote', headcount: 4 },
  { department: 'Customer Success', location: 'San Francisco', headcount: 6 },
  { department: 'Customer Success', location: 'Denver', headcount: 8 },
  { department: 'Customer Success', location: 'Austin', headcount: 5 },
  { department: 'Customer Success', location: 'Remote', headcount: 3 },
  { department: 'Finance', location: 'San Francisco', headcount: 5 },
  { department: 'Finance', location: 'Denver', headcount: 4 },
  { department: 'Finance', location: 'Austin', headcount: 2 },
  { department: 'Finance', location: 'Remote', headcount: 1 },
  { department: 'HR', location: 'San Francisco', headcount: 4 },
  { department: 'HR', location: 'Denver', headcount: 3 },
  { department: 'HR', location: 'Austin', headcount: 2 },
  { department: 'HR', location: 'Remote', headcount: 1 },
  { department: 'IT', location: 'San Francisco', headcount: 5 },
  { department: 'IT', location: 'Denver', headcount: 6 },
  { department: 'IT', location: 'Austin', headcount: 4 },
  { department: 'IT', location: 'Remote', headcount: 6 },
  { department: 'Executive', location: 'San Francisco', headcount: 4 },
  { department: 'Executive', location: 'Denver', headcount: 3 },
  { department: 'Executive', location: 'Austin', headcount: 2 },
  { department: 'Executive', location: 'Remote', headcount: 2 },
];

// Inactive employee data — 16 total. Active (187) + Inactive (16) = 203.
export const scene3InactiveHeadcountData: HeadcountRow[] = [
  { department: 'Engineering', location: 'San Francisco', headcount: 3 },
  { department: 'Engineering', location: 'Denver', headcount: 2 },
  { department: 'Product', location: 'San Francisco', headcount: 1 },
  { department: 'Product', location: 'Austin', headcount: 1 },
  { department: 'Marketing', location: 'Denver', headcount: 1 },
  { department: 'Marketing', location: 'Remote', headcount: 1 },
  { department: 'Sales', location: 'San Francisco', headcount: 2 },
  { department: 'Sales', location: 'Austin', headcount: 1 },
  { department: 'Customer Success', location: 'Denver', headcount: 1 },
  { department: 'Finance', location: 'San Francisco', headcount: 1 },
  { department: 'HR', location: 'San Francisco', headcount: 1 },
  { department: 'IT', location: 'Remote', headcount: 1 },
];

export const scene3SummaryMessage = `Your headcount report is ready! Here's what I built:
- 187 active employees across 9 departments and 4 locations
- Engineering is the largest department (42)
- San Francisco is the largest location (68 total)

You can edit the report directly or tell me what to change.`;

export const scene3EditIntents: EditIntent[] = [
  {
    id: 'add-tenure',
    keywords: ['add', 'column', 'tenure', 'years', 'seniority', 'length', 'service', 'average', 'avg'],
    thinkingText: 'Calculating tenure...',
    thinkingDuration: 1500,
    response: "Added an Average Tenure column. Engineering has the lowest average at 1.8 years — that tracks with the recent hiring push.",
    canvasUpdate: 'add-tenure-column',
  },
  {
    id: 'add-start-date',
    keywords: ['start', 'date', 'hire', 'joined', 'started', 'add', 'when'],
    thinkingText: 'Adding start date column...',
    thinkingDuration: 1200,
    response: 'Added a Start Date column. I can see a cluster of recent hires in Engineering — 8 people started in the last 6 months.',
    canvasUpdate: 'add-start-date-column',
  },
  {
    id: 'show-inactive',
    keywords: ['inactive', 'terminated', 'all', 'everyone', 'include', 'former', 'show', 'left', 'status'],
    thinkingText: 'Updating employee filter...',
    thinkingDuration: 1000,
    response: 'Updated to include all employees. The report now shows 203 records — 187 active and 16 inactive. Inactive employees are highlighted in the table.',
    canvasUpdate: 'show-inactive',
  },
  {
    id: 'regroup-location',
    keywords: ['group', 'location', 'first', 'swap', 'switch', 'regroup', 'flip', 'reverse'],
    thinkingText: 'Reorganizing the report...',
    thinkingDuration: 1200,
    response: 'Done! The report is now grouped by Location first, then Department. San Francisco is the largest location with 68 employees.',
    canvasUpdate: 'regroup-by-location',
  },
];

export const scene3EditFallback: DemoFallback = {
  response: "I'm not sure how to apply that change. You can ask me to add a column (like start date or tenure), change the grouping, or update the employee filter.",
};

export const scene3FilterAcknowledgments: Record<string, Record<string, string>> = {
  status: {
    'All Employees': 'Updated to show all employees. The report now includes 203 records (187 active + 16 inactive).',
    'Inactive Employees': 'Filtered to inactive employees only. Showing 16 records.',
    'Active Employees': '',
  },
  group1: {
    'Location': 'Updated! The report is now grouped by Location first.',
    'Job Title': 'Updated! The report is now grouped by Job Title.',
    'None': 'Removed the primary grouping. Showing a flat list.',
    'Department': '',
  },
  group2: {
    'Department': 'Done — changed the secondary grouping to Department.',
    'Start Date': 'Done — now sub-grouped by Start Date.',
    'None': 'Removed the secondary grouping.',
    'Location': '',
  },
};

export const scene3RecentlyViewedReports: RecentlyViewedReport[] = [
  { name: 'Time Off', lastViewed: 'Today', createdBy: 'Rad Bencher' },
  { name: 'Headcount by Department', lastViewed: 'Mar 8', createdBy: 'Rad Bencher' },
  { name: 'Turnover Rate — Q1', lastViewed: 'Mar 5', createdBy: 'Woger Roods' },
  { name: 'Compensation Summary', lastViewed: 'Mar 1', createdBy: 'Rad Bencher' },
];
