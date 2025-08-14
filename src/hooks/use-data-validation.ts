import { useState, useEffect, useCallback } from 'react';
import { useDataStore } from '../store/data-store';
import { validateFinancialFacts, ValidationResult, ValidationError } from '../utils/data-validator';

interface DataValidationState {
  isValidating: boolean;
  lastValidation: ValidationResult | null;
  criticalErrors: ValidationError[];
  warnings: ValidationError[];
  hasUnresolvedIssues: boolean;
}

interface UseDataValidationReturn {
  validationState: DataValidationState;
  validateData: () => Promise<ValidationResult>;
  dismissWarning: (errorId: string) => void;
  dismissAllWarnings: () => void;
  refreshValidation: () => void;
}

/**
 * Hook para gerenciar validação de dados e alertas de inconsistência
 */
export function useDataValidation(): UseDataValidationReturn {
  const { financialFacts, accounts, entities } = useDataStore();
  
  const [validationState, setValidationState] = useState<DataValidationState>({
    isValidating: false,
    lastValidation: null,
    criticalErrors: [],
    warnings: [],
    hasUnresolvedIssues: false
  });
  
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  /**
   * Executa validação dos dados financeiros
   */
  const validateData = useCallback(async (): Promise<ValidationResult> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = validateFinancialFacts(financialFacts, accounts, entities);
      
      // Filtrar avisos já dispensados
      const activeWarnings = result.warnings.filter(warning => {
        const warningId = generateWarningId(warning);
        return !dismissedWarnings.has(warningId);
      });
      
      const updatedResult = {
        ...result,
        warnings: activeWarnings
      };
      
      setValidationState({
        isValidating: false,
        lastValidation: updatedResult,
        criticalErrors: result.errors,
        warnings: activeWarnings,
        hasUnresolvedIssues: result.errors.length > 0 || activeWarnings.length > 0
      });
      
      return updatedResult;
    } catch (error) {
      console.error('Erro durante validação:', error);
      
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          type: 'missing_data',
          message: 'Erro interno durante validação dos dados',
          severity: 'error'
        }],
        warnings: [],
        summary: {
          totalErrors: 1,
          totalWarnings: 0,
          entitiesValidated: 0,
          periodsValidated: 0
        }
      };
      
      setValidationState({
        isValidating: false,
        lastValidation: errorResult,
        criticalErrors: errorResult.errors,
        warnings: [],
        hasUnresolvedIssues: true
      });
      
      return errorResult;
    }
  }, [financialFacts, accounts, entities, dismissedWarnings]);

  /**
   * Dispensa um aviso específico
   */
  const dismissWarning = useCallback((errorId: string) => {
    setDismissedWarnings(prev => new Set([...prev, errorId]));
    
    // Atualizar estado removendo o aviso dispensado
    setValidationState(prev => ({
      ...prev,
      warnings: prev.warnings.filter(warning => generateWarningId(warning) !== errorId),
      hasUnresolvedIssues: prev.criticalErrors.length > 0 || 
        prev.warnings.filter(warning => generateWarningId(warning) !== errorId).length > 0
    }));
  }, []);

  /**
   * Dispensa todos os avisos
   */
  const dismissAllWarnings = useCallback(() => {
    const warningIds = validationState.warnings.map(generateWarningId);
    setDismissedWarnings(prev => new Set([...prev, ...warningIds]));
    
    setValidationState(prev => ({
      ...prev,
      warnings: [],
      hasUnresolvedIssues: prev.criticalErrors.length > 0
    }));
  }, [validationState.warnings]);

  /**
   * Força uma nova validação
   */
  const refreshValidation = useCallback(() => {
    validateData();
  }, [validateData]);

  // Executar validação automática quando os dados mudarem
  useEffect(() => {
    if (financialFacts.length > 0) {
      // Debounce para evitar validações excessivas
      const timeoutId = setTimeout(() => {
        validateData();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [financialFacts, accounts, entities, validateData]);

  return {
    validationState,
    validateData,
    dismissWarning,
    dismissAllWarnings,
    refreshValidation
  };
}

/**
 * Gera um ID único para um erro/aviso baseado em suas propriedades
 */
function generateWarningId(error: ValidationError): string {
  const parts = [
    error.type,
    error.entityName || '',
    error.accountName || '',
    error.period || '',
    error.message.substring(0, 50)
  ];
  
  return parts.join('|');
}

/**
 * Hook para monitorar alertas críticos que requerem atenção imediata
 */
export function useCriticalAlerts() {
  const { validationState } = useDataValidation();
  
  const criticalAlerts = validationState.criticalErrors.filter(error => 
    error.severity === 'error' && (
      error.type === 'inconsistent_sum' ||
      error.type === 'missing_data' ||
      error.type === 'duplicate_account'
    )
  );
  
  const hasCriticalIssues = criticalAlerts.length > 0;
  
  return {
    criticalAlerts,
    hasCriticalIssues,
    alertCount: criticalAlerts.length
  };
}

/**
 * Hook para estatísticas de qualidade dos dados
 */
export function useDataQualityStats() {
  const { validationState } = useDataValidation();
  const { financialFacts, accounts, entities } = useDataStore();
  
  const stats = {
    totalRecords: financialFacts.length,
    totalAccounts: accounts.length,
    totalEntities: entities.length,
    errorRate: validationState.lastValidation ? 
      (validationState.lastValidation.errors.length / Math.max(financialFacts.length, 1)) * 100 : 0,
    warningRate: validationState.lastValidation ? 
      (validationState.lastValidation.warnings.length / Math.max(financialFacts.length, 1)) * 100 : 0,
    qualityScore: 100 - (validationState.lastValidation ? 
      ((validationState.lastValidation.errors.length * 2 + validationState.lastValidation.warnings.length) / 
       Math.max(financialFacts.length, 1)) * 100 : 0),
    lastValidated: validationState.lastValidation ? new Date() : null
  };
  
  return {
    ...stats,
    qualityLevel: stats.qualityScore >= 95 ? 'excellent' : 
                  stats.qualityScore >= 85 ? 'good' : 
                  stats.qualityScore >= 70 ? 'fair' : 'poor'
  };
}