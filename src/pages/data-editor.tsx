import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/tables/data-table';
import { EntityForm } from '@/components/forms/entity-form';
import { AccountForm } from '@/components/forms/account-form';
import { FinancialFactForm } from '@/components/forms/financial-fact-form';
import { Entity, Account, FinancialFact, AccountNature } from '@/types';
import { mockEntities, mockAccounts, generateFinancialFacts } from '@/data/mock-data';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  Building2,
  Calculator,
  TrendingUp,
  Database,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

type EditMode = 'list' | 'create' | 'edit';
type ActiveTab = 'entities' | 'accounts' | 'facts';

export default function DataEditor() {
  const [entities, setEntities] = useState<Entity[]>(mockEntities);
  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);
  const [facts, setFacts] = useState<FinancialFact[]>(generateFinancialFacts());
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('entities');
  const [mode, setMode] = useState<EditMode>('list');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Handlers para Entidades
  const handleEntitySave = (entityData: Omit<Entity, 'id'> | Entity) => {
    if ('id' in entityData) {
      // Editar
      setEntities(prev => prev.map(e => e.id === entityData.id ? entityData : e));
      toast.success('Entidade atualizada com sucesso!');
    } else {
      // Criar
      const newEntity: Entity = {
        ...entityData,
        id: `entity-${Date.now()}`
      };
      setEntities(prev => [...prev, newEntity]);
      toast.success('Entidade criada com sucesso!');
    }
    setMode('list');
    setEditingItem(null);
  };

  const handleEntityEdit = (entity: Entity) => {
    setEditingItem(entity);
    setMode('edit');
  };

  const handleEntityDelete = (entity: Entity) => {
    if (confirm(`Tem certeza que deseja excluir a entidade "${entity.name}"?`)) {
      setEntities(prev => prev.filter(e => e.id !== entity.id));
      // Remover fatos financeiros relacionados
      setFacts(prev => prev.filter(f => f.entityId !== entity.id));
      toast.success('Entidade excluída com sucesso!');
    }
  };

  // Handlers para Contas
  const handleAccountSave = (accountData: Omit<Account, 'id'> | Account) => {
    if ('id' in accountData) {
      // Editar
      setAccounts(prev => prev.map(a => a.id === accountData.id ? accountData : a));
      toast.success('Conta atualizada com sucesso!');
    } else {
      // Criar
      const newAccount: Account = {
        ...accountData,
        id: `acc-${accountData.code}`
      };
      setAccounts(prev => [...prev, newAccount]);
      toast.success('Conta criada com sucesso!');
    }
    setMode('list');
    setEditingItem(null);
  };

  const handleAccountEdit = (account: Account) => {
    setEditingItem(account);
    setMode('edit');
  };

  const handleAccountDelete = (account: Account) => {
    if (confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      setAccounts(prev => prev.filter(a => a.id !== account.id));
      // Remover fatos financeiros relacionados
      setFacts(prev => prev.filter(f => f.accountId !== account.id));
      toast.success('Conta excluída com sucesso!');
    }
  };

  // Handlers para Fatos Financeiros
  const handleFactSave = (factData: Omit<FinancialFact, 'id'> | FinancialFact) => {
    if ('id' in factData) {
      // Editar
      setFacts(prev => prev.map(f => f.id === factData.id ? factData : f));
      toast.success('Fato financeiro atualizado com sucesso!');
    } else {
      // Criar
      const newFact: FinancialFact = {
        ...factData,
        id: `fact-${Date.now()}`
      };
      setFacts(prev => [...prev, newFact]);
      toast.success('Fato financeiro criado com sucesso!');
    }
    setMode('list');
    setEditingItem(null);
  };

  const handleFactEdit = (fact: FinancialFact) => {
    setEditingItem(fact);
    setMode('edit');
  };

  const handleFactDelete = (fact: FinancialFact) => {
    if (confirm('Tem certeza que deseja excluir este fato financeiro?')) {
      setFacts(prev => prev.filter(f => f.id !== fact.id));
      toast.success('Fato financeiro excluído com sucesso!');
    }
  };

  // Handlers gerais
  const handleCancel = () => {
    setMode('list');
    setEditingItem(null);
  };

  const handleRefreshData = () => {
    setFacts(generateFinancialFacts());
    toast.success('Dados atualizados com sucesso!');
  };

  const getAccountNatureBadge = (nature: AccountNature) => {
    const variants = {
      revenue: 'bg-green-100 text-green-800',
      cost: 'bg-red-100 text-red-800',
      expense: 'bg-orange-100 text-orange-800',
      other_revenue: 'bg-blue-100 text-blue-800',
      other_expense: 'bg-purple-100 text-purple-800'
    };

    const labels = {
      revenue: 'Receita',
      cost: 'Custo',
      expense: 'Despesa',
      other_revenue: 'Outras Receitas',
      other_expense: 'Outras Despesas'
    };

    return (
      <Badge className={`${variants[nature]} border-0`}>
        {labels[nature]}
      </Badge>
    );
  };

  // Configurações das colunas para cada tabela
  const entityColumns = [
    { key: 'code', label: 'Código', sortable: true, filterable: true },
    { key: 'name', label: 'Nome', sortable: true, filterable: true },
    { key: 'cnpj', label: 'CNPJ', sortable: true, filterable: true },
    { 
      key: 'createdAt', 
      label: 'Data de Criação', 
      sortable: true,
      render: (entity: Entity) => formatDate(entity.createdAt)
    }
  ];

  const accountColumns = [
    { key: 'code', label: 'Código', sortable: true, filterable: true },
    { key: 'name', label: 'Nome', sortable: true, filterable: true },
    { 
      key: 'nature', 
      label: 'Natureza', 
      sortable: true,
      render: (account: Account) => getAccountNatureBadge(account.nature)
    },
    { key: 'description', label: 'Descrição', filterable: true }
  ];

  const factColumns = [
    { 
      key: 'entityId', 
      label: 'Entidade', 
      sortable: true,
      render: (fact: FinancialFact) => {
        const entity = entities.find(e => e.id === fact.entityId);
        return entity ? `${entity.code} - ${entity.name}` : fact.entityId;
      }
    },
    { 
      key: 'accountId', 
      label: 'Conta', 
      sortable: true,
      render: (fact: FinancialFact) => {
        const account = accounts.find(a => a.id === fact.accountId);
        return account ? `${account.code} - ${account.name}` : fact.accountId;
      }
    },
    { key: 'scenarioId', label: 'Cenário', sortable: true },
    { key: 'year', label: 'Ano', sortable: true },
    { key: 'month', label: 'Mês', sortable: true },
    { 
      key: 'value', 
      label: 'Valor', 
      sortable: true,
      render: (fact: FinancialFact) => (
        <span className={fact.value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(fact.value)}
        </span>
      )
    }
  ];

  if (mode !== 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
              Editor de Dados
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === 'create' ? 'Criando novo' : 'Editando'} {activeTab === 'entities' ? 'entidade' : activeTab === 'accounts' ? 'conta' : 'fato financeiro'}
            </p>
          </div>
        </div>

        {activeTab === 'entities' && (
          <EntityForm
            entity={mode === 'edit' ? editingItem : undefined}
            onSave={handleEntitySave}
            onCancel={handleCancel}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountForm
            account={mode === 'edit' ? editingItem : undefined}
            onSave={handleAccountSave}
            onCancel={handleCancel}
          />
        )}

        {activeTab === 'facts' && (
          <FinancialFactForm
            fact={mode === 'edit' ? editingItem : undefined}
            onSave={handleFactSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
            Editor de Dados
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie entidades, contas contábeis e fatos financeiros
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshData}
            className="glass-button"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Dados
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entidades</CardTitle>
            <Building2 className="h-4 w-4 text-tech-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
              {entities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Empresas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas</CardTitle>
            <Calculator className="h-4 w-4 text-tech-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
              {accounts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas contábeis
            </p>
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fatos Financeiros</CardTitle>
            <TrendingUp className="h-4 w-4 text-tech-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
              {facts.length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Registros financeiros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com tabelas */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)}>
        <TabsList className="glass-card">
          <TabsTrigger value="entities" className="glass-button">
            <Building2 className="w-4 h-4 mr-2" />
            Entidades
          </TabsTrigger>
          <TabsTrigger value="accounts" className="glass-button">
            <Calculator className="w-4 h-4 mr-2" />
            Contas
          </TabsTrigger>
          <TabsTrigger value="facts" className="glass-button">
            <Database className="w-4 h-4 mr-2" />
            Fatos Financeiros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          <DataTable
            title="Entidades"
            data={entities}
            columns={entityColumns}
            onAdd={() => setMode('create')}
            onEdit={handleEntityEdit}
            onDelete={handleEntityDelete}
            searchPlaceholder="Pesquisar entidades..."
            emptyMessage="Nenhuma entidade cadastrada"
          />
        </TabsContent>

        <TabsContent value="accounts">
          <DataTable
            title="Contas Contábeis"
            data={accounts}
            columns={accountColumns}
            onAdd={() => setMode('create')}
            onEdit={handleAccountEdit}
            onDelete={handleAccountDelete}
            searchPlaceholder="Pesquisar contas..."
            emptyMessage="Nenhuma conta cadastrada"
          />
        </TabsContent>

        <TabsContent value="facts">
          <DataTable
            title="Fatos Financeiros"
            data={facts}
            columns={factColumns}
            onAdd={() => setMode('create')}
            onEdit={handleFactEdit}
            onDelete={handleFactDelete}
            searchPlaceholder="Pesquisar fatos financeiros..."
            emptyMessage="Nenhum fato financeiro cadastrado"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}