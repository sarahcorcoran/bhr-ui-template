// Morgan Riley's employee profile — context for the AskBambooHR prototype
// Source: full employee context JSON provided for Sprint 1

export interface Manager {
  name: string;
  title: string;
  email: string;
}

export interface TimeOffBalance {
  type: string;
  available: number;
  used: number;
  unit: string;
  accrualRate: string;
}

export interface TimeOffRequest {
  dates: string;
  type: string;
  status: string;
  hours: number;
}

export interface CompanyHoliday {
  date: string;
  name: string;
}

export interface TimeOffPolicy {
  maxConsecutiveDays: number;
  requiresApproval: boolean;
  approver: string;
  minimumNotice: string;
  halfDayAllowed: boolean;
}

export interface ExpenseEntry {
  date: string;
  description: string;
  category: string;
  amount: number;
  status: string;
}

export interface ExpensePolicy {
  requiresReceipt: boolean;
  receiptThreshold: number;
  approver: string;
  maxSingleExpense: number;
  reimbursementTimeline: string;
}

export interface EmployeeContext {
  employee: {
    name: string;
    preferredName: string;
    pronouns: string;
    employeeId: string;
    email: string;
    phone: string;
    department: string;
    team: string;
    jobTitle: string;
    location: string;
    startDate: string;
    manager: Manager;
    directReports: string[];
  };
  timeOff: {
    balances: TimeOffBalance[];
    upcomingRequests: TimeOffRequest[];
    companyHolidays: CompanyHoliday[];
    policy: TimeOffPolicy;
  };
  expenses: {
    recentExpenses: ExpenseEntry[];
    monthlyBudget: { limit: number; spent: number; remaining: number };
    categories: string[];
    policy: ExpensePolicy;
  };
  employeeInfo: {
    currentAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
    editableFields: string[];
  };
  currentDate: string;
  currentDay: string;
}

export const employeeContext: EmployeeContext = {
  employee: {
    name: 'Morgan Riley',
    preferredName: 'Morgan',
    pronouns: 'they/them',
    employeeId: 'EMP-4821',
    email: 'morgan.riley@acmecorp.com',
    phone: '(801) 555-0147',
    department: 'Product Design',
    team: 'Growth Squad',
    jobTitle: 'Senior Product Designer',
    location: 'Salt Lake City, UT (Remote)',
    startDate: '2022-03-14',
    manager: {
      name: 'Jamie Chen',
      title: 'Director of Product Design',
      email: 'jamie.chen@acmecorp.com',
    },
    directReports: [],
  },
  timeOff: {
    balances: [
      { type: 'Vacation', available: 64, used: 16, unit: 'hours', accrualRate: '6.67 hrs/month' },
      { type: 'Sick/Medical', available: 48, used: 8, unit: 'hours', accrualRate: '4 hrs/month' },
      { type: 'Personal', available: 16, used: 0, unit: 'hours', accrualRate: 'N/A — annual grant' },
      { type: 'Bereavement', available: 24, used: 0, unit: 'hours', accrualRate: 'N/A — as needed' },
    ],
    upcomingRequests: [
      { dates: '2026-03-20 to 2026-03-21', type: 'Vacation', status: 'Approved', hours: 16 },
    ],
    companyHolidays: [
      { date: '2026-02-16', name: "Presidents' Day" },
      { date: '2026-05-25', name: 'Memorial Day' },
      { date: '2026-07-03', name: 'Independence Day (observed)' },
    ],
    policy: {
      maxConsecutiveDays: 10,
      requiresApproval: true,
      approver: 'Jamie Chen',
      minimumNotice: '3 business days preferred',
      halfDayAllowed: true,
    },
  },
  expenses: {
    recentExpenses: [
      { date: '2026-02-10', description: 'Figma annual license', category: 'Software', amount: 144.00, status: 'Approved' },
      { date: '2026-01-28', description: 'Team offsite lunch', category: 'Meals & Entertainment', amount: 187.50, status: 'Approved' },
    ],
    monthlyBudget: { limit: 500, spent: 160, remaining: 340 },
    categories: ['Meals & Entertainment', 'Travel', 'Office Supplies', 'Software', 'Professional Development', 'Other'],
    policy: {
      requiresReceipt: true,
      receiptThreshold: 25.00,
      approver: 'Jamie Chen',
      maxSingleExpense: 500,
      reimbursementTimeline: '2-3 pay cycles',
    },
  },
  employeeInfo: {
    currentAddress: {
      street: '742 Elm Street, Apt 3B',
      city: 'Salt Lake City',
      state: 'UT',
      zip: '84101',
    },
    emergencyContact: {
      name: 'Alex Riley',
      relationship: 'Spouse',
      phone: '(801) 555-0193',
    },
    editableFields: ['address', 'phone', 'emergencyContact', 'bankInfo', 'preferredName', 'pronouns'],
  },
  currentDate: '2026-02-18',
  currentDay: 'Wednesday',
};

// Convenience accessors
export const employee = employeeContext.employee;
export const managerName = employee.manager.name;
export const approver = managerName;
