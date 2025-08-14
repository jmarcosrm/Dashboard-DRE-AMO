import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Calendar, 
  Building2, 
  Target, 
  X, 
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { useDataStore } from '../../store/data-store';
import { DashboardFilters, ScenarioType } from '../../types';

interface AdvancedFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  className?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  className = '' 
}) => {
  const { entities, accounts } = useDataStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchEntity, setSearchEntity] = useState('');
  const [searchAccount, setSearchAccount] = useState('');

  // Opções de cenário
  const scenarioOptions: { value: ScenarioType; label: string }[] = [
    { value: 'real', label: 'Real' },
    { value: 'budget', label: 'Orçado' },
    { value: 'forecast', label: 'Forecast' }
  ];

  // Filtrar entidades por busca
  const filteredEntities = entities.filter(entity => 
    entity.name.toLowerCase().includes(searchEntity.toLowerCase()) ||
    entity.code.toLowerCase().includes(searchEntity.toLowerCase())
  );

  // Filtrar contas por busca
  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchAccount.toLowerCase()) ||
    account.code.toLowerCase().includes(searchAccount.toLowerCase())
  );

  // Handlers para mudanças nos filtros
  const handleEntityToggle = (entityId: string) => {
    const newEntityIds = filters.entityIds.includes(entityId)
      ? filters.entityIds.filter(id => id !== entityId)
      : [...filters.entityIds, entityId];
    
    onFiltersChange({ ...filters, entityIds: newEntityIds });
  };

  const handleScenarioToggle = (scenario: ScenarioType) => {
    const newScenarios = filters.scenarios.includes(scenario)
      ? filters.scenarios.filter(s => s !== scenario)
      : [...filters.scenarios, scenario];
    
    onFiltersChange({ ...filters, scenarios: newScenarios });
  };

  const handleAccountToggle = (accountId: string) => {
    const currentAccountIds = filters.accountIds || [];
    const newAccountIds = currentAccountIds.includes(accountId)
      ? currentAccountIds.filter(id => id !== accountId)
      : [...currentAccountIds, accountId];
    
    onFiltersChange({ ...filters, accountIds: newAccountIds });
  };

  const handlePeriodChange = (field: 'periodStart' | 'periodEnd', value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      entityIds: [],
      scenarios: ['real'],
      periodStart: '',
      periodEnd: '',
      accountIds: []
    });
  };

  const selectAllEntities = () => {
    onFiltersChange({ ...filters, entityIds: entities.map(e => e.id) });
  };

  const selectAllScenarios = () => {
    onFiltersChange({ ...filters, scenarios: scenarioOptions.map(s => s.value) });
  };

  // Contar filtros ativos
  const activeFiltersCount = (
    filters.entityIds.length + 
    filters.scenarios.length + 
    (filters.accountIds?.length || 0) +
    (filters.periodStart ? 1 : 0) +
    (filters.periodEnd ? 1 : 0)
  );

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Filtros Avançados</h3>
              <p className="text-sm text-gray-500">
                {activeFiltersCount} filtro(s) ativo(s)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Limpar Tudo
              </button>
            )}
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Rápidos */}
      <div className="p-4 border-b bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Período
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="month"
                value={filters.periodStart}
                onChange={(e) => handlePeriodChange('periodStart', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Início"
              />
              <input
                type="month"
                value={filters.periodEnd}
                onChange={(e) => handlePeriodChange('periodEnd', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Fim"
              />
            </div>
          </div>

          {/* Cenários */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Target className="h-4 w-4 inline mr-1" />
              Cenários
            </label>
            <div className="space-y-1">
              {scenarioOptions.map(scenario => (
                <label key={scenario.value} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.scenarios.includes(scenario.value)}
                    onChange={() => handleScenarioToggle(scenario.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{scenario.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Entidades Rápidas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Entidades ({filters.entityIds.length}/{entities.length})
            </label>
            <div className="space-y-1">
              <button
                onClick={selectAllEntities}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Selecionar Todas
              </button>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {entities.slice(0, 3).map(entity => (
                  <label key={entity.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.entityIds.includes(entity.id)}
                      onChange={() => handleEntityToggle(entity.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{entity.name}</span>
                  </label>
                ))}
                {entities.length > 3 && (
                  <div className="text-xs text-gray-500">
                    ... e mais {entities.length - 3} entidade(s)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros Detalhados */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Entidades Detalhadas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Entidades</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAllEntities}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Selecionar Todas
                </button>
                <button
                  onClick={() => onFiltersChange({ ...filters, entityIds: [] })}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
            
            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar entidades..."
                value={searchEntity}
                onChange={(e) => setSearchEntity(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {filteredEntities.map(entity => (
                <label key={entity.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded text-sm">
                  <input
                    type="checkbox"
                    checked={filters.entityIds.includes(entity.id)}
                    onChange={() => handleEntityToggle(entity.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{entity.name}</div>
                    <div className="text-xs text-gray-500 truncate">{entity.code}</div>
                  </div>
                  {filters.entityIds.includes(entity.id) && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Contas Detalhadas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Contas</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onFiltersChange({ ...filters, accountIds: accounts.map(a => a.id) })}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Selecionar Todas
                </button>
                <button
                  onClick={() => onFiltersChange({ ...filters, accountIds: [] })}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
            
            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar contas..."
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {filteredAccounts.map(account => (
                <label key={account.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded text-sm">
                  <input
                    type="checkbox"
                    checked={(filters.accountIds || []).includes(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{account.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {account.code} • {account.nature}
                    </div>
                  </div>
                  {(filters.accountIds || []).includes(account.id) && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;