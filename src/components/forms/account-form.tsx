import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Account, AccountNature } from '@/types';
import { Save, X } from 'lucide-react';

interface AccountFormProps {
  account?: Account;
  onSave: (account: Omit<Account, 'id'> | Account) => void;
  onCancel: () => void;
}

const accountTypes: { value: AccountNature; label: string }[] = [
  { value: 'revenue', label: 'Receita' },
  { value: 'cost', label: 'Custo' },
  { value: 'expense', label: 'Despesa' },
  { value: 'other_revenue', label: 'Outras Receitas' },
  { value: 'other_expense', label: 'Outras Despesas' }
];

export function AccountForm({ account, onSave, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nature: '' as AccountNature,
    level: 4,
    description: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        nature: account.nature,
        level: account.level,
        description: account.description || '',
        isActive: account.isActive,
        createdAt: account.createdAt,
        updatedAt: new Date().toISOString()
      });
    }
  }, [account]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório';
    } else if (!/^\d{4,6}$/.test(formData.code)) {
      newErrors.code = 'Código deve ter entre 4 e 6 dígitos';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.nature) {
      newErrors.nature = 'Natureza é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const accountData = {
      ...formData,
      description: formData.description || undefined
    };

    if (account) {
      onSave({ ...accountData, id: account.id });
    } else {
      onSave(accountData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCode = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6);
  };

  const getCodePrefix = (nature: AccountNature) => {
    switch (nature) {
      case 'revenue': return '1';
      case 'cost': return '2';
      case 'expense': return '3';
      case 'other_revenue': return '4';
      case 'other_expense': return '4';
      default: return '';
    }
  };

  const handleNatureChange = (nature: AccountNature) => {
    const prefix = getCodePrefix(nature);
    const currentCode = formData.code;
    
    // Se o código está vazio ou não começa com o prefixo correto, atualiza
    if (!currentCode || !currentCode.startsWith(prefix)) {
      const newCode = prefix + (currentCode.slice(1) || '000');
      setFormData(prev => ({ ...prev, nature, code: newCode }));
    } else {
      setFormData(prev => ({ ...prev, nature }));
    }
    
    if (errors.nature) {
      setErrors(prev => ({ ...prev, nature: '' }));
    }
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
          {account ? 'Editar Conta' : 'Nova Conta'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nature" className="text-sm font-medium">
                Natureza *
              </Label>
              <Select value={formData.nature} onValueChange={handleNatureChange}>
                <SelectTrigger className={`glass-input ${errors.nature ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Selecione a natureza" />
                </SelectTrigger>
                <SelectContent className="glass-card border-tech-200">
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nature && (
                <p className="text-sm text-red-500">{errors.nature}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Código *
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', formatCode(e.target.value))}
                placeholder="Ex: 1000"
                className={`glass-input ${errors.code ? 'border-red-500' : ''}`}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Receitas: 1xxx, Custos: 2xxx, Despesas: 3xxx, Outros: 4xxx
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Receita Bruta de Vendas"
                className={`glass-input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrição opcional da conta"
                className="glass-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="glass-button"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              className="glass-button bg-gradient-to-r from-tech-600 to-tech-500 hover:from-tech-700 hover:to-tech-600 text-white shadow-neon"
            >
              <Save className="w-4 h-4 mr-2" />
              {account ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}