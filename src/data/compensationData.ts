// Mock data for Compensation Benchmarks prototype

export interface Employee {
  id: string;
  name: string;
  avatar: string;
  location: string;
  annualizedPayRate: number;
  compaRatio: number;
  rangePenetration: number;
  yoe: number;
  payBandMin: number;
  payBandMax: number;
}

export interface Benchmark {
  id: string;
  source: string;
  matchedTitle: string;
  color: string;
  age: string;
  rangeType: 'min-mid-max' | 'percentile';
  values: {
    label: string;
    value: number;
  }[];
}

export interface Job {
  id: string;
  title: string;
  level: string;
  department: string;
  region: string;
  location: string;
  payRate: number;
  payRangeMin: number;
  payRangeMax: number;
  payBandMin: number;
  payBandMax: number;
  payBandMid: number;
  employees: Employee[];
  benchmarks: Benchmark[];
}

export interface Department {
  name: string;
  region: string;
  jobs: Job[];
}

export interface FilterMatch {
  description: boolean;
  location: boolean;
  companySize: boolean;
  industry: boolean;
  level: boolean;
}

export interface MercerResult {
  id: string;
  title: string;
  level: string;
  location: string;
  basePay25: number;
  basePay50: number;
  basePay75: number;
  companiesSurveyed: number;
  employeesSurveyed: number;
  source: string;
  year: string;
  industry: string;
  confidence: number;
  description: string;
  filterMatches: FilterMatch;
}

// Avatar colors for placeholder dots
const avatarColors = [
  '#E8A87C', '#D27D60', '#C38D9E', '#85CDCA', '#41B3A3',
  '#E27D60', '#659DBD', '#DAAD86', '#BC986A', '#8D8741',
  '#C39BD3', '#7FB3D8', '#82E0AA', '#F0B27A', '#AEB6BF',
];

function getAvatarColor(index: number): string {
  return avatarColors[index % avatarColors.length];
}

// Helper to generate employee positions on pay range
// Most employees (all but ~1 outlier) land within the band.
function generateEmployees(
  jobId: string,
  count: number,
  bandMin: number,
  bandMax: number,
  outlierIndex?: number, // which employee index is the outlier (above band)
  outlierPay?: number,   // explicit pay for the outlier
): Employee[] {
  const names = [
    'Theresa Webb', 'Wade Warren', 'Joseph Simmons', 'Ralph Edwards',
    'Jane Cooper', 'Robert Fox', 'Darlene Robertson', 'Jason Thompson',
    'Leslie Alexander', 'Cameron Williams', 'Brooklyn Stone', 'Dianne Russell',
  ];
  const locations = ['Chicago, Illinois', 'Lindon, Utah', 'Salt Lake City, Utah', 'Austin, Texas'];
  const range = bandMax - bandMin;
  const mid = (bandMin + bandMax) / 2;

  // Predefined spread positions within band (0 = bandMin, 1 = bandMax)
  // Concentrates most employees in the 15%-85% zone with gentle spread
  const spreadPositions: number[] = [];
  for (let i = 0; i < count; i++) {
    if (outlierIndex !== undefined && i === outlierIndex) {
      spreadPositions.push(-1); // placeholder — will use outlierPay
    } else {
      // Spread remaining employees across 10%-90% of range
      const inBandCount = outlierIndex !== undefined ? count - 1 : count;
      const idx = outlierIndex !== undefined && i > outlierIndex ? i - 1 : i;
      const t = inBandCount <= 1 ? 0.5 : 0.10 + (idx / (inBandCount - 1)) * 0.80;
      spreadPositions.push(t);
    }
  }

  return Array.from({ length: count }, (_, i) => {
    let payRate: number;
    if (outlierIndex !== undefined && i === outlierIndex && outlierPay) {
      payRate = outlierPay;
    } else {
      payRate = Math.round((bandMin + range * spreadPositions[i]) / 1000) * 1000;
    }
    const compaRatio = +(payRate / mid).toFixed(2);
    const penetration = Math.round(((payRate - bandMin) / range) * 100);

    return {
      id: `${jobId}-emp-${i}`,
      name: names[i % names.length],
      avatar: getAvatarColor(i),
      location: locations[i % locations.length],
      annualizedPayRate: payRate,
      compaRatio,
      rangePenetration: penetration,
      yoe: 2 + Math.floor(i * 1.8) + (i % 3),
      payBandMin: bandMin,
      payBandMax: bandMax,
    };
  });
}

