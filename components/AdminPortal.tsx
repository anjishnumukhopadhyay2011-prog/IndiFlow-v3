// Admin Portal - Comprehensive AI Training & Management Dashboard
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Shield,
  Database,
  Brain,
  Activity,
  Users,
  Settings,
  LogOut,
  Upload,
  FileText,
  FileJson,
  Image,
  FileCode,
  Tag,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  RotateCcw,
  Rocket,
  FlaskConical,
  BarChart3,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Eye,
  History,
  Lock,
  Key,
  UserCog,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  Search,
  Filter,
  ChevronRight,
  Server,
  Cpu,
  HardDrive,
  Network,
  Layers,
  GitBranch,
  Beaker,
  Route,
  Navigation,
} from 'lucide-react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getAuthHeaders(): HeadersInit {
  const storedAuth = localStorage.getItem('indiflow_auth');
  if (storedAuth) {
    try {
      const tokens = JSON.parse(storedAuth);
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      };
    } catch {
      // Invalid stored auth
    }
  }
  return { 'Content-Type': 'application/json' };
}

// Types
interface DashboardData {
  users: { total: number; byRole: { role: string; count: number }[] };
  datasets: { total: number; byType: { file_type: string; count: number }[] };
  labels: { total: number; reviewed: number; byType: { label_type: string; count: number }[] };
  models: { total: number; deployed: number; training: number; byType: Record<string, number> };
  training: { total: number; running: number; completed: number; avgAccuracy: number };
  audit: { total: number; today: number; byAction: { action: string; count: number }[] };
  serverInfo: { uptime: number; memory: { heapUsed: number; heapTotal: number; rss: number }; nodeVersion: string };
}

interface Dataset {
  id: string;
  name: string;
  description?: string;
  fileType: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  status: string;
  createdAt: string;
}

interface AIModel {
  id: string;
  name: string;
  modelType: string;
  baseModel?: string;
  version: string;
  status: string;
  accuracy: number;
  latency: number;
  errorRate: number;
  createdAt: string;
  deployedAt?: string;
}

