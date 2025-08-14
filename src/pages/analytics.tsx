import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ArrowUpDown,
  Target,
  Building2
} from 'lucide-react';
import { 
  AreaChart, 
  WaterfallChart, 
  DonutCard, 
  KPICard 
} from '../components/ui';
import { useDashboardStore, useUIStore, useDataStore } from '../store';
import { 
  mockKPIData, 
  mockDonutData, 
  mockAreaChartData, 
  mockWaterfallData,
  mockScenarios
} from '../data/mock-data';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters';
import { ScenarioType } from '../types';

type AnalyticsTab = 'dre' | 'comparisons' | 'trends';

export const Analytics: React.FC = () => {
  const { 
    filters, 
    setFilters
  } = useDashboardStore();
  
  const {
    entities,
    entitiesLoading
  } = useDataStore();
  
  const { addNotification, isMobile } = useUIStore();
  
  // Função para obter entidades selecionadas
  const getSelectedEntitiesData = () => {
    return entities.filter(entity => filters.entityIds.includes(entity.id));
  };
  
  const [activeTab, setActiveTab] = React.useState<AnalyticsTab>('dre');
  const [comparisonPeriod, setComparisonPeriod] = React.useState('previous-year');
  const [analysisLevel, setAnalysisLevel] = React.useState('consolidated');
  
  const handleEntityChange = (entityId: string) => {
    const currentEntities = filters.entityIds;
    const newEntities = currentEntities.includes(entityId)
      ? currentEntities.filter(id => id !== entityId)
      : [...currentEntities, entityId];
    
    setFilters({ entityIds: newEntities });
  };
  
  const handleExport = (type: string) => {
    addNotification({
      type: 'success',
      title: 'Exportação iniciada',
      message: `Relatório de ${type} será baixado em instantes`
    });
  };
  
  const selectedEntities = getSelectedEntitiesData();
  
  const tabs = [
    { id: 'dre', label: 'Análise DRE', icon: BarChart3 },
    { id: 'comparisons', label: 'Comparações', icon: ArrowUpDown },
    { id: 'trends', label: 'Tendências', icon: TrendingUp }
  ];
  
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análises avançadas e comparações detalhadas
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExport(activeTab)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Exportar</span>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Análise DRE */}
          {activeTab === 'dre' && (
            <div className="space-y-6">
              {/* Filtros DRE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nível de Análise
                  </label>
                  <select
                    value={analysisLevel}
                    onChange={(e) => setAnalysisLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="consolidated">Consolidado</option>
                    <option value="by-entity">Por Entidade</option>
                    <option value="by-account">Por Conta</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cenário
                  </label>
                  <select
                    value={filters.scenarios[0] || ''}
                    onChange={(e) => setFilters({ scenarios: [e.target.value as ScenarioType] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {mockScenarios.map(scenario => (
                      <option key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Período
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>
              
              {/* KPIs DRE */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Receita Bruta</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(15420000)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    +12.5% vs período anterior
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Receita Líquida</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(13650000)}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    88.5% da receita bruta
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">EBITDA</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(3420000)}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    25.1% margem EBITDA
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Lucro Líquido</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {formatCurrency(2180000)}
                      </p>
                    </div>
                    <PieChart className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    16.0% margem líquida
                  </p>
                </div>
              </div>
              
              {/* Waterfall Chart */}
              <WaterfallChart
                title="Demonstração do Resultado do Exercício (DRE)"
                data={mockWaterfallData}
                height={450}
              />
            </div>
          )}
          
          {/* Comparações */}
          {activeTab === 'comparisons' && (
            <div className="space-y-6">
              {/* Filtros Comparação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Período de Comparação
                  </label>
                  <select
                    value={comparisonPeriod}
                    onChange={(e) => setComparisonPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="previous-month">Mês Anterior</option>
                    <option value="previous-quarter">Trimestre Anterior</option>
                    <option value="previous-year">Ano Anterior</option>
                    <option value="budget">Orçado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Análise
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="absolute">Valores Absolutos</option>
                    <option value="percentage">Variação %</option>
                    <option value="both">Ambos</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Agrupamento
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="account">Por Conta</option>
                    <option value="nature">Por Natureza</option>
                    <option value="entity">Por Entidade</option>
                  </select>
                </div>
              </div>
              
              {/* Comparação de KPIs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Receita: Atual vs {comparisonPeriod === 'previous-year' ? 'Ano Anterior' : 'Período Anterior'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Atual</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(13650000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Anterior</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(12140000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Variação</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(1510000)} (+12.4%)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Lucro: Atual vs {comparisonPeriod === 'previous-year' ? 'Ano Anterior' : 'Período Anterior'}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Atual</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(2180000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Anterior</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(1890000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Variação</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(290000)} (+15.3%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Gráfico de Comparação */}
              <AreaChart
                title="Comparação Temporal - Receita e Lucro"
                data={mockAreaChartData}
                dataKeys={[
                  { key: 'real', name: 'Receita Atual', color: '#3b82f6' },
                  { key: 'budget', name: 'Receita Anterior', color: '#94a3b8' },
                  { key: 'forecast', name: 'Lucro Atual', color: '#10b981' }
                ]}
                format="currency"
                height={350}
                showGrid={true}
                showLegend={true}
                showTooltip={true}
              />
            </div>
          )}
          
          {/* Tendências */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Filtros Tendências */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Período de Análise
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="12-months">Últimos 12 meses</option>
                    <option value="24-months">Últimos 24 meses</option>
                    <option value="36-months">Últimos 36 meses</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Métrica Principal
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="revenue">Receita</option>
                    <option value="profit">Lucro</option>
                    <option value="ebitda">EBITDA</option>
                    <option value="margin">Margem</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Projeção
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">Sem Projeção</option>
                    <option value="linear">Linear</option>
                    <option value="seasonal">Sazonal</option>
                  </select>
                </div>
              </div>
              
              {/* Indicadores de Tendência */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Crescimento Médio
                    </h3>
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    +8.7%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Crescimento mensal médio nos últimos 12 meses
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Volatilidade
                    </h3>
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    12.3%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Desvio padrão das variações mensais
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Sazonalidade
                    </h3>
                    <Calendar className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    Q4
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Trimestre com melhor performance
                  </p>
                </div>
              </div>
              
              {/* Gráfico de Tendências */}
              <AreaChart
                title="Análise de Tendências - Receita e Projeções"
                data={mockAreaChartData}
                dataKeys={[
                  { key: 'real', name: 'Histórico', color: '#3b82f6' },
                  { key: 'forecast', name: 'Projeção Linear', color: '#f59e0b' },
                  { key: 'budget', name: 'Meta', color: '#10b981' }
                ]}
                format="currency"
                height={400}
                showGrid={true}
                showLegend={true}
                showTooltip={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};