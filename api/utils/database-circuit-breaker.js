/**
 * Database Circuit Breaker Implementation
 * Provides resilience patterns for database operations
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(operation, operationName = 'Database Operation') {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN for ${operationName}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }
}

// Global circuit breaker instance for database operations
const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
  monitoringPeriod: 10000
});

/**
 * Wrapper function for database operations with circuit breaker
 * @param {Function} operation - The database operation to execute
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise} - Result of the operation
 */
export async function withDatabaseCircuitBreaker(operation, operationName = 'Database Operation') {
  try {
    return await databaseCircuitBreaker.execute(operation, operationName);
  } catch (error) {
    console.error(`Circuit breaker error for ${operationName}:`, error.message);
    throw error;
  }
}

/**
 * Get current circuit breaker state
 * @returns {Object} - Current state information
 */
export function getCircuitBreakerState() {
  return databaseCircuitBreaker.getState();
}

/**
 * Reset circuit breaker to closed state
 */
export function resetCircuitBreaker() {
  databaseCircuitBreaker.state = 'CLOSED';
  databaseCircuitBreaker.failureCount = 0;
  databaseCircuitBreaker.lastFailureTime = null;
  databaseCircuitBreaker.successCount = 0;
}

export default {
  withDatabaseCircuitBreaker,
  getCircuitBreakerState,
  resetCircuitBreaker
};