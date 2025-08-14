import React, { useState, useEffect } from 'react';
import { X, Save, Building2, CreditCard, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FinancialFact } from '../../types';
import { mockEntities, mockAccounts } from '../../data/mock-data';
import { formatCurrency } from '../../utils/formatters';

interface FinancialFactFormProps {
  fact?: FinancialFact;
  onSave: (data: Partial<FinancialFact>) => void;
  onCancel: () => void;
}

export const FinancialFactForm: React.FC<FinancialFactFormProps> = ({
  fact,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    entityId: '',
    accountId: '',
    scenarioId: 'real' as 'real' | 'budget' | 'forecast',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    value: 0,
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fact) {
      setFormData({
        entityId: fact.entityId,
        accountId: fact.accountId,
        scenarioId: fact.scenarioId,
        year: fact.year,
        month: fact.month,
        value: fact.value,
        description: fact.description || ''
      });
    }
  }, [fact]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.entityId) {
      newErrors.entityId = 'Entidade é obrigatória';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Conta é obrigatória';
    }

    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      newErrors.year = 'Ano deve estar entre 2000 e 2100';
    }

    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Mês deve estar entre 1 e 12';
    }

    if (formData.value === undefined || formData.value === null) {
      newErrors.value = 'Valor é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedEntity = mockEntities.find(e => e.id === formData.entityId);
  const selectedAccount = mockAccounts.find(a => a.id === formData.accountId);

  const scenarioOptions = [
    { value: 'real', label: 'Real', color: 'text-green-600' },
    { value: 'budget', label: 'Orçado', color: 'text-blue-600' },
    { value: 'forecast', label: 'Forecast', color: 'text-purple-600' }
  ];

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
            {fact ? 'Editar Fato Financeiro' : 'Novo Fato Financeiro'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entidade e Conta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityId" className="text-sm font-medium">
                <Building2 className="w-4 h-4 inline mr-2" />
                Entidade
              </Label>
              <Select
                value={formData.entityId}
                onValueChange={(value) => handleInputChange('entityId', value)}
              >
                <SelectTrigger className={`${errors.entityId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione uma entidade" />
                </SelectTrigger>
                <SelectContent>
                  {mockEntities.filter(e => e.isActive).map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{entity.name}</span>
                        <span className="text-xs text-muted-foreground">({entity.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entityId && (
                <p className="text-xs text-red-500">{errors.entityId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId" className="text-sm font-medium">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Conta
              </Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => handleInputChange('accountId', value)}
              >
                <SelectTrigger className={`${errors.accountId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {mockAccounts.filter(a => a.isActive).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{account.code}</span>
                        <span className="text-sm">{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-xs text-red-500">{errors.accountId}</p>
              )}
            </div>
          </div>

          {/* Período e Cenário */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-medium">
                <Calendar className="w-4 h-4 inline mr-2" />
                Ano
              </Label>
              <Input
                id="year"
                type="number"
                min="2000"
                max="2100"
                value={formData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                className={`${errors.year ? 'border-red-500' : ''}`}
                placeholder="2024"
              />
              {errors.year && (
                <p className="text-xs text-red-500">{errors.year}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="month" className="text-sm font-medium">
                Mês
              </Label>
              <Select
                value={formData.month.toString()}
                onValueChange={(value) => handleInputChange('month', parseInt(value))}
              >
                <SelectTrigger className={`${errors.month ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.month && (
                <p className="text-xs text-red-500">{errors.month}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scenarioId" className="text-sm font-medium">
                Cenário
              </Label>
              <Select
                value={formData.scenarioId}
                onValueChange={(value) => handleInputChange('scenarioId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cenário" />
                </SelectTrigger>
                <SelectContent>
                  {scenarioOptions.map((scenario) => (
                    <SelectItem key={scenario.value} value={scenario.value}>
                      <span className={scenario.color}>{scenario.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm font-medium">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Valor
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                className={`pl-10 ${errors.value ? 'border-red-500' : ''}`}
                placeholder="0,00"
              />
            </div>
            {errors.value && (
              <p className="text-xs text-red-500">{errors.value}</p>
            )}
            {formData.value !== 0 && (
              <p className="text-xs text-muted-foreground">
                Valor formatado: {formatCurrency(formData.value)}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição (opcional)
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição adicional do fato financeiro"
            />
          </div>

          {/* Preview */}
          {(selectedEntity || selectedAccount) && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Preview:</h4>
              <div className="text-sm space-y-1">
                {selectedEntity && (
                  <p><span className="font-medium">Entidade:</span> {selectedEntity.name}</p>
                )}
                {selectedAccount && (
                  <p><span className="font-medium">Conta:</span> {selectedAccount.code} - {selectedAccount.name}</p>
                )}
                <p><span className="font-medium">Período:</span> {months[formData.month - 1]} de {formData.year}</p>
                <p><span className="font-medium">Cenário:</span> {scenarioOptions.find(s => s.value === formData.scenarioId)?.label}</p>
                <p><span className="font-medium">Valor:</span> {formatCurrency(formData.value)}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-tech-600 to-tech-500 hover:from-tech-700 hover:to-tech-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {fact ? 'Atualizar' : 'Criar'} Fato
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};