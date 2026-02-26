// OpenAI function definitions for AskBambooHR
// The AI uses function calling to present structured draft cards and suggestion buttons.

export const presentSuggestionsFunction = {
  name: 'present_suggestions',
  description:
    'Present clickable suggestion buttons to the employee when asking a clarifying question. ' +
    'ONLY use this when EXACTLY ONE piece of information is missing. ' +
    'For PTO: use when only the type OR only the dates are missing (not both). ' +
    'For Expense: use when only the category is missing (not amount, date, or merchant — those are free-text). ' +
    'For Phone update: use when only the phone type is missing. ' +
    'For Emergency contact: use when only the relationship is missing. ' +
    'For action type disambiguation: use when you need to know what kind of update or request. ' +
    'NEVER use this when multiple fields are missing — ask conversationally in plain text instead. ' +
    'The buttons appear below your text message so the employee can click instead of typing.',
  parameters: {
    type: 'object' as const,
    properties: {
      suggestions: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Button labels for the single missing field. Examples: ' +
          'PTO type: ["Vacation", "Sick/Medical", "Personal", "Bereavement"]. ' +
          'PTO dates: ["Tomorrow", "This Friday", "Next week"]. ' +
          'Expense category: ["Meals & Entertainment", "Travel", "Office Supplies", "Software", "Professional Development", "Other"]. ' +
          'Phone type: ["Mobile", "Home", "Work"]. ' +
          'Relationship: ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]. ' +
          'Info update type: ["Update my address", "Update my phone", "Update emergency contact"]. ' +
          'Top-level: ["Request time off", "Submit an expense", "Update my info"].',
      },
    },
    required: ['suggestions'],
  },
};

export const presentDraftCardFunction = {
  name: 'present_draft_card',
  description:
    'Present a Draft Receipt card to the employee for review and submission. ' +
    'Use this whenever the employee requests an action (time off, expense, info update) ' +
    'and ALL required fields have been provided or clarified. ' +
    'Pre-fill as many fields as possible from context. Mark fields as needsInput when ' +
    'the employee must provide a value. For expense reports, receipt/file upload is always optional (required=false).',
  parameters: {
    type: 'object' as const,
    properties: {
      cardType: {
        type: 'string',
        enum: ['timeOff', 'expense', 'addressUpdate', 'phoneUpdate', 'emergencyContactUpdate'],
        description: 'The type of action card to present.',
      },
      title: {
        type: 'string',
        description: "Card header title, e.g. 'Time Off Request', 'Expense Report', 'Update Address'.",
      },
      fields: {
        type: 'array',
        description: 'The form fields to display in the card.',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: "Unique field identifier, e.g. 'timeOffType', 'amount', 'street'.",
            },
            label: {
              type: 'string',
              description: 'Display label for the field.',
            },
            type: {
              type: 'string',
              enum: ['dropdown', 'text', 'date', 'currency', 'file', 'phone'],
              description: 'Field input type.',
            },
            value: {
              type: 'string',
              description: 'Pre-filled value. Empty string if needsInput is true.',
            },
            needsInput: {
              type: 'boolean',
              description: 'True if the employee must provide this value. These fields get highlighted styling.',
            },
            required: {
              type: 'boolean',
              description: 'True if the field must be filled before submission.',
            },
            options: {
              type: 'array',
              items: { type: 'string' },
              description: 'Options for dropdown fields. Omit for non-dropdown fields.',
            },
            placeholder: {
              type: 'string',
              description: 'Placeholder text for empty/needsInput fields.',
            },
          },
          required: ['id', 'label', 'type', 'value', 'needsInput', 'required'],
        },
      },
      infoMessage: {
        type: 'string',
        description:
          'Contextual info shown at the bottom of the card (e.g., PTO balance, approver, budget remaining). ' +
          'Include approver name and relevant balance/budget.',
      },
    },
    required: ['cardType', 'title', 'fields', 'infoMessage'],
  },
};
