import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  TrendingUp,
  Database,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/tables/data-table';
import { EntityForm } from '../components/forms/entity-form';
import { AccountForm } from '../components/forms/account-form';
import { FinancialFactForm } from '../components/forms/financial-fact-form';
import { useUIStore, useDataStore } from '../store';
import { mockEntities, mockAccounts, mockFinancialFacts } from '../data/mock-data';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Entity, Account, FinancialFact } from '../types';

type AdminTab = 'entities' | 'accounts' | 'facts' | 'overview';

export const Admin: React.FC = () => {
  const { addNotification, isMobile } = useUIStore();
  
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
    createEntity,
    updateEntity,
    deleteEntity,
    createAccount,
    updateAccount,
    deleteAccount,
    createFinancialFact,
    updateFinancialFact,
    deleteFinancialFact
  } = useDataStore();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Entity | Account | FinancialFact | null>(null);
  
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { id: 'entities', label: 'Entidades', icon: Building2 },
    { id: 'accounts', label: 'Plano de Contas', icon: CreditCard },
    { id: 'facts', label: 'Fatos Financeiros', icon: Database }
  ];
  
  const handleCreate = () => {
    setSelectedItem(null);
    setShowCreateModal(true);
  };
  
  const handleEdit = (item: Entity | Account | FinancialFact) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };
  
  const handleSave = (data: any) => {
    const itemType = activeTab === 'entities' ? 'Entidade' : 
                    activeTab === 'accounts' ? 'Conta' : 'Fato Financeiro';
    
    addNotification({
      type: 'success',
      title: `${itemType} ${selectedItem ? 'atualizada' : 'criada'}`,
      message: `${data.name || data.code || 'Item'} foi ${selectedItem ? 'atualizado' : 'criado'} com sucesso`
    });
    
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
  };
  
  const handleDelete = (id: string, name: string) => {
    const itemType = activeTab === 'entities' ? 'Entidade' : 
                    activeTab === 'accounts' ? 'Conta' : 'Fato Financeiro';
    
    addNotification({
      type: 'success',
      title: `${itemType} excluída`,
      message: `${name} foi removido com sucesso`
    });
  };
  
  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
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
  
  const getFilteredEntities = () => {
    return entities.filter(entity => 
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.cnpj.includes(searchTerm)
    );
  };
  
  const getFilteredAccounts = () => {
    return accounts.filter(account => 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.includes(searchTerm)
    );
  };
  
  const getFilteredFacts = () => {
    return financialFacts.filter(fact => {
      const entity = entities.find(e => e.id === fact.entityId);
      const account = accounts.find(a => a.id === fact.accountId);
      return entity?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             account?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             fact.scenarioId.includes(searchTerm.toLowerCase());
    });
  };
  
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Entidades</p>
              <p className="text-2xl font-bold text-tech-600">{entities.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {entities.filter(e => e.isActive).length} ativas
              </p>
            </div>
            <Building2 className="h-8 w-8 text-tech-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Contas</p>
              <p className="text-2xl font-bold text-tech-600">{accounts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {accounts.filter(a => a.isActive).length} ativas
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-tech-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fatos Financeiros</p>
              <p className="text-2xl font-bold text-tech-600">{financialFacts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Último mês
              </p>
            </div>
            <Database className="h-8 w-8 text-tech-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
              <p className="text-2xl font-bold text-tech-600">
                {formatCurrency(financialFacts.reduce((sum, fact) => sum + Math.abs(fact.value), 0))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os cenários
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-tech-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const renderEntities = () => {
    const entities = getFilteredEntities();
    
    const columns = [
      {
        key: 'name',
        label: 'Nome',
        filterable: true,
        render: (entity: Entity) => (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-tech-500 to-tech-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{entity.name}</p>
              <p className="text-sm text-muted-foreground">{entity.code}</p>
            </div>
          </div>
        )
      },
      {
        key: 'cnpj',
        label: 'CNPJ',
        filterable: true,
        render: (entity: Entity) => entity.cnpj
      },
      {
        key: 'status',
        label: 'Status',
        render: (entity: Entity) => (
          <Badge variant={entity.isActive ? 'default' : 'secondary'}>
            {entity.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        )
      },
      {
        key: 'createdAt',
        label: 'Criado em',
        render: (entity: Entity) => formatDate(new Date(entity.createdAt))
      }
    ];
    
    return (
      <DataTable
        title="Entidades"
        data={entities}
        columns={columns}
        onAdd={handleCreate}
        onEdit={handleEdit}
        onDelete={(entity: Entity) => handleDelete(entity.id, entity.name)}
        searchPlaceholder="Buscar entidades..."
      />
    );
  };
  
  const renderAccounts = () => {
    const accounts = getFilteredAccounts();
    
    const columns = [
      {
        key: 'code',
        label: 'Código',
        filterable: true,
        render: (account: Account) => (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{account.code}</p>
              <p className="text-sm text-muted-foreground">Nível {account.level}</p>
            </div>
          </div>
        )
      },
      {
        key: 'name',
        label: 'Nome',
        filterable: true,
        render: (account: Account) => account.name
      },
      {
        key: 'nature',
        label: 'Natureza',
        render: (account: Account) => {
          const natureColors = {
            revenue: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            deduction: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
            cost: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
            expense: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            other_revenue: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
            other_expense: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400'
          };
          
          const natureLabels = {
            revenue: 'Receita',
            deduction: 'Dedução',
            cost: 'Custo',
            expense: 'Despesa',
            other_revenue: 'Outras Receitas',
            other_expense: 'Outras Despesas'
          };
          
          return (
            <span className={`px-2 py-1 text-xs rounded-full ${natureColors[account.nature]}`}>
              {natureLabels[account.nature]}
            </span>
          );
        }
      },
      {
        key: 'status',
        label: 'Status',
        render: (account: Account) => (
          <Badge variant={account.isActive ? 'default' : 'secondary'}>
            {account.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        )
      }
    ];
    
    return (
      <DataTable
        title="Plano de Contas"
        data={accounts}
        columns={columns}
        onAdd={handleCreate}
        onEdit={handleEdit}
        onDelete={(account: Account) => handleDelete(account.id, account.name)}
        searchPlaceholder="Buscar contas..."
      />
    );
  };
  
  const renderFacts = () => {
    const facts = getFilteredFacts();
    
    const columns = [
      {
        key: 'entityId',
        label: 'Entidade',
        filterable: true,
        render: (fact: FinancialFact) => {
          const entity = mockEntities.find(e => e.id === fact.entityId);
          return (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{entity?.name}</p>
                <p className="text-sm text-muted-foreground">{entity?.code}</p>
              </div>
            </div>
          );
        }
      },
      {
        key: 'accountId',
        label: 'Conta',
        filterable: true,
        render: (fact: FinancialFact) => {
          const account = mockAccounts.find(a => a.id === fact.accountId);
          return (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{account?.name}</p>
              <p className="text-sm text-muted-foreground">{account?.code}</p>
            </div>
          );
        }
      },
      {
        key: 'period',
        label: 'Período',
        render: (fact: FinancialFact) => `${fact.month.toString().padStart(2, '0')}/${fact.year}`
      },
      {
        key: 'scenarioId',
        label: 'Cenário',
        filterable: true,
        render: (fact: FinancialFact) => {
          const scenarioColors = {
            real: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            budget: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            forecast: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
          };
          
          const scenarioLabels = {
            real: 'Real',
            budget: 'Orçado',
            forecast: 'Forecast'
          };
          
          return (
            <span className={`px-2 py-1 text-xs rounded-full ${scenarioColors[fact.scenarioId]}`}>
              {scenarioLabels[fact.scenarioId]}
            </span>
          );
        }
      },
      {
        key: 'value',
        label: 'Valor',
        render: (fact: FinancialFact) => (
          <span className={`font-medium ${
            fact.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(fact.value)}
          </span>
        )
      }
    ];
    
    return (
      <DataTable
        title="Fatos Financeiros"
        data={facts}
        columns={columns}
        onAdd={handleCreate}
        onEdit={handleEdit}
        onDelete={(fact: FinancialFact) => {
          const entity = mockEntities.find(e => e.id === fact.entityId);
          const account = mockAccounts.find(a => a.id === fact.accountId);
          handleDelete(fact.id, `${entity?.name} - ${account?.name}`);
        }}
        searchPlaceholder="Buscar fatos financeiros..."
      />
    );
  };
  
  const renderForm = () => {
    if (activeTab === 'entities') {
      return (
        <EntityForm
          entity={selectedItem as Entity}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    } else if (activeTab === 'accounts') {
      return (
        <AccountForm
          account={selectedItem as Account}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    } else if (activeTab === 'facts') {
      return (
        <FinancialFactForm
          fact={selectedItem as FinancialFact}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }
    return null;
  };
  
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
            Administração de Dados
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento completo de entidades, contas e fatos financeiros
          </p>
        </div>
        
        {activeTab === 'overview' && (
           <div className="flex items-center space-x-3">
             <Button variant="outline" size="sm">
               <Upload className="w-4 h-4 mr-2" />
               Importar Dados
             </Button>
             <Button variant="outline" size="sm">
               <Download className="w-4 h-4 mr-2" />
               Exportar Relatório
             </Button>
           </div>
         )}
      </div>
      
      {/* Tabs */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200
                    ${activeTab === tab.id
                      ? 'border-tech-500 text-tech-600 dark:text-tech-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-tech-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </CardHeader>
        
        <CardContent className="pt-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'entities' && renderEntities()}
          {activeTab === 'accounts' && renderAccounts()}
          {activeTab === 'facts' && renderFacts()}
        </CardContent>
      </Card>
      
      {/* Modal de Criação/Edição */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background/95 backdrop-blur-md border border-tech-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {renderForm()}
          </div>
        </div>
      )}
    </div>
  );
};