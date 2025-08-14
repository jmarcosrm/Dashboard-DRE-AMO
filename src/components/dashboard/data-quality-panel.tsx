import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Database, 
  RefreshCw,
  Eye,
  EyeOff,
  BarChart3
} from 'lucide-react';
import { useDataValidation, useDataQualityStats, useCriticalAlerts } from '../../hooks/use-data-validation';
import ValidationAlert from '../ui/validation-alert';

interface DataQualityPanelProps {
  className?: string;
}

const DataQualityPanel: React.FC<DataQualityPanelProps> = ({ className = '' }) => {
  const { validationState, refreshValidation, dismissAllWarnings } = useDataValidation();
  const { criticalAlerts, hasCriticalIssues, alertCount } = useCriticalAlerts();
  const qualityStats = useDataQualityStats();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBgColor = (score: number) => {
    if (score >= 95) return 'bg-green-50 border-green-200';
    if (score >= 85) return 'bg-blue-50 border-blue-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getQualityIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Qualidade dos Dados</h3>
              <p className="text-sm text-gray-500">
                {qualityStats.totalRecords} registros • {qualityStats.totalEntities} entidades
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasCriticalIssues && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>{alertCount}</span>
              </div>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            
            <button
              onClick={refreshValidation}
              disabled={validationState.isValidating}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Atualizar validação"
            >
              <RefreshCw className={`h-4 w-4 ${validationState.isValidating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Quality Score */}
      <div className="p-4">
        <div className={`rounded-lg border p-4 ${getQualityBgColor(qualityStats.qualityScore)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getQualityIcon(qualityStats.qualityScore)}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900">
                    {qualityStats.qualityScore.toFixed(1)}%
                  </span>
                  <span className={`text-sm font-medium ${getQualityColor(qualityStats.qualityScore)}`}>
                    {qualityStats.qualityLevel === 'excellent' && 'Excelente'}
                    {qualityStats.qualityLevel === 'good' && 'Boa'}
                    {qualityStats.qualityLevel === 'fair' && 'Regular'}
                    {qualityStats.qualityLevel === 'poor' && 'Ruim'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Pontuação de qualidade dos dados
                </p>
              </div>
            </div>
            
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Statistics */}
      {showDetails && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Taxa de Erros</div>
              <div className="text-lg font-semibold text-red-600">
                {qualityStats.errorRate.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Taxa de Avisos</div>
              <div className="text-lg font-semibold text-yellow-600">
                {qualityStats.warningRate.toFixed(1)}%
              </div>
            </div>
          </div>
          
          {qualityStats.lastValidated && (
            <div className="text-xs text-gray-500 text-center">
              Última validação: {qualityStats.lastValidated.toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      )}

      {/* Critical Alerts */}
      {hasCriticalIssues && (
        <div className="border-t">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-red-700">Alertas Críticos</h4>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                {isExpanded ? 'Ocultar' : 'Ver todos'}
              </button>
            </div>
            
            <div className="space-y-2">
              {criticalAlerts.slice(0, isExpanded ? undefined : 2).map((alert, index) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <div className="text-red-800 font-medium">{alert.message}</div>
                    {alert.entityName && (
                      <div className="text-red-600 text-xs mt-1">
                        Entidade: {alert.entityName}
                      </div>
                    )}
                    {alert.period && (
                      <div className="text-red-600 text-xs">
                        Período: {alert.period}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {!isExpanded && criticalAlerts.length > 2 && (
                <div className="text-center text-sm text-red-600">
                  ... e mais {criticalAlerts.length - 2} alerta(s)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation Result Details */}
      {showDetails && validationState.lastValidation && (
        <div className="border-t">
          <div className="p-4">
            <ValidationAlert 
              result={validationState.lastValidation}
              className="border-0 bg-transparent p-0"
            />
            
            {validationState.warnings.length > 0 && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={dismissAllWarnings}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Dispensar todos os avisos
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQualityPanel;