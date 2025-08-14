import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  TestTube, 
  Save, 
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';

// Interfaces
interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transformation?: string;
  isRequired: boolean;
  confidence: number;
}

interface MappingConfig {
  id?: string;
  name: string;
  description?: string;
  file_pattern: string;
  column_mappings: ColumnMapping[];
  validation_rules: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  mappings: ColumnMapping[];
}

const FINANCIAL_FIELDS = [
  { key: 'ENTITY', label: 'Entidade', required: true },
  { key: 'ACCOUNT', label: 'Conta', required: true },
  { key: 'SCENARIO', label: 'Cenário', required: true },
  { key: 'PERIOD', label: 'Período', required: true },
  { key: 'VALUE', label: 'Valor', required: true },
  { key: 'CURRENCY', label: 'Moeda', required: false },
  { key: 'DESCRIPTION', label: 'Descrição', required: false },
  { key: 'CATEGORY', label: 'Categoria', required: false }
];

const TRANSFORMATION_OPTIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'uppercase', label: 'Maiúscula' },
  { value: 'lowercase', label: 'Minúscula' },
  { value: 'trim', label: 'Remover espaços' },
  { value: 'number', label: 'Converter para número' },
  { value: 'date', label: 'Converter para data' },
  { value: 'currency', label: 'Formatar moeda' }
];

