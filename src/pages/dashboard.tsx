import React, { useState } from 'react';
import { 
  Calendar, 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Target,
  Upload
} from 'lucide-react';
import { 
  KPICard, 
  DonutCard, 
  AreaChart, 
  WaterfallChart 
} from '../components/ui';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useDashboardStore, useUIStore, useDataStore } from '../store';
import { useDREKPIs } from '../hooks/use-dre-kpis';
import { useWaterfallData } from '../hooks/use-waterfall-data';
import { useExpenseDonutData, useDeductionDonutData, useRevenueDonutData } from '../hooks/use-donut-data';
import ExcelImportForm from '../components/forms/excel-import-form';
import DataQualityPanel from '../components/dashboard/data-quality-panel';
import AdvancedFilters from '../components/dashboard/advanced-filters';
import QuickFilters from '../components/dashboard/quick-filters';
import { useDashboardFilters } from '../hooks/use-dashboard-filters';
import { 
  mockKPIData, 
  mockDonutData, 
  mockAreaChartData, 
  mockWaterfallData,
  mockScenarios
} from '../data/mock-data';
import { ScenarioType } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { 
    filters, 
    setFilters,
    filteredFacts,
    availableEntities,
    isFiltered,
    filterSummary
  } = useDashboardFilters();
  
  const {
    entities,
    accounts,
    financialFacts,
    entitiesLoading,
    accountsLoading,
    financialFactsLoading,
    loadEntities,
    loadAccounts,
    loadFinancialFacts,
    refreshAll
  } = useDataStore();
  
  const { addNotification, isMobile } = useUIStore();
  const [showImportForm, setShowImportForm] = useState(false);
  
  // Obter KPIs DRE reais
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const selectedEntityId = filters.entityIds[0]; // Primeira entidade selecionada
  
  const { kpis: dreKPIs, metrics, comparison, isLoading: kpisLoading } = useDREKPIs(
    selectedEntityId,
    currentYear,
    currentMonth
  );
  
  // Obter dados do Waterfall Chart
  const { data: waterfallData, isLoading: waterfallLoading } = useWaterfallData(
    selectedEntityId,
    currentYear,
    currentMonth
  );
  
  // Obter dados dos Donut Charts
  const { data: expenseDonutData, total: totalExpenses } = useExpenseDonutData(
    selectedEntityId,
    currentYear,
    currentMonth
  );
  
  const { data: deductionDonutData, total: totalDeductions } = useDeductionDonutData(
    selectedEntityId,
    currentYear,
    currentMonth
  );
  
  const { data: revenueDonutData, total: totalRevenue } = useRevenueDonutData(
    selectedEntityId,
    currentYear,
    currentMonth
  );
  
  // Função para obter entidades selecionadas
  const getSelectedEntitiesData = () => {
    return availableEntities;
  };
  
  // Carregar dados iniciais
  React.useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadEntities(),
          loadAccounts(),
          loadFinancialFacts()
        ]);
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erro ao carregar dados',
          message: 'Não foi possível carregar os dados iniciais'
        });
      }
    };
    
    initializeData();
  }, [loadEntities, loadAccounts, loadFinancialFacts, addNotification]);
  

  
  const handleRefresh = async () => {
    addNotification({
      type: 'info',
      title: 'Atualizando dados',
      message: 'Carregando informações mais recentes...'
    });
    
    try {
      await refreshAll();
      addNotification({
        type: 'success',
        title: 'Dados atualizados',
        message: 'Informações carregadas com sucesso'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro na atualização',
        message: 'Não foi possível atualizar os dados'
      });
    }
  };
  
  const handleExport = () => {
    addNotification({
      type: 'success',
      title: 'Exportação iniciada',
      message: 'Relatório será baixado em instantes'
    });
  };
  
  const selectedEntities = getSelectedEntitiesData();
  
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard DRE Financeiro
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise completa de DRE - Milky Moo, Pass+Demo, E-commerce
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImportForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Importar DRE</span>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={entitiesLoading || accountsLoading || financialFactsLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${(entitiesLoading || accountsLoading || financialFactsLoading) ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Atualizar</span>
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Exportar</span>
          </button>
        </div>
      </div>
      
      {/* Filtros Rápidos */}
      <QuickFilters 
        filters={filters}
        onFiltersChange={setFilters}
        className=""
      />
      
      {/* Filtros Avançados */}
      <AdvancedFilters 
        filters={filters}
        onFiltersChange={setFilters}
        className=""
      />
      
      {/* Resumo dos Filtros */}
      {isFiltered && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Filtros Ativos
                </span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                <span>{filterSummary.entitiesCount} entidade(s)</span>
                <span>{filterSummary.accountsCount} conta(s)</span>
                <span>{filterSummary.periodsCount} período(s)</span>
                <span>{filterSummary.factsCount} registro(s)</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Data Quality Panel */}
      <DataQualityPanel />
      
      {/* KPIs DRE Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          data={dreKPIs.receitaLiquida}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.lucroBruto}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.ebitda}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.lucroLiquido}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
      </div>
      
      {/* KPIs de Margens */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 mt-6">
        <KPICard
          data={dreKPIs.margemBruta}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.margemEbitda}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.margemLiquida}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.cogsPercentual}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.despesasOperacionaisPercentual}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
        <KPICard
          data={dreKPIs.taxaImpostos}
          showSparkline={true}
          showComparison={true}
          showTarget={false}
        />
      </div>
      
      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall Chart DRE */}
        <WaterfallChart
          title="Formação do Lucro Líquido - DRE"
          data={waterfallData}
          height={400}
        />
        
        {/* Donut Chart - Composição da Receita */}
        <DonutCard
          title="Composição da Receita Bruta"
          data={revenueDonutData.map(item => ({
            name: item.name,
            value: item.value,
            color: item.color
          }))}
          format="currency"
          showLegend={true}
          showTooltip={true}
          showValues={true}
        />
      </div>
      
      {/* Gráficos Secundários - Composições DRE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DonutCard
          title="Composição das Deduções"
          data={deductionDonutData.map(item => ({
            name: item.name,
            value: item.value,
            color: item.color
          }))}
          format="currency"
          showLegend={true}
          showTooltip={true}
          showValues={true}
        />
        
        <DonutCard
          title="Composição das Despesas Operacionais"
          data={expenseDonutData.map(item => ({
            name: item.name,
            value: item.value,
            color: item.color
          }))}
          format="currency"
          showLegend={true}
          showTooltip={true}
          showValues={true}
        />
        
        <DonutCard
          title="Distribuição por Filial"
          data={mockDonutData}
          format="currency"
          showLegend={true}
          showTooltip={true}
          showValues={true}
        />
      </div>
      
      {/* Gráfico de Tendência */}
      <div className="grid grid-cols-1">
        <AreaChart
          title="Evolução Mensal - Real vs Orçado vs Forecast"
          data={mockAreaChartData}
          dataKeys={[
            { key: 'real', name: 'Real', color: '#3b82f6' },
            { key: 'budget', name: 'Orçado', color: '#10b981' },
            { key: 'forecast', name: 'Forecast', color: '#f59e0b' }
          ]}
          format="currency"
          height={350}
          showGrid={true}
          showLegend={true}
          showTooltip={true}
        />
      </div>
      
      {/* Resumo Executivo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumo Executivo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
              Destaques Positivos
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Receita 12% acima do orçado</li>
              <li>• EBITDA cresceu 15% vs período anterior</li>
              <li>• Margem líquida melhorou 0.7 p.p.</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <TrendingDown className="w-4 h-4 mr-2 text-red-500" />
              Pontos de Atenção
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Custos operacionais 5% acima do previsto</li>
              <li>• Despesas administrativas cresceram 8%</li>
              <li>• Necessário revisar orçamento Q4</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-500" />
              Próximas Ações
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Implementar controles de custos</li>
              <li>• Revisar forecast para próximo trimestre</li>
              <li>• Análise detalhada de rentabilidade</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Modal de Importação */}
       {showImportForm && (
         <ExcelImportForm
           onClose={() => {
             setShowImportForm(false);
             addNotification({
               type: 'success',
               title: 'DRE importada com sucesso',
               message: 'Os dados foram processados e estão disponíveis no dashboard'
             });
           }}
         />
       )}
    </div>
  );
};