// ============================================
// DEPARTMENTS AND JOBS
// ============================================

export const departments: Department[] = [
  {
    name: 'Engineering',
    region: 'North America',
    jobs: [
      {
        id: 'eng-qa',
        title: 'QA Engineer',
        level: 'L4',
        department: 'Engineering',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 88000,
        payRangeMin: 80000,
        payRangeMax: 98000,
        payBandMin: 80000,
        payBandMax: 98000,
        payBandMid: 89000,
        employees: generateEmployees('eng-qa', 6, 80000, 98000, 5, 103000),
        benchmarks: [
          {
            id: 'eng-qa-b1',
            source: 'Salary.com',
            matchedTitle: 'QA Engineer',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 78000 },
              { label: 'Mid', value: 90000 },
              { label: 'Max', value: 102000 },
            ],
          },
          {
            id: 'eng-qa-b2',
            source: 'Comptryx',
            matchedTitle: 'Quality Assurance Analyst',
            color: '#38312f',
            age: '6 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 79000 },
              { label: 'Mid', value: 91000 },
              { label: 'Max', value: 104000 },
            ],
          },
        ],
      },
      {
        id: 'eng-fe',
        title: 'Front End Developer',
        level: 'L5',
        department: 'Engineering',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 105000,
        payRangeMin: 95000,
        payRangeMax: 118000,
        payBandMin: 95000,
        payBandMax: 118000,
        payBandMid: 106500,
        employees: generateEmployees('eng-fe', 8, 95000, 118000, 7, 123000),
        benchmarks: [
          {
            id: 'eng-fe-b1',
            source: 'Salary.com',
            matchedTitle: 'Front End Developer',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 92000 },
              { label: 'Mid', value: 107000 },
              { label: 'Max', value: 122000 },
            ],
          },
          {
            id: 'eng-fe-b2',
            source: 'Comptryx',
            matchedTitle: 'Software Developer - Front End',
            color: '#38312f',
            age: '3 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 94000 },
              { label: 'Mid', value: 110000 },
              { label: 'Max', value: 125000 },
            ],
          },
          {
            id: 'eng-fe-b3',
            source: 'Mercer',
            matchedTitle: 'Software Developer',
            color: '#0051A8',
            age: '2 years ago',
            rangeType: 'percentile',
            values: [
              { label: '25th %', value: 93000 },
              { label: '50th %', value: 108000 },
              { label: '75th %', value: 124000 },
            ],
          },
        ],
      },
      {
        id: 'eng-be',
        title: 'Back End Developer',
        level: 'L6',
        department: 'Engineering',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 128000,
        payRangeMin: 115000,
        payRangeMax: 140000,
        payBandMin: 115000,
        payBandMax: 140000,
        payBandMid: 127500,
        employees: generateEmployees('eng-be', 7, 115000, 140000, 6, 146000),
        benchmarks: [
          {
            id: 'eng-be-b1',
            source: 'Salary.com',
            matchedTitle: 'Backend Software Engineer',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 112000 },
              { label: 'Mid', value: 128000 },
              { label: 'Max', value: 145000 },
            ],
          },
          {
            id: 'eng-be-b2',
            source: 'Mercer',
            matchedTitle: 'Senior Software Engineer',
            color: '#0051A8',
            age: '1 year ago',
            rangeType: 'percentile',
            values: [
              { label: '25th %', value: 114000 },
              { label: '50th %', value: 131000 },
              { label: '75th %', value: 148000 },
            ],
          },
        ],
      },
      {
        id: 'eng-mgr',
        title: 'Engineering Manager',
        level: 'M2',
        department: 'Engineering',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 148000,
        payRangeMin: 135000,
        payRangeMax: 162000,
        payBandMin: 135000,
        payBandMax: 162000,
        payBandMid: 148500,
        employees: generateEmployees('eng-mgr', 6, 135000, 162000, 0, 128000),
        benchmarks: [
          {
            id: 'eng-mgr-b1',
            source: 'Salary.com',
            matchedTitle: 'Engineering Manager',
            color: '#D4A843',
            age: '8 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 132000 },
              { label: 'Mid', value: 150000 },
              { label: 'Max', value: 168000 },
            ],
          },
          {
            id: 'eng-mgr-b2',
            source: 'Comptryx',
            matchedTitle: 'Software Engineering Manager',
            color: '#38312f',
            age: '4 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 136000 },
              { label: 'Mid', value: 153000 },
              { label: 'Max', value: 170000 },
            ],
          },
        ],
      },
      {
        id: 'eng-vp',
        title: 'VP of Engineering',
        level: 'M4',
        department: 'Engineering',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 195000,
        payRangeMin: 180000,
        payRangeMax: 215000,
        payBandMin: 180000,
        payBandMax: 215000,
        payBandMid: 197500,
        employees: generateEmployees('eng-vp', 3, 180000, 215000),
        benchmarks: [
          {
            id: 'eng-vp-b1',
            source: 'Salary.com',
            matchedTitle: 'VP Engineering',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 176000 },
              { label: 'Mid', value: 200000 },
              { label: 'Max', value: 224000 },
            ],
          },
          {
            id: 'eng-vp-b2',
            source: 'Mercer',
            matchedTitle: 'VP, Software Engineering',
            color: '#0051A8',
            age: '1 year ago',
            rangeType: 'percentile',
            values: [
              { label: '25th %', value: 180000 },
              { label: '50th %', value: 205000 },
              { label: '75th %', value: 230000 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'G&A',
    region: 'North America',
    jobs: [
      {
        id: 'ga-ceo',
        title: 'CEO',
        level: 'M6',
        department: 'G&A',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 275000,
        payRangeMin: 250000,
        payRangeMax: 305000,
        payBandMin: 250000,
        payBandMax: 305000,
        payBandMid: 277500,
        employees: generateEmployees('ga-ceo', 1, 250000, 305000),
        benchmarks: [
          {
            id: 'ga-ceo-b1',
            source: 'Salary.com',
            matchedTitle: 'Chief Executive Officer',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 245000 },
              { label: 'Mid', value: 280000 },
              { label: 'Max', value: 315000 },
            ],
          },
          {
            id: 'ga-ceo-b2',
            source: 'Mercer',
            matchedTitle: 'CEO / President',
            color: '#0051A8',
            age: '6 months ago',
            rangeType: 'percentile',
            values: [
              { label: '25th %', value: 250000 },
              { label: '50th %', value: 290000 },
              { label: '75th %', value: 330000 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Product',
    region: 'North America',
    jobs: [
      {
        id: 'prod-designer',
        title: 'Product Designer',
        level: 'L3',
        department: 'Product',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 82000,
        payRangeMin: 74000,
        payRangeMax: 92000,
        payBandMin: 74000,
        payBandMax: 92000,
        payBandMid: 83000,
        employees: generateEmployees('prod-designer', 6, 74000, 92000),
        benchmarks: [
          {
            id: 'prod-designer-b1',
            source: 'Salary.com',
            matchedTitle: 'Product Designer',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 72000 },
              { label: 'Mid', value: 84000 },
              { label: 'Max', value: 96000 },
            ],
          },
          {
            id: 'prod-designer-b2',
            source: 'Comptryx',
            matchedTitle: 'UX/Product Designer',
            color: '#38312f',
            age: '3 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 74000 },
              { label: 'Mid', value: 86000 },
              { label: 'Max', value: 97000 },
            ],
          },
        ],
      },
      {
        id: 'prod-pm',
        title: 'Product Manager',
        level: 'L4',
        department: 'Product',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 102000,
        payRangeMin: 92000,
        payRangeMax: 112000,
        payBandMin: 92000,
        payBandMax: 112000,
        payBandMid: 102000,
        employees: generateEmployees('prod-pm', 7, 92000, 112000, 6, 117000),
        benchmarks: [
          {
            id: 'prod-pm-b1',
            source: 'Salary.com',
            matchedTitle: 'Product Manager',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 90000 },
              { label: 'Mid', value: 103000 },
              { label: 'Max', value: 116000 },
            ],
          },
          {
            id: 'prod-pm-b2',
            source: 'Mercer',
            matchedTitle: 'Product Manager',
            color: '#0051A8',
            age: '1 year ago',
            rangeType: 'percentile',
            values: [
              { label: '25th %', value: 92000 },
              { label: '50th %', value: 105000 },
              { label: '75th %', value: 118000 },
            ],
          },
        ],
      },
      {
        id: 'prod-sr-designer',
        title: 'Senior Product Designer',
        level: 'L4',
        department: 'Product',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 110000,
        payRangeMin: 100000,
        payRangeMax: 122000,
        payBandMin: 100000,
        payBandMax: 122000,
        payBandMid: 111000,
        employees: generateEmployees('prod-sr-designer', 5, 100000, 122000),
        benchmarks: [
          {
            id: 'prod-sr-designer-b1',
            source: 'Salary.com',
            matchedTitle: 'Senior Product Designer',
            color: '#D4A843',
            age: '10 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 98000 },
              { label: 'Mid', value: 112000 },
              { label: 'Max', value: 126000 },
            ],
          },
        ],
      },
      {
        id: 'prod-sr-pm',
        title: 'Senior Product Manager',
        level: 'L5',
        department: 'Product',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 135000,
        payRangeMin: 122000,
        payRangeMax: 148000,
        payBandMin: 122000,
        payBandMax: 148000,
        payBandMid: 135000,
        employees: generateEmployees('prod-sr-pm', 4, 122000, 148000),
        benchmarks: [
          {
            id: 'prod-sr-pm-b1',
            source: 'Salary.com',
            matchedTitle: 'Senior Product Manager',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 120000 },
              { label: 'Mid', value: 136000 },
              { label: 'Max', value: 152000 },
            ],
          },
          {
            id: 'prod-sr-pm-b2',
            source: 'Mercer',
            matchedTitle: 'Senior Product Manager',
            color: '#0051A8',
            age: '8 months ago',
            rangeType: 'percentile',
            values: [
              { label: '25th %', value: 122000 },
              { label: '50th %', value: 138000 },
              { label: '75th %', value: 154000 },
            ],
          },
        ],
      },
      {
        id: 'prod-vp',
        title: 'VP of Product',
        level: 'M3',
        department: 'Product',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 185000,
        payRangeMin: 170000,
        payRangeMax: 200000,
        payBandMin: 170000,
        payBandMax: 200000,
        payBandMid: 185000,
        employees: generateEmployees('prod-vp', 2, 170000, 200000),
        benchmarks: [
          {
            id: 'prod-vp-b1',
            source: 'Salary.com',
            matchedTitle: 'VP of Product',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 168000 },
              { label: 'Mid', value: 188000 },
              { label: 'Max', value: 208000 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'People Operations',
    region: 'North America',
    jobs: [
      {
        id: 'po-recruiter',
        title: 'Technical Recruiter',
        level: 'L3',
        department: 'People Operations',
        region: 'North America',
        location: 'Lindon, UT',
        payRate: 72000,
        payRangeMin: 65000,
        payRangeMax: 84000,
        payBandMin: 65000,
        payBandMax: 84000,
        payBandMid: 74500,
        employees: [
          { id: 'po-r-1', name: 'Theresa Webb', avatar: '#E8A87C', location: 'Lindon, Utah', annualizedPayRate: 66000, compaRatio: 0.89, rangePenetration: 5, yoe: 2, payBandMin: 65000, payBandMax: 84000 },
          { id: 'po-r-2', name: 'Wade Warren', avatar: '#D27D60', location: 'Lindon, Utah', annualizedPayRate: 69000, compaRatio: 0.93, rangePenetration: 21, yoe: 3, payBandMin: 65000, payBandMax: 84000 },
          { id: 'po-r-3', name: 'Joseph Simmons', avatar: '#C38D9E', location: 'Lindon, Utah', annualizedPayRate: 72000, compaRatio: 0.97, rangePenetration: 37, yoe: 4, payBandMin: 65000, payBandMax: 84000 },
          { id: 'po-r-4', name: 'Ralph Edwards', avatar: '#85CDCA', location: 'Salt Lake City, Utah', annualizedPayRate: 75000, compaRatio: 1.01, rangePenetration: 53, yoe: 5, payBandMin: 65000, payBandMax: 84000 },
          { id: 'po-r-5', name: 'Jane Cooper', avatar: '#41B3A3', location: 'Salt Lake City, Utah', annualizedPayRate: 78000, compaRatio: 1.05, rangePenetration: 68, yoe: 7, payBandMin: 65000, payBandMax: 84000 },
          { id: 'po-r-6', name: 'Robert Fox', avatar: '#E27D60', location: 'Lindon, Utah', annualizedPayRate: 82000, compaRatio: 1.10, rangePenetration: 89, yoe: 9, payBandMin: 65000, payBandMax: 84000 },
          { id: 'po-r-7', name: 'Darlene Robertson', avatar: '#659DBD', location: 'Salt Lake City, Utah', annualizedPayRate: 83000, compaRatio: 1.11, rangePenetration: 95, yoe: 10, payBandMin: 65000, payBandMax: 84000 },
          { id: 'po-r-8', name: 'Jason Thompson', avatar: '#DAAD86', location: 'Lindon, Utah', annualizedPayRate: 91000, compaRatio: 1.22, rangePenetration: 137, yoe: 14, payBandMin: 65000, payBandMax: 84000 },
        ],
        benchmarks: [
          {
            id: 'po-r-b1',
            source: 'Salary.com',
            matchedTitle: 'Technical Recruiter',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 62000 },
              { label: 'Mid', value: 74000 },
              { label: 'Max', value: 86000 },
            ],
          },
          {
            id: 'po-r-b2',
            source: 'Comptryx',
            matchedTitle: 'Recruiting Specialist',
            color: '#38312f',
            age: '3 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 64000 },
              { label: 'Mid', value: 75000 },
              { label: 'Max', value: 87000 },
            ],
          },
        ],
      },
      {
        id: 'po-hr',
        title: 'HR Generalist',
        level: 'L2',
        department: 'People Operations',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 62000,
        payRangeMin: 56000,
        payRangeMax: 70000,
        payBandMin: 56000,
        payBandMax: 70000,
        payBandMid: 63000,
        employees: generateEmployees('po-hr', 6, 56000, 70000),
        benchmarks: [
          {
            id: 'po-hr-b1',
            source: 'Salary.com',
            matchedTitle: 'HR Generalist',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 54000 },
              { label: 'Mid', value: 64000 },
              { label: 'Max', value: 74000 },
            ],
          },
          {
            id: 'po-hr-b2',
            source: 'Comptryx',
            matchedTitle: 'Human Resources Generalist',
            color: '#38312f',
            age: '5 months ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 55000 },
              { label: 'Mid', value: 65000 },
              { label: 'Max', value: 75000 },
            ],
          },
        ],
      },
      {
        id: 'po-mgr',
        title: 'People Operations Manager',
        level: 'M2',
        department: 'People Operations',
        region: 'North America',
        location: 'Chicago, IL',
        payRate: 108000,
        payRangeMin: 96000,
        payRangeMax: 118000,
        payBandMin: 96000,
        payBandMax: 118000,
        payBandMid: 107000,
        employees: generateEmployees('po-mgr', 4, 96000, 118000),
        benchmarks: [
          {
            id: 'po-mgr-b1',
            source: 'Salary.com',
            matchedTitle: 'People Operations Manager',
            color: '#D4A843',
            age: '1 year ago',
            rangeType: 'min-mid-max',
            values: [
              { label: 'Min', value: 94000 },
              { label: 'Mid', value: 108000 },
              { label: 'Max', value: 122000 },
            ],
          },
          {
            id: 'po-mgr-b2',
            source: 'Mercer',
            matchedTitle: 'HR Operations Manager',
            color: '#0051A8',
            age: '6 months ago',
            rangeType: 'percentile',
            values: [
              { label: '25th %', value: 96000 },
              { label: '50th %', value: 110000 },
              { label: '75th %', value: 124000 },
            ],
          },
        ],
      },
    ],
  },
];

