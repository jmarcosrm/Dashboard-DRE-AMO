import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Entity } from '@/types';
import { Save, X } from 'lucide-react';

interface EntityFormProps {
  entity?: Entity;
  onSave: (entity: Omit<Entity, 'id'> | Entity) => void;
  onCancel: () => void;
}

export function EntityForm({ entity, onSave, onCancel }: EntityFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    cnpj: '',
    isActive: true,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString()
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entity) {
      setFormData({
        code: entity.code,
        name: entity.name,
        cnpj: entity.cnpj,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: new Date().toISOString()
      });
    }
  }, [entity]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX';
    }

    if (!formData.createdAt) {
      newErrors.createdAt = 'Data de criação é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const entityData = {
      ...formData,
      createdAt: new Date(formData.createdAt).toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (entity) {
      onSave({ ...entityData, id: entity.id });
    } else {
      onSave(entityData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-tech-600 to-tech-400 bg-clip-text text-transparent">
          {entity ? 'Editar Entidade' : 'Nova Entidade'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Código *
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ex: MILK001"
                className={`glass-input ${errors.code ? 'border-red-500' : ''}`}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Milk Moo Ltda"
                className={`glass-input ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-sm font-medium">
                CNPJ *
              </Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                placeholder="XX.XXX.XXX/XXXX-XX"
                className={`glass-input ${errors.cnpj ? 'border-red-500' : ''}`}
              />
              {errors.cnpj && (
                <p className="text-sm text-red-500">{errors.cnpj}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="createdAt" className="text-sm font-medium">
                Data de Criação *
              </Label>
              <Input
                id="createdAt"
                type="date"
                value={formData.createdAt}
                onChange={(e) => handleChange('createdAt', e.target.value)}
                className={`glass-input ${errors.createdAt ? 'border-red-500' : ''}`}
              />
              {errors.createdAt && (
                <p className="text-sm text-red-500">{errors.createdAt}</p>
              )}
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
              {entity ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}