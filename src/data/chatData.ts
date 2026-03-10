export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  suggestions?: string[];
  component?: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export const defaultConversation: ChatConversation = {
  id: '1',
  title: 'Employee Onboarding',
  messages: [
    {
      id: '1',
      type: 'user',
      text: 'How can we make this better for you?',
    },
    {
      id: '2',
      type: 'ai',
      text: `Here are a few improvements I recommend:

1. **Personalize the onboarding journey** - Tailor experiences to each new hire's role and background
2. **Streamline administrative tasks** - Reduce paperwork with automation and digital workflows
3. **Strengthen human connection** - Foster meaningful relationships from day one
4. **Provide clear milestones** - Track progress transparently with defined checkpoints`,
      suggestions: [
        'Set up employee welcome dashboard',
        'Assign onboarding buddies',
        'Add progress indicators',
      ],
    },
  ],
};

export const suggestionChips = [
  'Set up employee welcome dashboard',
  'Assign onboarding buddies',
  'Add progress indicators',
];

export const recentConversations: ChatConversation[] = [
  {
    id: '0',
    title: 'Markdown Check',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Show me all the markdown formatting features you support',
      },
      {
        id: '2',
        type: 'ai',
        text: `# Markdown Features Demo

I support a wide range of markdown formatting. Here's a comprehensive showcase:

## Text Formatting

- **Bold text** using double asterisks
- *Italic text* using single asterisks
- ***Bold and italic*** combined
- ~~Strikethrough text~~ using double tildes

## Headers

We support multiple heading levels:

### This is H3
#### This is H4
##### This is H5

## Lists

**Unordered list:**
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

**Ordered list:**
1. First step
2. Second step
3. Third step
4. Fourth step

## Task Lists

Here's a task checklist:

- [x] Completed task
- [x] Another completed task
- [ ] Pending task
- [ ] Another pending task

## Code

**Inline code:** Use \`const variable = "value"\` for inline code snippets.

**Code block:**

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message);
\`\`\`

\`\`\`json
{
  "name": "BambooHR",
  "type": "HRIS",
  "features": ["onboarding", "PTO", "payroll"]
}
\`\`\`

## Blockquotes

> This is a blockquote. It's great for highlighting important information or quotes from other sources.
>
> *You can also use formatting inside blockquotes.*

## Tables

Here's a comparison table:

| Feature | Basic Plan | Pro Plan | Enterprise |
|---------|-----------|----------|------------|
| Users | Up to 10 | Up to 50 | Unlimited |
| Storage | 10 GB | 100 GB | 1 TB |
| Support | Email | Priority | 24/7 Dedicated |
| Price | $29/mo | $99/mo | Custom |

## Links

Visit [BambooHR](https://www.bamboohr.com) for more information.

You can also check out our [documentation](https://help.bamboohr.com) or [contact support](https://www.bamboohr.com/contact).

## Horizontal Rule

Use horizontal rules to separate sections:

---

## Mixed Content

Here's an example combining multiple features:

**Project Status Update:**

1. **Phase 1: Planning** ✅
   - [x] Requirements gathering
   - [x] Architecture design
   - [x] Team allocation

2. **Phase 2: Development** 🚧
   - [x] Backend API setup
   - [ ] Frontend implementation
   - [ ] Database migration

3. **Phase 3: Testing** ⏳
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] User acceptance testing

> 💡 **Pro tip:** Use markdown to make your messages more readable and organized!

For questions, contact the development team at \`dev-team@company.com\`.`,
      },
    ],
  },
  {
    id: '1',
    title: 'Employee Onboarding',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'How can we make this better for you?',
      },
      {
        id: '2',
        type: 'ai',
        text: `Here are a few improvements I recommend:

1. **Personalize the onboarding journey** - Tailor experiences to each new hire's role and background
2. **Streamline administrative tasks** - Reduce paperwork with automation and digital workflows
3. **Strengthen human connection** - Foster meaningful relationships from day one
4. **Provide clear milestones** - Track progress transparently with defined checkpoints`,
        suggestions: [
          'Set up employee welcome dashboard',
          'Assign onboarding buddies',
          'Add progress indicators',
        ],
      },
    ],
  },
  {
    id: '2',
    title: 'PTO Policy Updates',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'What are the latest PTO policy changes?',
      },
      {
        id: '2',
        type: 'ai',
        text: `## Recent PTO Policy Updates

Here are the key changes for **2026**:

- **Unlimited PTO** for employees with 3+ years tenure
- *Minimum 2 weeks* vacation required annually
- Rollover policy extended to **10 days**

You can view the full policy document [here](https://bamboohr.com/pto-policy).`,
      },
    ],
  },
  {
    id: '3',
    title: 'Benefits Enrollment',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'When does benefits enrollment start?',
      },
      {
        id: '2',
        type: 'ai',
        text: 'Benefits enrollment begins on January 15, 2026 and runs through January 31, 2026. You can review and update your health insurance, dental, vision, and 401(k) selections during this period.',
      },
    ],
  },
  {
    id: '4',
    title: 'Performance Reviews',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Help me prepare for performance reviews',
      },
      {
        id: '2',
        type: 'ai',
        text: `### Performance Review Preparation

Here are the **key steps** to prepare:

1. **Review goal completion** from last quarter
2. **Gather peer feedback** and testimonials
3. **Document key achievements** with metrics
4. **Identify areas for growth** and development opportunities

> *Pro tip:* Use the STAR method (Situation, Task, Action, Result) when describing achievements.`,
      },
    ],
  },
  {
    id: '5',
    title: 'Review Upcoming Payroll Anomalies',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Show me any payroll anomalies for the upcoming pay period',
      },
      {
        id: '2',
        type: 'ai',
        text: `I found **3 potential payroll anomalies** for the upcoming pay period:

| Employee | Issue | Status |
|----------|-------|--------|
| John Smith | Overtime exceeds 40 hours | ⚠️ Review needed |
| Sarah Johnson | Missing timesheet approval | ❌ Action required |
| Mike Williams | Duplicate expense entry | ⚠️ Review needed |

Please review these before processing payroll.`,
      },
    ],
  },
  {
    id: '6',
    title: 'Active marketing employees',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'List all active employees in the marketing department',
      },
      {
        id: '2',
        type: 'ai',
        text: 'There are 12 active employees in Marketing:\n\n1. Jess Cordova - Director\n2. Alex Chen - Senior Manager\n3. Taylor Swift - Content Lead\n... and 9 more',
      },
    ],
  },
  {
    id: '7',
    title: 'Sally Lee PTO balance',
    messages: [
      {
        id: '1',
        type: 'user',
        text: "What is Sally Lee's current PTO balance?",
      },
      {
        id: '2',
        type: 'ai',
        text: "Sally Lee's PTO balance:\n\n- Vacation: 12 days remaining\n- Sick leave: 5 days remaining\n- Personal: 2 days remaining\n\nTotal: 19 days available",
      },
    ],
  },
  {
    id: '8',
    title: 'Upcoming Certificates Expiration',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Which employee certifications are expiring soon?',
      },
      {
        id: '2',
        type: 'ai',
        text: '5 certifications expiring in the next 30 days:\n\n1. CPR Certification - 3 employees\n2. OSHA Safety - 2 employees\n3. First Aid - 4 employees',
      },
    ],
  },
  {
    id: '9',
    title: 'Benefit Plan Set Up',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Help me set up a new benefit plan',
      },
      {
        id: '2',
        type: 'ai',
        text: "I can help you set up a new benefit plan. Here's what we'll need:\n\n1. Plan type (Health, Dental, Vision, etc.)\n2. Eligibility criteria\n3. Coverage details\n4. Employer contribution percentage",
      },
    ],
  },
  {
    id: '10',
    title: 'Engineering department org chart',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Show me the engineering department org chart',
      },
      {
        id: '2',
        type: 'ai',
        text: 'Engineering Department Structure:\n\nVP of Engineering: David Kim\n├── Director of Frontend: Lisa Park\n├── Director of Backend: James Wilson\n└── Director of DevOps: Maria Garcia',
      },
    ],
  },
  {
    id: '11',
    title: 'Onboarding Maddy Matthews',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Start onboarding process for new hire Maddy Matthews',
      },
      {
        id: '2',
        type: 'ai',
        text: `I'll help you onboard **Maddy Matthews**. Here's the checklist:

- [ ] Send welcome email
- [ ] Set up workstation
- [ ] Schedule orientation
- [ ] Assign onboarding buddy
- [ ] Create system accounts
- [ ] Order business cards

Use the command \`/onboarding start --employee="Maddy Matthews"\` to begin the automated process.`,
      },
    ],
  },
  {
    id: '12',
    title: 'Offboarding departing employees',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Show me the offboarding checklist for departing employees',
      },
      {
        id: '2',
        type: 'ai',
        text: 'Standard Offboarding Checklist:\n\n1. Exit interview scheduled\n2. Equipment return\n3. Access revocation\n4. Final paycheck processing\n5. COBRA notification',
      },
    ],
  },
  {
    id: '13',
    title: 'Welcome email to Cesar Berhow',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'Draft a welcome email for Cesar Berhow',
      },
      {
        id: '2',
        type: 'ai',
        text: `Here's a draft welcome email:

---

**Subject:** Welcome to BambooHR, Cesar! 🎉

Dear Cesar,

We're *thrilled* to have you join our team! Your first day is **Monday, February 3rd**, and we've prepared everything for your arrival.

**What to expect on Day 1:**
- 9:00 AM - Team meet & greet
- 10:30 AM - HR orientation
- 12:00 PM - Lunch with your manager
- 2:00 PM - Technology setup

Looking forward to seeing you soon!

Best regards,
*The BambooHR Team*`,
      },
    ],
  },
  {
    id: '14',
    title: 'Remote work eligibility policies',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'What are our remote work eligibility policies?',
      },
      {
        id: '2',
        type: 'ai',
        text: 'Remote Work Eligibility:\n\n1. Minimum 6 months tenure\n2. Performance rating of 3+ \n3. Role suitable for remote work\n4. Manager approval required\n5. Reliable internet connection',
      },
    ],
  },
  {
    id: '15',
    title: 'Leave of absence inquiry',
    messages: [
      {
        id: '1',
        type: 'user',
        text: 'How do I request a leave of absence?',
      },
      {
        id: '2',
        type: 'ai',
        text: 'To request a leave of absence:\n\n1. Submit request 30 days in advance\n2. Include start and end dates\n3. Specify leave type (FMLA, personal, etc.)\n4. Get manager approval\n5. HR will confirm eligibility',
      },
    ],
  },
];
