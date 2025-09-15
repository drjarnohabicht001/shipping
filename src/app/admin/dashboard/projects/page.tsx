'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/Components/Button';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  client: {
    name: string;
    email: string;
    company: string;
  };
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  actualBudget: number;
  teamMembers: string[];
  deliverables: {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    dueDate: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  averageProjectDuration: number;
  onTimeDeliveryRate: number;
}

const PROJECT_STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    averageProjectDuration: 0,
    onTimeDeliveryRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'International Expansion Phase 2',
          description: 'Expanding shipping services to European markets',
          client: {
            name: 'John Smith',
            email: 'john@globalcorp.com',
            company: 'Global Corp Ltd'
          },
          status: 'active',
          priority: 'high',
          progress: 75,
          startDate: '2024-01-15',
          endDate: '2024-04-15',
          estimatedBudget: 250000,
          actualBudget: 180000,
          teamMembers: ['Alice Johnson', 'Bob Wilson', 'Carol Davis'],
          deliverables: [
            {
              id: '1',
              name: 'Market Research',
              status: 'completed',
              dueDate: '2024-02-01'
            },
            {
              id: '2',
              name: 'Partnership Agreements',
              status: 'in_progress',
              dueDate: '2024-03-01'
            },
            {
              id: '3',
              name: 'System Integration',
              status: 'pending',
              dueDate: '2024-04-01'
            }
          ],
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-20T00:00:00Z'
        },
        {
          id: '2',
          name: 'Warehouse Automation System',
          description: 'Implementing automated sorting and tracking systems',
          client: {
            name: 'Sarah Johnson',
            email: 'sarah@techsolutions.com',
            company: 'Tech Solutions Inc'
          },
          status: 'active',
          priority: 'medium',
          progress: 45,
          startDate: '2024-02-01',
          endDate: '2024-06-01',
          estimatedBudget: 180000,
          actualBudget: 95000,
          teamMembers: ['David Brown', 'Emma Wilson'],
          deliverables: [
            {
              id: '1',
              name: 'Requirements Analysis',
              status: 'completed',
              dueDate: '2024-02-15'
            },
            {
              id: '2',
              name: 'System Design',
              status: 'in_progress',
              dueDate: '2024-03-15'
            }
          ],
          createdAt: '2024-01-25T00:00:00Z',
          updatedAt: '2024-02-05T00:00:00Z'
        },
        {
          id: '3',
          name: 'Fleet Optimization Program',
          description: 'Optimizing delivery routes and vehicle utilization',
          client: {
            name: 'Mike Davis',
            email: 'mike@logisticspro.com',
            company: 'Logistics Pro'
          },
          status: 'planning',
          priority: 'low',
          progress: 20,
          startDate: '2024-03-01',
          endDate: '2024-08-01',
          estimatedBudget: 120000,
          actualBudget: 15000,
          teamMembers: ['Frank Miller'],
          deliverables: [
            {
              id: '1',
              name: 'Current State Analysis',
              status: 'in_progress',
              dueDate: '2024-03-15'
            }
          ],
          createdAt: '2024-02-20T00:00:00Z',
          updatedAt: '2024-02-25T00:00:00Z'
        },
        {
          id: '4',
          name: 'Customer Portal Redesign',
          description: 'Modernizing the customer tracking and booking portal',
          client: {
            name: 'Lisa Anderson',
            email: 'lisa@retailchain.com',
            company: 'Retail Chain Co'
          },
          status: 'completed',
          priority: 'medium',
          progress: 100,
          startDate: '2023-10-01',
          endDate: '2024-01-01',
          estimatedBudget: 80000,
          actualBudget: 75000,
          teamMembers: ['Grace Lee', 'Henry Taylor'],
          deliverables: [
            {
              id: '1',
              name: 'UI/UX Design',
              status: 'completed',
              dueDate: '2023-11-01'
            },
            {
              id: '2',
              name: 'Development',
              status: 'completed',
              dueDate: '2023-12-15'
            },
            {
              id: '3',
              name: 'Testing & Deployment',
              status: 'completed',
              dueDate: '2024-01-01'
            }
          ],
          createdAt: '2023-09-25T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        }
      ];

      setProjects(mockProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - replace with actual API call
      setStats({
        totalProjects: 24,
        activeProjects: 8,
        completedProjects: 15,
        totalRevenue: 1250000,
        averageProjectDuration: 120, // days
        onTimeDeliveryRate: 87
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Clock className="h-4 w-4" />;
      case 'active': return <TrendingUp className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'on_hold': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status);
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(project.priority);
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.onTimeDeliveryRate}%</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or clients..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  multiple
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(Array.from(e.target.selectedOptions, option => option.value))}
                  className="block w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  multiple
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(Array.from(e.target.selectedOptions, option => option.value))}
                  className="block w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF5A24] focus:border-[#FF5A24]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  setStatusFilter([]);
                  setPriorityFilter([]);
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  {project.client.company}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLORS[project.status]}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1 capitalize">{project.status.replace('_', ' ')}</span>
                </span>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium text-gray-900">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#FF5A24] h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Start Date</span>
                  <p className="font-medium text-gray-900">{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">End Date</span>
                  <p className="font-medium text-gray-900">{new Date(project.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Budget</span>
                  <p className="font-medium text-gray-900">${project.estimatedBudget.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Priority</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[project.priority]}`}>
                    {project.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Team Members</span>
                <p className="font-medium text-gray-900">{project.teamMembers.join(', ')}</p>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Deliverables</span>
                <div className="mt-1 space-y-1">
                  {project.deliverables.slice(0, 2).map((deliverable) => (
                    <div key={deliverable.id} className="flex items-center justify-between">
                      <span className="text-gray-900">{deliverable.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        deliverable.status === 'completed' ? 'bg-green-100 text-green-800' :
                        deliverable.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {deliverable.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {project.deliverables.length > 2 && (
                    <p className="text-gray-500 text-xs">+{project.deliverables.length - 2} more</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="text-[#FF5A24] hover:text-[#e54a1f] text-sm font-medium"
                >
                  <Eye className="h-4 w-4 mr-1 inline" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </div>
      )}
    </div>
  );
}