// All jobs flat
export const allJobs: Job[] = departments.flatMap(d => d.jobs);

// ============================================
// MERCER SEARCH RESULTS (for Technical Recruiter)
// ============================================

export const mercerResults: MercerResult[] = [
  {
    id: 'mercer-1',
    title: 'Technical Recruiting Specialist',
    level: 'P4',
    location: 'Salt Lake City, UT',
    basePay25: 66500,
    basePay50: 75200,
    basePay75: 85400,
    companiesSurveyed: 180,
    employeesSurveyed: 950,
    source: 'Mercer SMB',
    year: '2024',
    industry: 'All Industries',
    confidence: 94,
    description: 'Manages full-cycle technical recruiting processes including sourcing, screening, and hiring technology professionals. Partners directly with engineering and product hiring managers to understand technical requirements and build talent pipelines. Conducts technical phone screens and coordinates panel interviews across multiple teams.',
    filterMatches: { description: true, location: true, companySize: true, industry: true, level: false },
  },
  {
    id: 'mercer-2',
    title: 'Talent Acquisition Specialist - Technology',
    level: 'P4',
    location: 'Salt Lake City, UT',
    basePay25: 63200,
    basePay50: 72800,
    basePay75: 82100,
    companiesSurveyed: 220,
    employeesSurveyed: 1200,
    source: 'Mercer SMB',
    year: '2024',
    industry: 'All Industries',
    confidence: 87,
    description: 'Develops and executes talent acquisition strategies focused on technology roles. Manages candidate experience from initial outreach through offer negotiation. Leverages recruiting technology platforms and data analytics to optimize hiring outcomes.',
    filterMatches: { description: true, location: true, companySize: true, industry: true, level: false },
  },
  {
    id: 'mercer-3',
    title: 'Recruiting Coordinator - Engineering',
    level: 'P3',
    location: 'Salt Lake City, UT',
    basePay25: 52800,
    basePay50: 62400,
    basePay75: 73200,
    companiesSurveyed: 150,
    employeesSurveyed: 680,
    source: 'Mercer SMB',
    year: '2024',
    industry: 'Technology',
    confidence: 78,
    description: 'Coordinates interview scheduling, candidate communications, and onboarding logistics for engineering hiring. Supports recruiters with pipeline management and applicant tracking system administration. Generates recruiting metrics and reports for leadership review.',
    filterMatches: { description: true, location: true, companySize: true, industry: false, level: false },
  },
  {
    id: 'mercer-4',
    title: 'Senior Technical Recruiter',
    level: 'P5',
    location: 'Salt Lake City, UT',
    basePay25: 82000,
    basePay50: 95500,
    basePay75: 112000,
    companiesSurveyed: 140,
    employeesSurveyed: 520,
    source: 'Mercer SMB',
    year: '2024',
    industry: 'All Industries',
    confidence: 71,
    description: 'Leads strategic recruiting initiatives for senior and leadership-level technology positions. Mentors junior recruiters and establishes best practices for technical assessment processes. Builds and maintains executive-level candidate relationships for hard-to-fill specialized roles.',
    filterMatches: { description: true, location: true, companySize: false, industry: true, level: false },
  },
  {
    id: 'mercer-5',
    title: 'HR Generalist with Recruiting Focus',
    level: 'P3',
    location: 'Provo, UT',
    basePay25: 48500,
    basePay50: 58200,
    basePay75: 69800,
    companiesSurveyed: 95,
    employeesSurveyed: 380,
    source: 'Mercer SMB',
    year: '2024',
    industry: 'All Industries',
    confidence: 62,
    description: 'Handles a blend of human resources generalist duties with a primary focus on recruiting and talent acquisition. Manages employee relations, benefits administration, and compliance alongside recruiting responsibilities. Typically found in smaller organizations where HR roles require broader scope.',
    filterMatches: { description: false, location: false, companySize: true, industry: true, level: false },
  },
];