interface TrainingRun {
  id: string;
  modelId: string;
  datasetId?: string;
  runType: string;
  status: string;
  epochsTotal: number;
  epochsCompleted: number;
  accuracy: number;
  valAccuracy: number;
  loss?: number;
  valLoss?: number;
  learningRate: number;
  batchSize: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface Simulation {
  id: string;
  name: string;
  description?: string;
  scenarioType: string;
  status: string;
  modelId?: string;
  createdAt: string;
  executedAt?: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

// Model types available
const MODEL_TYPES = [
  { id: 'llm', name: 'LLM (Language Model)', icon: Brain, description: 'Natural language processing and generation' },
  { id: 'vision', name: 'Vision Model', icon: Eye, description: 'Image recognition and analysis' },
  { id: 'routing', name: 'Routing Model', icon: Route, description: 'Optimal path and route prediction' },
  { id: 'ranking', name: 'Ranking Model', icon: TrendingUp, description: 'Result ranking and prioritization' },
  { id: 'eta', name: 'ETA Prediction', icon: Clock, description: 'Travel time estimation' },
  { id: 'traffic', name: 'Traffic Analysis', icon: Activity, description: 'Traffic pattern prediction' },
];

// File types supported
const FILE_TYPES = [
  { ext: 'csv', name: 'CSV', icon: FileText, color: 'text-green-400' },
  { ext: 'json', name: 'JSON', icon: FileJson, color: 'text-yellow-400' },
  { ext: 'image', name: 'Images', icon: Image, color: 'text-purple-400' },
  { ext: 'log', name: 'Logs', icon: FileCode, color: 'text-blue-400' },
  { ext: 'doc', name: 'Documents', icon: FileText, color: 'text-orange-400' },
];

export function AdminPortal() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [trainingRuns, setTrainingRuns] = useState<TrainingRun[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dataset upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState('csv');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Model creation state
  const [newModelName, setNewModelName] = useState('');
  const [newModelType, setNewModelType] = useState('routing');
  const [newModelBase, setNewModelBase] = useState('');
  const [isCreatingModel, setIsCreatingModel] = useState(false);

  // Training state
  const [selectedModelForTraining, setSelectedModelForTraining] = useState('');
  const [selectedDatasetForTraining, setSelectedDatasetForTraining] = useState('');
  const [trainingEpochs, setTrainingEpochs] = useState(100);
  const [trainingLR, setTrainingLR] = useState(0.001);
  const [trainingBatchSize, setTrainingBatchSize] = useState(32);

  // Simulation state
  const [newSimName, setNewSimName] = useState('');
  const [newSimType, setNewSimType] = useState('synthetic');
  const [newSimDescription, setNewSimDescription] = useState('');

  // Polling interval ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (err) {
      console.error('[AdminPortal] Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load datasets
  const loadDatasets = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/datasets`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setDatasets(data.data);
      }
    } catch (err) {
      console.error('[AdminPortal] Datasets error:', err);
    }
  }, []);

  // Load models
  const loadModels = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/models`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setModels(data.data);
      }
    } catch (err) {
      console.error('[AdminPortal] Models error:', err);
    }
  }, []);

  // Load training runs
  const loadTrainingRuns = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/training-runs`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setTrainingRuns(data.data);
      }
    } catch (err) {
      console.error('[AdminPortal] Training runs error:', err);
    }
  }, []);

  // Load simulations
  const loadSimulations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/simulations`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setSimulations(data.data);
      }
    } catch (err) {
      console.error('[AdminPortal] Simulations error:', err);
    }
  }, []);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs?limit=100`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('[AdminPortal] Audit logs error:', err);
    }
  }, []);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('[AdminPortal] Users error:', err);
    }
  }, []);

  // Upload dataset
  const handleUploadDataset = async () => {
    if (!uploadName || !uploadType) return;

    setIsUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/datasets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: uploadName,
          fileType: uploadType,
          fileSize: uploadContent.length,
          fileContent: uploadContent,
          rowCount: uploadContent.split('\n').length,
          columnCount: uploadContent.split('\n')[0]?.split(',').length || 0,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setUploadName('');
        setUploadContent('');
        loadDatasets();
        loadDashboard();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to upload dataset');
    } finally {
      setIsUploading(false);
    }
  };

  // Create model
  const handleCreateModel = async () => {
    if (!newModelName || !newModelType) return;

    setIsCreatingModel(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/models`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newModelName,
          modelType: newModelType,
          baseModel: newModelBase || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewModelName('');
        setNewModelBase('');
        loadModels();
        loadDashboard();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create model');
    } finally {
      setIsCreatingModel(false);
    }
  };

  // Start training
  const handleStartTraining = async () => {
    if (!selectedModelForTraining) return;

    try {
      // Create training run
      const createResponse = await fetch(`${API_BASE_URL}/api/admin/training-runs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          modelId: selectedModelForTraining,
          datasetId: selectedDatasetForTraining || null,
          runType: 'full',
          epochsTotal: trainingEpochs,
          learningRate: trainingLR,
          batchSize: trainingBatchSize,
        }),
      });
      const createData = await createResponse.json();

      if (createData.success) {
        // Start the training
        await fetch(`${API_BASE_URL}/api/admin/training-runs/${createData.data.id}/start`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        loadTrainingRuns();
        loadDashboard();
      }
    } catch (err) {
      setError('Failed to start training');
    }
  };

  // Pause training
  const handlePauseTraining = async (runId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/training-runs/${runId}/pause`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      loadTrainingRuns();
    } catch (err) {
      setError('Failed to pause training');
    }
  };

  // Resume training
  const handleResumeTraining = async (runId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/training-runs/${runId}/resume`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      loadTrainingRuns();
    } catch (err) {
      setError('Failed to resume training');
    }
  };

  // Deploy model
  const handleDeployModel = async (modelId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/models/${modelId}/deploy`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      loadModels();
      loadDashboard();
    } catch (err) {
      setError('Failed to deploy model');
    }
  };

  // Delete model
  const handleDeleteModel = async (modelId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/models/${modelId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      loadModels();
      loadDashboard();
    } catch (err) {
      setError('Failed to delete model');
    }
  };

  // Create simulation
  const handleCreateSimulation = async () => {
    if (!newSimName || !newSimType) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/simulations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newSimName,
          scenarioType: newSimType,
          description: newSimDescription,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewSimName('');
        setNewSimDescription('');
        loadSimulations();
      }
    } catch (err) {
      setError('Failed to create simulation');
    }
  };

  // Execute simulation
  const handleExecuteSimulation = async (simId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/simulations/${simId}/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      loadSimulations();
    } catch (err) {
      setError('Failed to execute simulation');
    }
  };

  // Update user role
  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
      loadAuditLogs();
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      loadUsers();
      loadAuditLogs();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboard();
    loadDatasets();
    loadModels();
    loadTrainingRuns();
    loadSimulations();
    loadAuditLogs();
    loadUsers();

    // Start polling for real-time updates
    pollingRef.current = setInterval(() => {
      loadDashboard();
      loadTrainingRuns();
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadDashboard, loadDatasets, loadModels, loadTrainingRuns, loadSimulations, loadAuditLogs, loadUsers]);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f1a]/95 backdrop-blur-xl border-b border-red-900/30">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">IndiFlow Admin</h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Full Access
                </Badge>
                <span className="text-xs text-slate-500">Real-time updates active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-400">System Online</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-red-400">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-slate-400 hover:text-white hover:bg-red-500/20"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-400">
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="datasets" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <Database className="h-4 w-4 mr-2" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="labelling" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <Tag className="h-4 w-4 mr-2" />
              Labelling
            </TabsTrigger>
            <TabsTrigger value="models" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <Brain className="h-4 w-4 mr-2" />
              Models
            </TabsTrigger>
            <TabsTrigger value="training" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <Cpu className="h-4 w-4 mr-2" />
              Training
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <BarChart3 className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="simulation" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <FlaskConical className="h-4 w-4 mr-2" />
              Simulation
            </TabsTrigger>
            <TabsTrigger value="governance" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 rounded-lg px-4">
              <Lock className="h-4 w-4 mr-2" />
              Governance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-400/80">Total Users</p>
                      <p className="text-2xl font-bold text-white">{dashboardData?.users.total || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-400/80">Datasets</p>
                      <p className="text-2xl font-bold text-white">{dashboardData?.datasets.total || 0}</p>
                    </div>
                    <Database className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-400/80">AI Models</p>
                      <p className="text-2xl font-bold text-white">{dashboardData?.models.total || 0}</p>
                    </div>
                    <Brain className="h-8 w-8 text-purple-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-400/80">Labels</p>
                      <p className="text-2xl font-bold text-white">{dashboardData?.labels.total || 0}</p>
                    </div>
                    <Tag className="h-8 w-8 text-orange-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Training & Model Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-red-400" />
                    Training Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-400">{dashboardData?.training.running || 0}</p>
                      <p className="text-xs text-slate-500">Running</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-400">{dashboardData?.training.completed || 0}</p>
                      <p className="text-xs text-slate-500">Completed</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-400">{((dashboardData?.training.avgAccuracy || 0) * 100).toFixed(1)}%</p>
                      <p className="text-xs text-slate-500">Avg Accuracy</p>
                    </div>
                  </div>

                  {trainingRuns.filter(r => r.status === 'running').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium">Active Training</p>
                      {trainingRuns.filter(r => r.status === 'running').map(run => (
                        <div key={run.id} className="p-3 bg-slate-800/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">Epoch {run.epochsCompleted}/{run.epochsTotal}</span>
                            <span className="text-sm text-green-400">{(run.accuracy * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={(run.epochsCompleted / run.epochsTotal) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Server className="h-5 w-5 text-red-400" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Uptime</p>
                      <p className="text-lg font-bold text-white">{formatUptime(dashboardData?.serverInfo.uptime || 0)}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Node Version</p>
                      <p className="text-lg font-bold text-white">{dashboardData?.serverInfo.nodeVersion}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">Memory Usage</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Heap Used</span>
                        <span className="text-white">{formatBytes(dashboardData?.serverInfo.memory.heapUsed || 0)}</span>
                      </div>
                      <Progress value={((dashboardData?.serverInfo.memory.heapUsed || 0) / (dashboardData?.serverInfo.memory.heapTotal || 1)) * 100} className="h-1.5" />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">Deployed Models</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-400">{dashboardData?.models.deployed || 0}</span>
                      <span className="text-slate-500">/ {dashboardData?.models.total || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Audit Logs */}
            <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-red-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {auditLogs.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            log.action.includes('create') && 'bg-green-400',
                            log.action.includes('delete') && 'bg-red-400',
                            log.action.includes('update') && 'bg-yellow-400',
                            log.action.includes('deploy') && 'bg-blue-400',
                            !['create', 'delete', 'update', 'deploy'].some(a => log.action.includes(a)) && 'bg-slate-400'
                          )} />
                          <span className="text-sm text-white">{log.action.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="text-xs border-slate-600">{log.resourceType}</Badge>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Upload Panel */}
              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-red-400" />
                    Upload Dataset
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    CSV, JSON, Images, Logs, Documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Dataset name..."
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                  />

                  <div className="grid grid-cols-5 gap-2">
                    {FILE_TYPES.map(type => (
                      <button
                        key={type.ext}
                        onClick={() => setUploadType(type.ext)}
                        className={cn(
                          'p-2 rounded-lg border transition-all flex flex-col items-center gap-1',
                          uploadType === type.ext
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        )}
                      >
                        <type.icon className={cn('h-4 w-4', type.color)} />
                        <span className="text-xs text-slate-400">{type.name}</span>
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Paste data content or drop file..."
                    value={uploadContent}
                    onChange={e => setUploadContent(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 h-32"
                  />

                  <Button
                    onClick={handleUploadDataset}
                    disabled={!uploadName || isUploading}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Dataset
                  </Button>
                </CardContent>
              </Card>

              {/* Datasets List */}
              <Card className="md:col-span-2 bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="h-5 w-5 text-red-400" />
                      Datasets ({datasets.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadDatasets}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {datasets.map(dataset => {
                        const fileType = FILE_TYPES.find(t => t.ext === dataset.fileType) || FILE_TYPES[0];
                        return (
                          <div key={dataset.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn('p-2 rounded-lg bg-slate-900/50', fileType.color)}>
                                  <fileType.icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">{dataset.name}</p>
                                  <p className="text-xs text-slate-500 font-mono">ID: {dataset.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                              <Badge className={cn(
                                'rounded-lg',
                                dataset.status === 'processed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              )}>
                                {dataset.status}
                              </Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                              <div className="p-2 bg-slate-900/50 rounded">
                                <p className="text-slate-500">Size</p>
                                <p className="text-white">{formatBytes(dataset.fileSize)}</p>
                              </div>
                              <div className="p-2 bg-slate-900/50 rounded">
                                <p className="text-slate-500">Rows</p>
                                <p className="text-white">{dataset.rowCount}</p>
                              </div>
                              <div className="p-2 bg-slate-900/50 rounded">
                                <p className="text-slate-500">Columns</p>
                                <p className="text-white">{dataset.columnCount}</p>
                              </div>
                              <div className="p-2 bg-slate-900/50 rounded">
                                <p className="text-slate-500">Type</p>
                                <p className="text-white uppercase">{dataset.fileType}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {datasets.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>No datasets uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Labelling Tab */}
          <TabsContent value="labelling" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Tag className="h-5 w-5 text-red-400" />
                  Labelling & Annotation
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manual + AI-assisted labelling with human-in-the-loop review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Label Stats */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Label Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-white">{dashboardData?.labels.total || 0}</p>
                        <p className="text-xs text-slate-500">Total Labels</p>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">{dashboardData?.labels.reviewed || 0}</p>
                        <p className="text-xs text-slate-500">Reviewed</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">By Type</p>
                      <div className="space-y-2">
                        {dashboardData?.labels.byType.map(item => (
                          <div key={item.label_type} className="flex items-center justify-between">
                            <span className="text-sm text-slate-300 capitalize">{item.label_type}</span>
                            <Badge variant="outline" className="border-slate-600">{item.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Labelling Types */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Labelling Methods</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Tag className="h-4 w-4 text-blue-400" />
                          </div>
                          <span className="font-medium text-white">Manual Labelling</span>
                        </div>
                        <p className="text-xs text-slate-400">Human-annotated labels with full control</p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Brain className="h-4 w-4 text-purple-400" />
                          </div>
                          <span className="font-medium text-white">AI-Assisted</span>
                        </div>
                        <p className="text-xs text-slate-400">LLM-suggested labels for faster annotation</p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <Users className="h-4 w-4 text-green-400" />
                          </div>
                          <span className="font-medium text-white">Human-in-the-Loop</span>
                        </div>
                        <p className="text-xs text-slate-400">Review and verify AI-generated labels</p>
                      </div>
                    </div>
                  </div>

                  {/* Version Control */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white">Label Version Control</h3>
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <GitBranch className="h-5 w-5 text-orange-400" />
                        <span className="font-medium text-white">Version History</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                          <span className="text-sm text-slate-300">v1.0</span>
                          <Badge variant="outline" className="border-green-500/50 text-green-400">current</Badge>
                        </div>
                        <p className="text-xs text-slate-500 text-center py-4">
                          Label versions are tracked automatically
                        </p>
                      </div>
                    </div>

                    <Button className="w-full bg-slate-800 hover:bg-slate-700">
                      <History className="h-4 w-4 mr-2" />
                      View Change History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Create Model */}
              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-red-400" />
                    Create Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Model name..."
                    value={newModelName}
                    onChange={e => setNewModelName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                  />

                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Model Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {MODEL_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => setNewModelType(type.id)}
                          className={cn(
                            'p-2 rounded-lg border text-left transition-all',
                            newModelType === type.id
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          )}
                        >
                          <type.icon className="h-4 w-4 text-slate-400 mb-1" />
                          <p className="text-xs text-white">{type.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    placeholder="Base model (optional)..."
                    value={newModelBase}
                    onChange={e => setNewModelBase(e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                  />

                  <Button
                    onClick={handleCreateModel}
                    disabled={!newModelName || isCreatingModel}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {isCreatingModel ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Model
                  </Button>
                </CardContent>
              </Card>

              {/* Models List */}
              <Card className="md:col-span-2 bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5 text-red-400" />
                      AI Models ({models.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadModels}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {models.map(model => (
                        <div key={model.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-white">{model.name}</p>
                              <p className="text-xs text-slate-500">Type: {model.modelType} | v{model.version}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={cn(
                                'rounded-lg',
                                model.status === 'deployed' && 'bg-green-500/20 text-green-400',
                                model.status === 'training' && 'bg-yellow-500/20 text-yellow-400',
                                model.status === 'created' && 'bg-blue-500/20 text-blue-400'
                              )}>
                                {model.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                            <div className="p-2 bg-slate-900/50 rounded text-center">
                              <p className="text-slate-500">Accuracy</p>
                              <p className="text-white font-medium">{(model.accuracy * 100).toFixed(1)}%</p>
                            </div>
                            <div className="p-2 bg-slate-900/50 rounded text-center">
                              <p className="text-slate-500">Latency</p>
                              <p className="text-white font-medium">{model.latency.toFixed(0)}ms</p>
                            </div>
                            <div className="p-2 bg-slate-900/50 rounded text-center">
                              <p className="text-slate-500">Error Rate</p>
                              <p className="text-white font-medium">{(model.errorRate * 100).toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {model.status !== 'deployed' && (
                              <Button
                                size="sm"
                                onClick={() => handleDeployModel(model.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Rocket className="h-3 w-3 mr-1" />
                                Deploy
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteModel(model.id)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}

                      {models.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <Brain className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>No models created yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Start Training */}
              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Play className="h-5 w-5 text-red-400" />
                    Start Training
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Select Model</p>
                    <select
                      value={selectedModelForTraining}
                      onChange={e => setSelectedModelForTraining(e.target.value)}
                      className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">Choose a model...</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 mb-2">Select Dataset (optional)</p>
                    <select
                      value={selectedDatasetForTraining}
                      onChange={e => setSelectedDatasetForTraining(e.target.value)}
                      className="w-full p-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">No dataset</option>
                      {datasets.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Epochs</p>
                      <Input
                        type="number"
                        value={trainingEpochs}
                        onChange={e => setTrainingEpochs(Number(e.target.value))}
                        className="bg-slate-800/50 border-slate-700"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">LR</p>
                      <Input
                        type="number"
                        step="0.0001"
                        value={trainingLR}
                        onChange={e => setTrainingLR(Number(e.target.value))}
                        className="bg-slate-800/50 border-slate-700"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Batch</p>
                      <Input
                        type="number"
                        value={trainingBatchSize}
                        onChange={e => setTrainingBatchSize(Number(e.target.value))}
                        className="bg-slate-800/50 border-slate-700"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleStartTraining}
                    disabled={!selectedModelForTraining}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Training
                  </Button>
                </CardContent>
              </Card>

              {/* Training Runs */}
              <Card className="md:col-span-2 bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-red-400" />
                      Training Runs ({trainingRuns.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadTrainingRuns}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {trainingRuns.map(run => {
                        const model = models.find(m => m.id === run.modelId);
                        return (
                          <div key={run.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-medium text-white">{model?.name || 'Unknown Model'}</p>
                                <p className="text-xs text-slate-500">Type: {run.runType} | LR: {run.learningRate}</p>
                              </div>
                              <Badge className={cn(
                                'rounded-lg',
                                run.status === 'running' && 'bg-yellow-500/20 text-yellow-400',
                                run.status === 'completed' && 'bg-green-500/20 text-green-400',
                                run.status === 'paused' && 'bg-orange-500/20 text-orange-400',
                                run.status === 'pending' && 'bg-blue-500/20 text-blue-400',
                                run.status === 'failed' && 'bg-red-500/20 text-red-400'
                              )}>
                                {run.status}
                              </Badge>
                            </div>

                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-white">{run.epochsCompleted}/{run.epochsTotal} epochs</span>
                              </div>
                              <Progress value={(run.epochsCompleted / run.epochsTotal) * 100} className="h-2" />
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                              <div className="p-2 bg-slate-900/50 rounded text-center">
                                <p className="text-slate-500">Accuracy</p>
                                <p className="text-green-400 font-medium">{(run.accuracy * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-2 bg-slate-900/50 rounded text-center">
                                <p className="text-slate-500">Val Acc</p>
                                <p className="text-blue-400 font-medium">{(run.valAccuracy * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-2 bg-slate-900/50 rounded text-center">
                                <p className="text-slate-500">Loss</p>
                                <p className="text-orange-400 font-medium">{run.loss?.toFixed(4) || '-'}</p>
                              </div>
                              <div className="p-2 bg-slate-900/50 rounded text-center">
                                <p className="text-slate-500">Val Loss</p>
                                <p className="text-yellow-400 font-medium">{run.valLoss?.toFixed(4) || '-'}</p>
                              </div>
                            </div>

                            {run.status === 'running' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handlePauseTraining(run.id)}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  <Pause className="h-3 w-3 mr-1" />
                                  Pause
                                </Button>
                              </div>
                            )}

                            {run.status === 'paused' && (
                              <Button
                                size="sm"
                                onClick={() => handleResumeTraining(run.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Resume
                              </Button>
                            )}
                          </div>
                        );
                      })}

                      {trainingRuns.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <Cpu className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>No training runs yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-400" />
                  Evaluation & Metrics
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Task-specific metrics: accuracy, latency, ETA error, routing optimality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-500/20">
                    <Target className="h-6 w-6 text-green-400 mb-2" />
                    <p className="text-xs text-green-400/80">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-white">
                      {models.length > 0
                        ? ((models.reduce((sum, m) => sum + m.accuracy, 0) / models.length) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20">
                    <Clock className="h-6 w-6 text-blue-400 mb-2" />
                    <p className="text-xs text-blue-400/80">Avg Latency</p>
                    <p className="text-2xl font-bold text-white">
                      {models.length > 0
                        ? (models.reduce((sum, m) => sum + m.latency, 0) / models.length).toFixed(0)
                        : 0}ms
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/20">
                    <AlertTriangle className="h-6 w-6 text-orange-400 mb-2" />
                    <p className="text-xs text-orange-400/80">Avg Error Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {models.length > 0
                        ? ((models.reduce((sum, m) => sum + m.errorRate, 0) / models.length) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20">
                    <Route className="h-6 w-6 text-purple-400 mb-2" />
                    <p className="text-xs text-purple-400/80">Models Deployed</p>
                    <p className="text-2xl font-bold text-white">{dashboardData?.models.deployed || 0}</p>
                  </div>
                </div>

                {/* Train vs Validation comparison */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      Training vs Validation
                    </h3>
                    {trainingRuns.filter(r => r.status === 'completed').slice(0, 5).map(run => {
                      const model = models.find(m => m.id === run.modelId);
                      return (
                        <div key={run.id} className="mb-3">
                          <p className="text-xs text-slate-400 mb-1">{model?.name || 'Model'}</p>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">Train</span>
                                <span className="text-green-400">{(run.accuracy * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={run.accuracy * 100} className="h-1.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">Val</span>
                                <span className="text-blue-400">{(run.valAccuracy * 100).toFixed(1)}%</span>
                              </div>
                              <Progress value={run.valAccuracy * 100} className="h-1.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {trainingRuns.filter(r => r.status === 'completed').length === 0 && (
                      <p className="text-center text-slate-500 py-4">No completed training runs</p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-400" />
                      Model Performance by Type
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(dashboardData?.models.byType || {}).map(([type, count]) => {
                        const typeModels = models.filter(m => m.modelType === type);
                        const avgAcc = typeModels.length > 0
                          ? typeModels.reduce((sum, m) => sum + m.accuracy, 0) / typeModels.length
                          : 0;
                        return (
                          <div key={type} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                            <span className="text-sm text-slate-300 capitalize">{type}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-slate-600">{count} models</Badge>
                              <span className="text-xs text-green-400">{(avgAcc * 100).toFixed(0)}% avg</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Create Simulation */}
              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-red-400" />
                    Create Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Scenario name..."
                    value={newSimName}
                    onChange={e => setNewSimName(e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                  />

                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Scenario Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['synthetic', 'real', 'replay', 'what-if'].map(type => (
                        <button
                          key={type}
                          onClick={() => setNewSimType(type)}
                          className={cn(
                            'p-3 rounded-lg border text-center transition-all capitalize',
                            newSimType === type
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                          )}
                        >
                          <span className="text-sm text-white">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    placeholder="Description..."
                    value={newSimDescription}
                    onChange={e => setNewSimDescription(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 h-20"
                  />

                  <Button
                    onClick={handleCreateSimulation}
                    disabled={!newSimName}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Scenario
                  </Button>
                </CardContent>
              </Card>

              {/* Simulations List */}
              <Card className="md:col-span-2 bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Beaker className="h-5 w-5 text-red-400" />
                      Simulation Scenarios ({simulations.length})
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadSimulations}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {simulations.map(sim => (
                        <div key={sim.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-white">{sim.name}</p>
                              <p className="text-xs text-slate-500">{sim.description || 'No description'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-slate-600 capitalize">
                                {sim.scenarioType}
                              </Badge>
                              <Badge className={cn(
                                'rounded-lg',
                                sim.status === 'completed' && 'bg-green-500/20 text-green-400',
                                sim.status === 'created' && 'bg-blue-500/20 text-blue-400'
                              )}>
                                {sim.status}
                              </Badge>
                            </div>
                          </div>

                          {sim.status !== 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => handleExecuteSimulation(sim.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Execute
                            </Button>
                          )}
                        </div>
                      ))}

                      {simulations.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
                          <p>No simulation scenarios yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* User Management */}
              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-red-400" />
                    Role-Based Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                              {u.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-sm text-white">{u.name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={e => handleUpdateUserRole(u.id, e.target.value)}
                              disabled={u.id === user?.id}
                              className="text-xs p-1 bg-slate-700 border-0 rounded text-white"
                            >
                              <option value="user">User</option>
                              <option value="developer">Developer</option>
                              <option value="admin">Admin</option>
                            </select>
                            {u.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(u.id)}
                                className="h-6 w-6 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Audit Logs */}
              <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-red-400" />
                      Audit Logs
                    </CardTitle>
                    <Badge className="bg-slate-700">
                      {dashboardData?.audit.today || 0} today
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {auditLogs.slice(0, 20).map(log => (
                        <div key={log.id} className="p-2 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white font-medium">{log.action.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-slate-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-slate-600">{log.resourceType}</Badge>
                            {log.resourceId && (
                              <span className="text-xs text-slate-500 font-mono">{log.resourceId.slice(0, 8)}...</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Data Privacy Controls */}
            <Card className="bg-slate-900/50 border-slate-800 rounded-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-400" />
                  Data Privacy Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      </div>
                      <span className="font-medium text-white">Data Encryption</span>
                    </div>
                    <p className="text-xs text-slate-400">All data encrypted at rest and in transit</p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Key className="h-4 w-4 text-green-400" />
                      </div>
                      <span className="font-medium text-white">Access Tokens</span>
                    </div>
                    <p className="text-xs text-slate-400">JWT-based authentication with expiry</p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Eye className="h-4 w-4 text-green-400" />
                      </div>
                      <span className="font-medium text-white">Audit Trail</span>
                    </div>
                    <p className="text-xs text-slate-400">Complete logging of all admin actions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default AdminPortal;
