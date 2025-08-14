import React from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Settings, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus,
  Search,
  Clock,
  User,
  Building2,
  Target
} from 'lucide-react';
import { useDashboardStore, useUIStore } from '../store';
import { 
  mockEntities,
  mockScenarios
} from '../data/mock-data';
import { formatCurrency, formatDate } from '../utils/formatters';

type ReportType = 'financial' | 'custom';
type ReportFormat = 'pdf' | 'excel' | 'csv';
type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface Report {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  lastGenerated: Date;
  frequency: ReportFrequency;
  format: ReportFormat;
  createdBy: string;
  isScheduled: boolean;
  entities: string[];
  scenario: string;
}

const mockReports: Report[] = [
  {
    id: '1',
    name: 'DRE Consolidado Mensal',
    type: 'financial',
    description: 'Demonstração do Resultado consolidada de todas as entidades',
    lastGenerated: new Date('2024-01-15'),
    frequency: 'monthly',
    format: 'pdf',
    createdBy: 'João Silva',
    isScheduled: true,
    entities: ['1', '2'],
    scenario: '1'
  },
  {
    id: '2',
    name: 'Análise de Margem por Entidade',
    type: 'custom',
    description: 'Relatório detalhado de margens por entidade e período',
    lastGenerated: new Date('2024-01-14'),
    frequency: 'weekly',
    format: 'excel',
    createdBy: 'Maria Santos',
    isScheduled: false,
    entities: ['1'],
    scenario: '1'
  },
  {
    id: '3',
    name: 'Comparativo Orçado vs Realizado',
    type: 'financial',
    description: 'Análise comparativa entre valores orçados e realizados',
    lastGenerated: new Date('2024-01-13'),
    frequency: 'monthly',
    format: 'pdf',
    createdBy: 'Carlos Oliveira',
    isScheduled: true,
    entities: ['1', '2', '3'],
    scenario: '2'
  },
  {
    id: '4',
    name: 'Dashboard Executivo',
    type: 'custom',
    description: 'Resumo executivo com principais KPIs e indicadores',
    lastGenerated: new Date('2024-01-12'),
    frequency: 'daily',
    format: 'pdf',
    createdBy: 'Ana Costa',
    isScheduled: true,
    entities: ['1', '2'],
    scenario: '1'
  }
];

export const Reports: React.FC = () => {
  const { filters, setFilters } = useDashboardStore();
  const { addNotification, isMobile } = useUIStore();
  
  const [activeTab, setActiveTab] = React.useState<ReportType>('financial');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  
  const [newReport, setNewReport] = React.useState({
    name: '',
    type: 'financial' as ReportType,
    description: '',
    frequency: 'monthly' as ReportFrequency,
    format: 'pdf' as ReportFormat,
    entities: [] as string[],
    scenario: '1',
    isScheduled: false
  });
  
  const filteredReports = mockReports.filter(report => {
    const matchesTab = report.type === activeTab;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });
  
  const handleGenerateReport = (report: Report) => {
    addNotification({
      type: 'info',
      title: 'Gerando relatório',
      message: `${report.name} está sendo processado...`
    });
    
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Relatório gerado',
        message: `${report.name} foi gerado com sucesso`
      });
    }, 2000);
  };
  
  const handleCreateReport = () => {
    if (!newReport.name || !newReport.description) {
      addNotification({
        type: 'error',
        title: 'Erro na criação',
        message: 'Nome e descrição são obrigatórios'
      });
      return;
    }
    
    addNotification({
      type: 'success',
      title: 'Relatório criado',
      message: `${newReport.name} foi criado com sucesso`
    });
    
    setShowCreateModal(false);
    setNewReport({
      name: '',
      type: 'financial',
      description: '',
      frequency: 'monthly',
      format: 'pdf',
      entities: [],
      scenario: '1',
      isScheduled: false
    });
  };
  
  const handleDeleteReport = (reportId: string) => {
    addNotification({
      type: 'success',
      title: 'Relatório excluído',
      message: 'Relatório foi removido com sucesso'
    });
  };
  
  const getFrequencyLabel = (frequency: ReportFrequency) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual'
    };
    return labels[frequency];
  };
  
  const getFormatIcon = (format: ReportFormat) => {
    switch (format) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'csv': return '📋';
      default: return '📄';
    }
  };
  
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Geração e gerenciamento de relatórios financeiros
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Novo Relatório</span>
        </button>
      </div>
      
      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('financial')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                ${activeTab === 'financial'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Financeiros
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200
                ${activeTab === 'custom'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Personalizados
            </button>
          </div>
          
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar relatórios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>
      
      {/* Lista de Relatórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReports.map(report => {
          const entityNames = report.entities.map(id => 
            mockEntities.find(e => e.id === id)?.name || 'Entidade'
          ).join(', ');
          
          const scenarioName = mockScenarios.find(s => s.id === report.scenario)?.name || 'Cenário';
          
          return (
            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getFormatIcon(report.format)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {report.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {report.description}
                    </p>
                  </div>
                </div>
                
                {report.isScheduled && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs rounded-full">
                    <Clock className="w-3 h-3" />
                    <span>Agendado</span>
                  </div>
                )}
              </div>
              
              {/* Informações */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Frequência:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getFrequencyLabel(report.frequency)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Última geração:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(report.lastGenerated)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Criado por:</span>
                  <span className="font-medium text-gray-900 dark:text-white flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {report.createdBy}
                  </span>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Entidades:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {report.entities.map(entityId => {
                      const entity = mockEntities.find(e => e.id === entityId);
                      return (
                        <span key={entityId} className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded">
                          <Building2 className="w-3 h-3 mr-1" />
                          {entity?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cenário:</span>
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 text-xs rounded">
                    <Target className="w-3 h-3 mr-1" />
                    {scenarioName}
                  </span>
                </div>
              </div>
              
              {/* Ações */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleGenerateReport(report)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors duration-200"
                  >
                    <Download className="w-3 h-3" />
                    <span>Gerar</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded transition-colors duration-200"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Visualizar</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Criar Novo Relatório
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Relatório
                    </label>
                    <input
                      type="text"
                      value={newReport.name}
                      onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: DRE Mensal Consolidado"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <select
                      value={newReport.type}
                      onChange={(e) => setNewReport(prev => ({ ...prev, type: e.target.value as ReportType }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="financial">Financeiro</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newReport.description}
                    onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva o objetivo e conteúdo do relatório..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frequência
                    </label>
                    <select
                      value={newReport.frequency}
                      onChange={(e) => setNewReport(prev => ({ ...prev, frequency: e.target.value as ReportFrequency }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Formato
                    </label>
                    <select
                      value={newReport.format}
                      onChange={(e) => setNewReport(prev => ({ ...prev, format: e.target.value as ReportFormat }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cenário
                    </label>
                    <select
                      value={newReport.scenario}
                      onChange={(e) => setNewReport(prev => ({ ...prev, scenario: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {mockScenarios.map(scenario => (
                        <option key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entidades
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    {mockEntities.map(entity => (
                      <label key={entity.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newReport.entities.includes(entity.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewReport(prev => ({ ...prev, entities: [...prev.entities, entity.id] }));
                            } else {
                              setNewReport(prev => ({ ...prev, entities: prev.entities.filter(id => id !== entity.id) }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {entity.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newReport.isScheduled}
                      onChange={(e) => setNewReport(prev => ({ ...prev, isScheduled: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Agendar geração automática
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateReport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Criar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};