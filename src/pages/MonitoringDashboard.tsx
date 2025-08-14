import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Activity, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  RefreshCw,
  Download,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

// Interfaces
interface ProcessingStats {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  averageProcessingTime: number;
  lastProcessedAt: string | null;
}

interface SystemStats {
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  activeConnections: number;
  errorRate: number;
}

interface AuditLog {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
  details?: any;
  created_at: string;
}

interface ProcessedFile {
  id: string;
  file_id: string;
  file_name: string;
  file_size: number;
  status: 'processing' | 'completed' | 'failed';
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  processing_time_ms: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

const MonitoringDashboard: React.FC = () => {
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [recentFiles, setRecentFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [logFilters, setLogFilters] = useState({
    severity: '',
    eventType: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    loadAllData();
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProcessingStats(),
        loadSystemStats(),
        loadAuditLogs(),
        loadRecentFiles()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const loadProcessingStats = async () => {
    try {
      const response = await fetch('/api/monitoring/stats');
      if (response.ok) {
        const stats = await response.json();
        setProcessingStats(stats);
      }
    } catch (error) {
      console.error('Error loading processing stats:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/monitoring/system');
      if (response.ok) {
        const stats = await response.json();
        setSystemStats(stats);
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (logFilters.severity) params.append('severity', logFilters.severity);
      if (logFilters.eventType) params.append('eventType', logFilters.eventType);
      if (logFilters.startDate) params.append('startDate', logFilters.startDate);
      if (logFilters.endDate) params.append('endDate', logFilters.endDate);
      params.append('limit', '50');

      const response = await fetch(`/api/monitoring/audit-logs?${params}`);
      if (response.ok) {
        const result = await response.json();
        setAuditLogs(result.data || []);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const loadRecentFiles = async () => {
    try {
      const response = await fetch('/api/monitoring/recent-files?limit=20');
      if (response.ok) {
        const files = await response.json();
        setRecentFiles(files);
      }
    } catch (error) {
      console.error('Error loading recent files:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Dados para gráficos
  const successRate = processingStats ? 
    (processingStats.successfulFiles / processingStats.totalFiles) * 100 : 0;

  const pieData = processingStats ? [
    { name: 'Válidos', value: processingStats.validRows, color: '#10b981' },
    { name: 'Inválidos', value: processingStats.invalidRows, color: '#ef4444' },
    { name: 'Duplicados', value: processingStats.duplicateRows, color: '#f59e0b' }
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Monitoramento</h1>
          <p className="text-muted-foreground">
            Monitore o desempenho e status das integrações
          </p>
        </div>
        <Button onClick={loadAllData} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arquivos Processados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingStats?.totalFiles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {processingStats?.successfulFiles || 0} sucessos, {processingStats?.failedFiles || 0} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {processingStats?.validRows || 0} linhas válidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processingStats?.averageProcessingTime ? 
                `${(processingStats.averageProcessingTime / 1000).toFixed(1)}s` : '0s'}
            </div>
            <p className="text-xs text-muted-foreground">
              Processamento por arquivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStats?.errorRate ? `${systemStats.errorRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Dados</CardTitle>
                <CardDescription>Qualidade dos dados processados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Informações de saúde do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemStats && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Uptime</span>
                      <span className="text-sm">{formatUptime(systemStats.uptime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Memória Usada</span>
                      <span className="text-sm">
                        {formatBytes(systemStats.memoryUsage.heapUsed)} / {formatBytes(systemStats.memoryUsage.heapTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">CPU (User)</span>
                      <span className="text-sm">{(systemStats.cpuUsage.user / 1000).toFixed(2)}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Taxa de Erro</span>
                      <Badge variant={systemStats.errorRate > 5 ? 'destructive' : 'default'}>
                        {systemStats.errorRate.toFixed(1)}%
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Processados Recentemente</CardTitle>
              <CardDescription>Últimos 20 arquivos processados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <div className="font-medium">{file.file_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatBytes(file.file_size)} • {file.total_rows} linhas • 
                          {file.processing_time_ms ? `${(file.processing_time_ms / 1000).toFixed(1)}s` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={file.status === 'completed' ? 'default' : 
                                   file.status === 'failed' ? 'destructive' : 'secondary'}>
                        {file.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(file.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {recentFiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum arquivo processado encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>Histórico de eventos do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Severidade</Label>
                  <Select value={logFilters.severity} onValueChange={(value) => 
                    setLogFilters(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Evento</Label>
                  <Select value={logFilters.eventType} onValueChange={(value) => 
                    setLogFilters(prev => ({ ...prev, eventType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="FILE_PROCESSING">Processamento</SelectItem>
                      <SelectItem value="WEBHOOK_RECEIVED">Webhook</SelectItem>
                      <SelectItem value="SYSTEM_ERROR">Erro Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={logFilters.startDate}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={logFilters.endDate}
                    onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={loadAuditLogs} className="mb-4">
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </Button>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Badge variant={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium">{log.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.event_type} • {new Date(log.created_at).toLocaleString()}
                      </div>
                      {log.details && (
                        <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso de Memória</CardTitle>
                <CardDescription>Estatísticas de memória do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {systemStats && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>RSS</span>
                      <span>{formatBytes(systemStats.memoryUsage.rss)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Heap Total</span>
                      <span>{formatBytes(systemStats.memoryUsage.heapTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Heap Usado</span>
                      <span>{formatBytes(systemStats.memoryUsage.heapUsed)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>External</span>
                      <span>{formatBytes(systemStats.memoryUsage.external)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Check</CardTitle>
                <CardDescription>Status de saúde dos serviços</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>API</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Google Drive</span>
                    <Badge variant="secondary">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Não testado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>n8n</span>
                    <Badge variant="secondary">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Não testado
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;