const DataMappings: React.FC = () => {
  const [mappings, setMappings] = useState<MappingConfig[]>([]);
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<MappingConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  
  // Estado do formulário
  const [formData, setFormData] = useState<MappingConfig>({
    name: '',
    description: '',
    file_pattern: '',
    column_mappings: [],
    validation_rules: {},
    is_active: true
  });

  useEffect(() => {
    loadMappings();
    loadTemplates();
  }, []);

  const loadMappings = async () => {
    try {
      const response = await fetch('/api/data-mappings');
      if (response.ok) {
        const data = await response.json();
        setMappings(data);
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
      toast.error('Erro ao carregar mapeamentos');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/data-mappings/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveMapping = async () => {
    setLoading(true);
    try {
      const url = formData.id ? `/api/data-mappings/${formData.id}` : '/api/data-mappings';
      const method = formData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Mapeamento salvo com sucesso!');
        setIsEditing(false);
        setFormData({
          name: '',
          description: '',
          file_pattern: '',
          column_mappings: [],
          validation_rules: {},
          is_active: true
        });
        loadMappings();
      } else {
        throw new Error('Falha ao salvar mapeamento');
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast.error('Erro ao salvar mapeamento');
    } finally {
      setLoading(false);
    }
  };

  const deleteMapping = async (id: string) => {
    try {
      const response = await fetch(`/api/data-mappings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Mapeamento excluído com sucesso!');
        loadMappings();
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Erro ao excluir mapeamento');
    }
  };

  const testMapping = async (mapping: MappingConfig) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/data-mappings/${mapping.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sample_data: [
            // Dados de exemplo para teste
            { 'Empresa': 'ABC Corp', 'Conta': '1001', 'Cenario': 'Real', 'Periodo': '2024-01', 'Valor': '1000.50' },
            { 'Empresa': 'XYZ Ltd', 'Conta': '2001', 'Cenario': 'Budget', 'Periodo': '2024-02', 'Valor': '2500.75' }
          ]
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(result);
        toast.success('Teste realizado com sucesso!');
      }
    } catch (error) {
      console.error('Error testing mapping:', error);
      toast.error('Erro ao testar mapeamento');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: MappingTemplate) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      column_mappings: template.mappings
    }));
    setIsEditing(true);
    toast.success('Template aplicado!');
  };

  const addColumnMapping = () => {
    setFormData(prev => ({
      ...prev,
      column_mappings: [
        ...prev.column_mappings,
        {
          sourceColumn: '',
          targetField: '',
          transformation: 'none',
          isRequired: false,
          confidence: 0
        }
      ]
    }));
  };

  const updateColumnMapping = (index: number, field: keyof ColumnMapping, value: any) => {
    setFormData(prev => ({
      ...prev,
      column_mappings: prev.column_mappings.map((mapping, i) => 
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  const removeColumnMapping = (index: number) => {
    setFormData(prev => ({
      ...prev,
      column_mappings: prev.column_mappings.filter((_, i) => i !== index)
    }));
  };

  const editMapping = (mapping: MappingConfig) => {
    setFormData(mapping);
    setIsEditing(true);
  };

  const duplicateMapping = (mapping: MappingConfig) => {
    setFormData({
      ...mapping,
      id: undefined,
      name: `${mapping.name} (Cópia)`,
      created_at: undefined,
      updated_at: undefined
    });
    setIsEditing(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapeamento de Dados</h1>
          <p className="text-muted-foreground">
            Configure como os dados das planilhas devem ser mapeados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadMappings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Mapeamento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mappings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mappings">Mapeamentos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Mappings Tab */}
        <TabsContent value="mappings">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mappings.map((mapping) => (
              <Card key={mapping.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{mapping.name}</CardTitle>
                    <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                      {mapping.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <CardDescription>{mapping.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Padrão de Arquivo:</span>
                      <p className="text-sm text-muted-foreground">{mapping.file_pattern}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Mapeamentos:</span>
                      <p className="text-sm text-muted-foreground">
                        {mapping.column_mappings.length} colunas mapeadas
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {mapping.column_mappings.slice(0, 3).map((col, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {col.sourceColumn} → {col.targetField}
                        </Badge>
                      ))}
                      {mapping.column_mappings.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{mapping.column_mappings.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => editMapping(mapping)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateMapping(mapping)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => testMapping(mapping)}>
                      <TestTube className="h-3 w-3 mr-1" />
                      Testar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => mapping.id && deleteMapping(mapping.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {mappings.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum mapeamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro mapeamento para começar a processar planilhas
                </p>
                <Button onClick={() => setIsEditing(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Mapeamento
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge variant="outline">{template.category}</Badge>
                    <div>
                      <span className="text-sm font-medium">Campos Mapeados:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.mappings.slice(0, 4).map((mapping, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {mapping.targetField}
                          </Badge>
                        ))}
                        {template.mappings.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.mappings.length - 4} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => applyTemplate(template)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Usar Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para edição/criação */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formData.id ? 'Editar Mapeamento' : 'Novo Mapeamento'}
            </DialogTitle>
            <DialogDescription>
              Configure como as colunas da planilha devem ser mapeadas para os campos do sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do mapeamento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filePattern">Padrão de Arquivo</Label>
                <Input
                  id="filePattern"
                  value={formData.file_pattern}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_pattern: e.target.value }))}
                  placeholder="*.xlsx, *relatorio*.csv"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do mapeamento"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="isActive">Ativo</Label>
            </div>

            {/* Mapeamentos de colunas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Mapeamento de Colunas</h3>
                <Button onClick={addColumnMapping} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Coluna
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.column_mappings.map((mapping, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                    <div className="col-span-3">
                      <Input
                        placeholder="Coluna origem"
                        value={mapping.sourceColumn}
                        onChange={(e) => updateColumnMapping(index, 'sourceColumn', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={mapping.targetField}
                        onValueChange={(value) => updateColumnMapping(index, 'targetField', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Campo destino" />
                        </SelectTrigger>
                        <SelectContent>
                          {FINANCIAL_FIELDS.map((field) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label} {field.required && '*'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={mapping.transformation || 'none'}
                        onValueChange={(value) => updateColumnMapping(index, 'transformation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSFORMATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Switch
                        checked={mapping.isRequired}
                        onCheckedChange={(checked) => updateColumnMapping(index, 'isRequired', checked)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeColumnMapping(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {formData.column_mappings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhum mapeamento de coluna configurado</p>
                    <Button onClick={addColumnMapping} size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Coluna
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={saveMapping} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para resultados de teste */}
      <Dialog open={!!testResults} onOpenChange={() => setTestResults(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resultados do Teste</DialogTitle>
            <DialogDescription>
              Resultado do teste de mapeamento com dados de exemplo
            </DialogDescription>
          </DialogHeader>
          
          {testResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {testResults.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {testResults.success ? 'Teste bem-sucedido!' : 'Teste falhou'}
                </span>
              </div>
              
              {testResults.mappedData && (
                <div>
                  <h4 className="font-medium mb-2">Dados Mapeados:</h4>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(testResults.mappedData, null, 2)}
                  </pre>
                </div>
              )}
              
              {testResults.errors && testResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Erros:</h4>
                  <ul className="space-y-1">
                    {testResults.errors.map((error: string, idx: number) => (
                      <li key={idx} className="text-sm text-red-600">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setTestResults(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataMappings;