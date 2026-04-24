export type AIEmployeeRole = 'Sales' | 'Ops' | 'Distribution' | 'Support';
export type AIEmployeeStatus = 'Online' | 'Paused' | 'Building' | 'Executing';

export type AIEmployee = {
  id: string;
  name: string;
  role: AIEmployeeRole;
  status: AIEmployeeStatus;
  systems: ('Sales Engine' | 'Distribution System')[];
  workflowsOwned: number;
  tasksLast7d: number;
};

export type SystemType = 'Sales Engine' | 'Distribution System';

export type SystemSummary = {
  id: string;
  type: SystemType;
  status: 'Idle' | 'Ramping' | 'Pushing Hard';
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
};

export const mockEmployees: AIEmployee[] = [
  {
    id: 'emp-1',
    name: 'Sales Closer Alpha',
    role: 'Sales',
    status: 'Executing',
    systems: ['Sales Engine'],
    workflowsOwned: 12,
    tasksLast7d: 342,
  },
  {
    id: 'emp-2',
    name: 'Ops Orchestrator',
    role: 'Ops',
    status: 'Online',
    systems: ['Sales Engine', 'Distribution System'],
    workflowsOwned: 45,
    tasksLast7d: 1205,
  },
  {
    id: 'emp-3',
    name: 'Content Architect',
    role: 'Distribution',
    status: 'Building',
    systems: ['Distribution System'],
    workflowsOwned: 8,
    tasksLast7d: 56,
  },
  {
    id: 'emp-4',
    name: 'Lead Qual Beta',
    role: 'Sales',
    status: 'Paused',
    systems: ['Sales Engine'],
    workflowsOwned: 3,
    tasksLast7d: 0,
  },
  {
    id: 'emp-5',
    name: 'L1 Support Agent',
    role: 'Support',
    status: 'Online',
    systems: [],
    workflowsOwned: 15,
    tasksLast7d: 890,
  }
];

export const mockSystems: SystemSummary[] = [
  {
    id: 'sys-1',
    type: 'Sales Engine',
    status: 'Pushing Hard',
    primaryMetricLabel: 'Pipeline Created',
    primaryMetricValue: '$1.2M',
    secondaryMetricLabel: 'Meetings Booked (7d)',
    secondaryMetricValue: '42',
  },
  {
    id: 'sys-2',
    type: 'Distribution System',
    status: 'Ramping',
    primaryMetricLabel: 'Content Shipped (7d)',
    primaryMetricValue: '124',
    secondaryMetricLabel: 'Avg Impressions',
    secondaryMetricValue: '8.4K',
  }
];
