import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { ValidationResult, ValidationError } from '../../utils/data-validator';

interface ValidationAlertProps {
  result: ValidationResult;
  onClose?: () => void;
  className?: string;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({ 
  result, 
  onClose, 
  className = '' 
}) => {
  const getAlertStyle = () => {
    if (result.errors.length > 0) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (result.warnings.length > 0) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    return 'bg-green-50 border-green-200 text-green-800';
  };

  const getIcon = () => {
    if (result.errors.length > 0) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    if (result.warnings.length > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getTitle = () => {
    if (result.errors.length > 0) {
      return 'Erros de Validação Encontrados';
    }
    if (result.warnings.length > 0) {
      return 'Avisos de Validação';
    }
    return 'Validação Concluída com Sucesso';
  };

  return (
    <div className={`rounded-lg border p-4 ${getAlertStyle()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{getTitle()}</h3>
            
            {/* Resumo */}
            <div className="mt-2 text-sm">
              <p>
                {result.summary.entitiesValidated} entidades e {result.summary.periodsValidated} períodos validados
              </p>
              {result.errors.length > 0 && (
                <p className="text-red-600 font-medium">
                  {result.errors.length} erro(s) encontrado(s)
                </p>
              )}
              {result.warnings.length > 0 && (
                <p className="text-yellow-600 font-medium">
                  {result.warnings.length} aviso(s) encontrado(s)
                </p>
              )}
            </div>

            {/* Lista de Erros */}
            {result.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-sm text-red-700 mb-2">Erros:</h4>
                <ul className="space-y-1 text-sm">
                  {result.errors.slice(0, 5).map((error, index) => (
                    <ErrorItem key={index} error={error} />
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-red-600 font-medium">
                      ... e mais {result.errors.length - 5} erro(s)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Lista de Avisos */}
            {result.warnings.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-sm text-yellow-700 mb-2">Avisos:</h4>
                <ul className="space-y-1 text-sm">
                  {result.warnings.slice(0, 3).map((warning, index) => (
                    <ErrorItem key={index} error={warning} />
                  ))}
                  {result.warnings.length > 3 && (
                    <li className="text-yellow-600 font-medium">
                      ... e mais {result.warnings.length - 3} aviso(s)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Mensagem de Sucesso */}
            {result.isValid && result.warnings.length === 0 && (
              <p className="mt-2 text-sm text-green-700">
                Todos os dados estão consistentes e prontos para uso!
              </p>
            )}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface ErrorItemProps {
  error: ValidationError;
}

const ErrorItem: React.FC<ErrorItemProps> = ({ error }) => {
  const getErrorIcon = () => {
    switch (error.severity) {
      case 'error':
        return <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />;
      case 'info':
        return <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getErrorColor = () => {
    switch (error.severity) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <li className="flex items-start space-x-2">
      {getErrorIcon()}
      <div className={`flex-1 ${getErrorColor()}`}>
        <span>{error.message}</span>
        {error.entityName && (
          <span className="block text-xs opacity-75">
            Entidade: {error.entityName}
          </span>
        )}
        {error.period && (
          <span className="block text-xs opacity-75">
            Período: {error.period}
          </span>
        )}
        {error.expectedValue !== undefined && error.actualValue !== undefined && (
          <span className="block text-xs opacity-75">
            Esperado: {error.expectedValue.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })} | Encontrado: {error.actualValue.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
          </span>
        )}
      </div>
    </li>
  );
};

export default ValidationAlert;