// ============================================
// MERCER SEARCH RESULTS FOR OTHER JOBS
// ============================================

export function getMercerResultsForJob(jobId: string): MercerResult[] {
  if (jobId === 'po-recruiter') return mercerResults;

  // Return generic results for other jobs
  const job = allJobs.find(j => j.id === jobId);
  if (!job) return [];

  const mid = job.payBandMid;
  return [
    {
      id: `${jobId}-m1`,
      title: `${job.title} Specialist`,
      level: job.level.startsWith('M') ? job.level : 'P4',
      location: 'Salt Lake City, UT',
      basePay25: Math.round(mid * 0.86),
      basePay50: Math.round(mid * 0.97),
      basePay75: Math.round(mid * 1.08),
      companiesSurveyed: 180,
      employeesSurveyed: 950,
      source: 'Mercer SMB',
      year: '2024',
      industry: 'All Industries',
      confidence: 91,
      description: `Performs core ${job.title.toLowerCase()} functions with specialized expertise. Works independently on complex assignments and collaborates with cross-functional teams.`,
      filterMatches: { description: true, location: true, companySize: true, industry: true, level: false },
    },
    {
      id: `${jobId}-m2`,
      title: `${job.title} - Senior`,
      level: job.level.startsWith('M') ? job.level : 'P5',
      location: 'Salt Lake City, UT',
      basePay25: Math.round(mid * 0.96),
      basePay50: Math.round(mid * 1.08),
      basePay75: Math.round(mid * 1.20),
      companiesSurveyed: 140,
      employeesSurveyed: 720,
      source: 'Mercer SMB',
      year: '2024',
      industry: 'All Industries',
      confidence: 76,
      description: `Senior-level ${job.title.toLowerCase()} role with expanded scope and team leadership responsibilities. Mentors junior staff and drives strategic initiatives.`,
      filterMatches: { description: true, location: true, companySize: false, industry: true, level: false },
    },
  ];
}

// Format currency
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}k`;
    }
    return `$${value}`;
  }
  return `$${value.toLocaleString()}`;
}

// Format currency with K notation
export function formatCurrencyK(value: number): string {
  return `$${Math.round(value / 1000)}K`;
}
