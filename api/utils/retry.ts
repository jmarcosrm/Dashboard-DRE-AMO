/**
 * Sistema de retry robusto para operações que podem falhar
 */

// Interface para configuração de retry
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // em millisegundos
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onSuccess?: (attempt: number) => void;
  onFailure?: (error: any, attempts: number) => void;
}

// Configuração padrão de retry
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 30000, // 30 segundos
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error) => {
    // Retry em erros de rede, timeout, rate limit, etc.
    if (error?.code) {
      const retryableCodes = [
        'ECONNRESET',
        'ECONNREFUSED', 
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
        'EPIPE',
        'RATE_LIMIT_EXCEEDED',
        'QUOTA_EXCEEDED',
        'SERVICE_UNAVAILABLE'
      ];
      return retryableCodes.includes(error.code);
    }
    
    // Retry em erros HTTP específicos
    if (error?.status || error?.statusCode) {
      const status = error.status || error.statusCode;
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(status);
    }
    
    // Retry em erros de timeout
    if (error?.message) {
      const message = error.message.toLowerCase();
      return message.includes('timeout') || 
             message.includes('network') ||
             message.includes('connection') ||
             message.includes('rate limit');
    }
    
    return false;
  }
};

/**
 * Executa uma função com retry automático
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;
  
  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // Sucesso
      if (retryConfig.onSuccess) {
        retryConfig.onSuccess(attempt);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Verificar se deve fazer retry
      const shouldRetry = attempt < retryConfig.maxAttempts && 
                         (retryConfig.retryCondition ? retryConfig.retryCondition(error) : true);
      
      if (!shouldRetry) {
        break;
      }
      
      // Callback de retry
      if (retryConfig.onRetry) {
        retryConfig.onRetry(attempt, error);
      }
      
      // Calcular delay para próxima tentativa
      const delay = calculateDelay(attempt, retryConfig);
      
      console.log(`Retry attempt ${attempt}/${retryConfig.maxAttempts} after ${delay}ms. Error:`, error.message);
      
      // Aguardar antes da próxima tentativa
      await sleep(delay);
    }
  }
  
  // Todas as tentativas falharam
  if (retryConfig.onFailure) {
    retryConfig.onFailure(lastError, retryConfig.maxAttempts);
  }
  
  throw new Error(`Operation failed after ${retryConfig.maxAttempts} attempts. Last error: ${lastError?.message || lastError}`);
}

/**
 * Calcula o delay para a próxima tentativa usando backoff exponencial
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Backoff exponencial
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  
  // Aplicar limite máximo
  delay = Math.min(delay, config.maxDelay);
  
  // Adicionar jitter para evitar thundering herd
  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.floor(delay);
}

/**
 * Função auxiliar para aguardar
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry específico para operações de Google Drive
 */
export async function withGoogleDriveRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Google Drive operation'
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => {
      // Condições específicas para Google Drive API
      if (error?.code) {
        const retryableCodes = [
          'RATE_LIMIT_EXCEEDED',
          'QUOTA_EXCEEDED',
          'BACKEND_ERROR',
          'INTERNAL_ERROR',
          'SERVICE_UNAVAILABLE'
        ];
        return retryableCodes.includes(error.code);
      }
      
      if (error?.status) {
        // 403 pode ser rate limit, 429 é rate limit, 5xx são erros de servidor
        return [403, 429, 500, 502, 503, 504].includes(error.status);
      }
      
      return false;
    },
    onRetry: (attempt, error) => {
      console.log(`${operationName} - Retry ${attempt}: ${error.message}`);
    },
    onFailure: (error, attempts) => {
      console.error(`${operationName} failed after ${attempts} attempts:`, error);
    }
  });
}

/**
 * Retry específico para operações de banco de dados
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation'
): Promise<T> {
  return withRetry(operation, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => {
      // Condições específicas para banco de dados
      if (error?.code) {
        const retryableCodes = [
          'PGRST301', // Connection timeout
          'PGRST302', // Connection failed
          'PGRST504', // Gateway timeout
          '08000',    // Connection exception
          '08003',    // Connection does not exist
          '08006',    // Connection failure
          '53300',    // Too many connections
          '57P01'     // Admin shutdown
        ];
        return retryableCodes.includes(error.code);
      }
      
      if (error?.message) {
        const message = error.message.toLowerCase();
        return message.includes('connection') ||
               message.includes('timeout') ||
               message.includes('network') ||
               message.includes('unavailable');
      }
      
      return false;
    },
    onRetry: (attempt, error) => {
      console.log(`${operationName} - Retry ${attempt}: ${error.message}`);
    },
    onFailure: (error, attempts) => {
      console.error(`${operationName} failed after ${attempts} attempts:`, error);
    }
  });
}

/**
 * Retry com circuit breaker para evitar sobrecarga
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minuto
    private successThreshold: number = 2
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      } else {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker moving to HALF_OPEN state');
      }
    }
    
    try {
      const result = await operation();
      
      // Sucesso
      if (this.state === 'HALF_OPEN') {
        this.failures = Math.max(0, this.failures - 1);
        if (this.failures === 0) {
          this.state = 'CLOSED';
          console.log('Circuit breaker moving to CLOSED state');
        }
      } else {
        this.failures = 0;
      }
      
      return result;
      
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        console.log(`Circuit breaker moving to OPEN state after ${this.failures} failures`);
      }
      
      throw error;
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  getFailures(): number {
    return this.failures;
  }
  
  reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
    console.log('Circuit breaker reset to CLOSED state');
  }
}

/**
 * Instância global do circuit breaker para Google Drive
 */
