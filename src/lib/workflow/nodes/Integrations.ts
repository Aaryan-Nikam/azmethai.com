import { AzmethNodeProperty } from "../types";

export const SlackProperties: AzmethNodeProperty[] = [
  {
    displayName: 'Authentication',
    name: 'authentication',
    type: 'options',
    options: [
      { name: 'OAuth2 (Recommended)', value: 'oauth2' },
      { name: 'Bot Token', value: 'botToken' },
    ],
    default: 'oauth2',
  },
  {
    displayName: 'Channel',
    name: 'channel',
    type: 'string',
    default: '',
    placeholder: 'e.g. #sales-updates or U12345678',
    description: 'The ID or name of the Slack channel to send the message to.',
    required: true,
  },
  {
    displayName: 'Message text',
    name: 'text',
    type: 'json',
    default: '',
    placeholder: 'Hello from Azmeth AI! :wave:',
    description: 'The content of the message to send.',
    required: true,
  },
  {
    displayName: 'Send as User',
    name: 'as_user',
    type: 'boolean',
    default: false,
    description: 'Pass true to post the message as the authenticated user, instead of as a bot.',
  }
];

export const GmailProperties: AzmethNodeProperty[] = [
  {
    displayName: 'Authentication',
    name: 'authentication',
    type: 'options',
    options: [
      { name: 'Google OAuth2', value: 'oauth2' },
    ],
    default: 'oauth2',
  },
  {
    displayName: 'To Email',
    name: 'to',
    type: 'string',
    default: '',
    placeholder: 'investor@example.com',
    description: 'The email address of the primary recipient.',
    required: true,
  },
  {
    displayName: 'Subject',
    name: 'subject',
    type: 'string',
    default: '',
    placeholder: 'Important Update',
    required: true,
  },
  {
    displayName: 'Message Body',
    name: 'body',
    type: 'json',
    default: '',
    placeholder: 'Write your email content here...',
    required: true,
  },
  {
    displayName: 'Is HTML',
    name: 'isHtml',
    type: 'boolean',
    default: false,
    description: 'Whether the body is HTML formatted.',
  }
];

export const PostgresProperties: AzmethNodeProperty[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    options: [
      { name: 'Execute Query', value: 'executeQuery' },
      { name: 'Insert rows', value: 'insert' },
      { name: 'Update rows', value: 'update' },
    ],
    default: 'executeQuery',
  },
  {
    displayName: 'Query',
    name: 'query',
    type: 'json',
    default: 'SELECT * FROM users LIMIT 10;',
    displayOptions: {
      show: {
        operation: ['executeQuery'],
      },
    },
    required: true,
  },
  {
    displayName: 'Table',
    name: 'table',
    type: 'string',
    default: '',
    placeholder: 'users',
    displayOptions: {
      show: {
        operation: ['insert', 'update'],
      },
    },
    required: true,
  }
];

export const LLMProperties: AzmethNodeProperty[] = [
  {
    displayName: 'Provision Type',
    name: 'provisionType',
    type: 'options',
    options: [
      { name: 'Claude 3.5 Sonnet', value: 'claude-3-5' },
      { name: 'GPT-4o', value: 'gpt-4o' },
    ],
    default: 'claude-3-5',
    description: 'Select the AI model to use for generation.',
  },
  {
    displayName: 'Prompt',
    name: 'prompt',
    type: 'json',
    default: '',
    placeholder: 'Write a personalized intro for this lead...',
    description: 'The instruction for the AI model.',
    required: true,
  }
];

export const IntegrationsNodes = [
  { name: 'Slack', properties: SlackProperties },
  { name: 'Gmail', properties: GmailProperties },
  { name: 'Postgres', properties: PostgresProperties },
  { name: 'LLM', properties: LLMProperties },
];
