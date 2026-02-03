import type { JobType, StageId } from "../features/components/StageColumn";

export const DUMMY_JOBS: JobType[] = [
    {
        id: '1',
        company_name: 'Google',          
        position: 'Frontend Developer',
        stage: 'applied',
        applied_date: '2024-01-15',     
        status: 'active' as const,
        salary: '$120,000',
        location: 'Remote',
        tags: ['React', 'TypeScript', 'Senior']
    },
    {
        id: '2',
        company_name: 'Microsoft',
        position: 'Full Stack Engineer',
        stage: 'applied',
        applied_date: '2024-01-10',
        status: 'active' as const,
        salary: '$110,000',
        location: 'Seattle, WA',
        tags: ['Node.js', 'React', 'Azure']
    },
    {
        id: '3',
        company_name: 'Amazon',
        position: 'Backend Developer',
        stage: 'hr-interview',
        applied_date: '2024-01-05',
        status: 'active' as const,
        salary: '$115,000',
        location: 'New York, NY'
    },
    {
        id: '4',
        company_name: 'Startup XYZ',
        position: 'React Developer',
        stage: 'rejected',
        applied_date: '2023-12-20',
        status: 'rejected' as const,
        salary: '$90,000',
        location: 'Remote'
    },
    {
        id: '5',
        company_name: 'Apple',
        position: 'iOS Developer',
        stage: 'offer',
        applied_date: '2024-01-12',
        status: 'accepted' as const,
        salary: '$130,000',
        location: 'Cupertino, CA',
        tags: ['Swift', 'UIKit']
    }
];

export const DEFAULT_STAGES: { id: StageId; title: string; color: string }[] = [
  { id: 'applied', title: 'Applied', color: '#4f46e5' },
  { id: 'hr-interview', title: 'HR Interview', color: '#7c3aed' },
  { id: 'technical', title: 'Technical Interview', color: '#059669' },
  { id: 'final', title: 'Final Interview', color: '#d97706' },
  { id: 'offer', title: 'Offer', color: '#3b82f6' },
  { id: 'rejected', title: 'Rejected', color: '#ef4444' },
];