export const googleDriveCircuitBreaker = new CircuitBreaker(3, 30000, 1);

/**
 * Instância global do circuit breaker para banco de dados
 */
export const databaseCircuitBreaker = new CircuitBreaker(5, 60000, 2);

/**
 * Retry com circuit breaker para Google Drive
 */
export async function withGoogleDriveCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName: string = 'Google Drive operation'
): Promise<T> {
  return googleDriveCircuitBreaker.execute(async () => {
    return withGoogleDriveRetry(operation, operationName);
  });
}

/**
 * Retry com circuit breaker para banco de dados
 */
export async function withDatabaseCircuitBreaker<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation'
): Promise<T> {
  return databaseCircuitBreaker.execute(async () => {
    return withDatabaseRetry(operation, operationName);
  });
}

/**
 * Executa operações em lote com retry e controle de concorrência
 */
export async function executeBatchWithRetry<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    retryConfig?: Partial<RetryConfig>;
    onProgress?: (completed: number, total: number, errors: number) => void;
  } = {}
): Promise<{
  results: R[];
  errors: { item: T; error: any }[];
  summary: { total: number; successful: number; failed: number };
}> {
  const {
    batchSize = 10,
    concurrency = 3,
    retryConfig = {},
    onProgress
  } = options;
  
  const results: R[] = [];
  const errors: { item: T; error: any }[] = [];
  let completed = 0;
  
  // Processar em lotes
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Processar lote com concorrência limitada
    const batchPromises = batch.map(async (item) => {
      try {
        const result = await withRetry(() => operation(item), retryConfig);
        results.push(result);
        completed++;
        
        if (onProgress) {
          onProgress(completed, items.length, errors.length);
        }
        
      } catch (error) {
        errors.push({ item, error });
        completed++;
        
        if (onProgress) {
          onProgress(completed, items.length, errors.length);
        }
      }
    });
    
    // Aguardar conclusão do lote com concorrência limitada
    await Promise.all(batchPromises.slice(0, concurrency));
    
    // Pequena pausa entre lotes para evitar sobrecarga
    if (i + batchSize < items.length) {
      await sleep(100);
    }
  }
  
  return {
    results,
    errors,
    summary: {
      total: items.length,
      successful: results.length,
      failed: errors.length
    }
  };
}

/**
 * Monitora e reporta status de operações com retry
 */
export class RetryMonitor {
  private operations: Map<string, {
    attempts: number;
    startTime: number;
    lastAttemptTime: number;
    errors: any[];
    status: 'running' | 'success' | 'failed';
  }> = new Map();
  
  startOperation(operationId: string): void {
    this.operations.set(operationId, {
      attempts: 0,
      startTime: Date.now(),
      lastAttemptTime: Date.now(),
      errors: [],
      status: 'running'
    });
  }
  
  recordAttempt(operationId: string, error?: any): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.attempts++;
      operation.lastAttemptTime = Date.now();
      if (error) {
        operation.errors.push(error);
      }
    }
  }
  
  completeOperation(operationId: string, success: boolean): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = success ? 'success' : 'failed';
    }
  }
  
  getOperationStatus(operationId: string) {
    return this.operations.get(operationId);
  }
  
  getAllOperations() {
    return Array.from(this.operations.entries()).map(([id, operation]) => ({
      id,
      ...operation,
      duration: Date.now() - operation.startTime
    }));
  }
  
  cleanup(maxAge: number = 3600000): void { // 1 hora
    const cutoff = Date.now() - maxAge;
    for (const [id, operation] of this.operations.entries()) {
      if (operation.lastAttemptTime < cutoff) {
        this.operations.delete(id);
      }
    }
  }
}

/**
 * Instância global do monitor de retry
 */
export const retryMonitor = new RetryMonitor();