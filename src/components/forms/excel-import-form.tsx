import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  processExcelFile, 
  convertToFinancialFacts, 
  validateImportedData,
  type ProcessedDREData,
  type ImportedFinancialFact 
} from '../../utils/excel-importer';
import { validateDREData, ValidationResult } from '../../utils/data-validator';
import { db } from '../../lib/supabase';
import ValidationAlert from '../ui/validation-alert';
import { useDataStore } from '../../store/data-store';

interface ExcelImportFormProps {
  onClose?: () => void;
  onImportComplete?: (importedCount: number) => void;
}

interface ImportProgress {
  stage: 'idle' | 'processing' | 'validating' | 'importing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export function ExcelImportForm({ onClose, onImportComplete }: ExcelImportFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedDREData[]>([]);
  const [importedFacts, setImportedFacts] = useState<ImportedFinancialFact[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  
  const { } = useDataStore();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const excelFiles = files.filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    if (excelFiles.length !== files.length) {
      alert('Apenas arquivos Excel (.xlsx, .xls) são aceitos');
    }
    
    setSelectedFiles(excelFiles);
    setProcessedData([]);
    setImportedFacts([]);
    setValidationResult(null);
    setImportProgress({ stage: 'idle', progress: 0, message: '' });
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const excelFiles = files.filter(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    );
    
    setSelectedFiles(excelFiles);
    setProcessedData([]);
    setImportedFacts([]);
    setValidationResult(null);
    setImportProgress({ stage: 'idle', progress: 0, message: '' });
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;

    setImportProgress({
      stage: 'processing',
      progress: 10,
      message: 'Processando arquivos Excel...'
    });

    try {
      const allProcessedData: ProcessedDREData[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setImportProgress({
          stage: 'processing',
          progress: 10 + (i / selectedFiles.length) * 40,
          message: `Processando ${file.name}...`
        });
        
        const fileData = await processExcelFile(file);
        allProcessedData.push(...fileData);
      }
      
      setProcessedData(allProcessedData);
      
      setImportProgress({
        stage: 'validating',
        progress: 60,
        message: 'Validando dados...'
      });
      
      // Validar dados processados
       const { data: accountsData } = await db.accounts.getAll();
       const { data: entitiesData } = await db.entities.getAll();
       
       // Mapear dados do Supabase para tipos esperados
       const accounts = (accountsData || []).map(acc => ({
         ...acc,
         isActive: acc.is_active,
         createdAt: acc.created_at,
         updatedAt: acc.updated_at
       }));
       
       const entities = (entitiesData || []).map(ent => ({
         ...ent,
         isActive: ent.is_active,
         createdAt: ent.created_at,
         updatedAt: ent.updated_at
       }));
       
       const validation = validateDREData(allProcessedData, accounts, entities);
      setValidationResult(validation);
      setShowValidation(true);
      
      // Se houver erros críticos, parar o processamento
      if (!validation.isValid) {
        setImportProgress({ 
          stage: 'error', 
          progress: 0, 
          message: `Validação falhou: ${validation.errors.length} erro(s) encontrado(s)` 
        });
        return;
      }
      
      setImportProgress({
        stage: 'validating',
        progress: 80,
        message: 'Convertendo dados...'
      });
      
      const facts = convertToFinancialFacts(allProcessedData);
      setImportedFacts(facts);
      
      setImportProgress({
        stage: 'complete',
        progress: 100,
        message: `${facts.length} registros processados com sucesso`
      });
      
    } catch (error) {
      console.error('Erro ao processar arquivos:', error);
      setImportProgress({
        stage: 'error',
        progress: 0,
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  };

  const importToDatabase = async () => {
    if (importedFacts.length === 0) return;

    setImportProgress({
      stage: 'importing',
      progress: 0,
      message: 'Importando dados para o banco...'
    });

    try {
      let importedCount = 0;
      const batchSize = 50;
      
      // Primeiro, criar/atualizar entidades
      const uniqueEntities = [...new Set(importedFacts.map(f => f.entityName))];
      
      for (const entityName of uniqueEntities) {
        const entityCode = entityName.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
        
        try {
          await db.entities.create({
            name: entityName,
            code: entityCode,
            cnpj: `00.000.000/0001-${Math.floor(Math.random() * 99).toString().padStart(2, '0')}`,
            address: 'Endereço importado via Excel',
            is_active: true
          });
        } catch (error) {
          // Entidade já existe, continua
        }
      }
      
      // Criar/atualizar contas
      const uniqueAccounts = importedFacts.reduce((acc, fact) => {
        const key = `${fact.accountCode}-${fact.accountName}`;
        if (!acc.has(key)) {
          acc.set(key, {
            code: fact.accountCode,
            name: fact.accountName,
            nature: fact.accountNature,
            level: 4,
            description: fact.description || fact.accountName,
            is_active: true
          });
        }
        return acc;
      }, new Map());
      
      for (const account of uniqueAccounts.values()) {
        try {
          await db.accounts.create(account);
        } catch (error) {
          // Conta já existe, continua
        }
      }
      
      // Buscar IDs das entidades e contas
      const { data: entities } = await db.entities.getAll();
      const { data: accounts } = await db.accounts.getAll();
      
      const entityMap = new Map(entities?.map(e => [e.name, e.id]) || []);
      const accountMap = new Map(accounts?.map(a => [a.code, a.id]) || []);
      
      // Importar fatos financeiros em lotes
      for (let i = 0; i < importedFacts.length; i += batchSize) {
        const batch = importedFacts.slice(i, i + batchSize);
        
        const factsToInsert = batch.map(fact => ({
          entity_id: entityMap.get(fact.entityName),
          account_id: accountMap.get(fact.accountCode),
          scenario_id: fact.scenario,
          year: fact.year,
          month: fact.month,
          value: fact.value,
          description: fact.description
        })).filter(fact => fact.entity_id && fact.account_id);
        
        if (factsToInsert.length > 0) {
          try {
            // Usar upsert para evitar duplicatas
            for (const fact of factsToInsert) {
              try {
                await db.financialFacts.create(fact);
                importedCount++;
              } catch (error) {
                // Registro já existe, continua
              }
            }
          } catch (error) {
            console.error('Erro ao inserir lote:', error);
          }
        }
        
        setImportProgress({
          stage: 'importing',
          progress: (i / importedFacts.length) * 100,
          message: `Importando... ${importedCount} de ${importedFacts.length} registros`
        });
      }
      
      // Dados importados com sucesso
      
      setImportProgress({
        stage: 'complete',
        progress: 100,
        message: `Importação concluída! ${importedCount} registros importados.`
      });
      
      onImportComplete?.(importedCount);
      
    } catch (error) {
      console.error('Erro na importação:', error);
      setImportProgress({
        stage: 'error',
        progress: 0,
        message: `Erro na importação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setProcessedData([]);
      setImportedFacts([]);
      setValidationResult(null);
      setImportProgress({ stage: 'idle', progress: 0, message: '' });
    }
  };

  const getStageColor = (stage: ImportProgress['stage']) => {
    switch (stage) {
      case 'complete': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'processing':
      case 'validating':
      case 'importing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Planilhas DRE
            </CardTitle>
            <CardDescription>
              Importe arquivos Excel (.xlsx, .xls) contendo dados de DRE das empresas
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resultado da Validação */}
        {showValidation && validationResult && (
          <ValidationAlert 
            result={validationResult}
            onClose={() => setShowValidation(false)}
            className="mb-4"
          />
        )}
        
        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Arraste arquivos Excel aqui ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Suporte para arquivos .xlsx e .xls
          </p>
          <input
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-upload"
          />
          <label htmlFor="excel-upload">
            <Button variant="outline" className="cursor-pointer">
              Selecionar Arquivos
            </Button>
          </label>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Arquivos Selecionados:</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        {selectedFiles.length > 0 && importProgress.stage === 'idle' && (
          <Button onClick={processFiles} className="w-full">
            Processar Arquivos
          </Button>
        )}

        {/* Progress */}
        {importProgress.stage !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${getStageColor(importProgress.stage)}`}>
                {importProgress.message}
              </span>
              <span className="text-sm text-gray-500">
                {importProgress.progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={importProgress.progress} className="w-full" />
          </div>
        )}

        {/* Success Message */}
        {validationResult?.isValid && importedFacts.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dados validados com sucesso!</strong>
              <br />
              {importedFacts.length} registros prontos para importação.
            </AlertDescription>
          </Alert>
        )}

        {/* Import Summary */}
        {processedData.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Resumo da Importação:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Arquivos:</span>
                <br />
                {selectedFiles.length}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Entidades:</span>
                <br />
                {processedData.length}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Registros:</span>
                <br />
                {importedFacts.length}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Período:</span>
                <br />
                {processedData.length > 0 ? processedData[0].year : '-'}
              </div>
            </div>
          </div>
        )}

        {/* Import Button */}
        {validationResult?.isValid && importProgress.stage === 'complete' && (
          <Button onClick={importToDatabase} className="w-full" size="lg">
            Importar para o Banco de Dados
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ExcelImportForm;