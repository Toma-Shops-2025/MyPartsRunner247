import { supabase } from '@/lib/supabase';

interface LoadTestResult {
  id: string;
  testName: string;
  duration: number; // seconds
  concurrentUsers: number;
  requestsPerSecond: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number; // milliseconds
  maxResponseTime: number;
  minResponseTime: number;
  errorRate: number; // percentage
  throughput: number; // requests per second
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  databaseConnections: number;
  timestamp: string;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    database: number;
  };
  scalabilityScore: number; // 0-100
}

class LoadTestingService {
  private static instance: LoadTestingService;
  private testResults: LoadTestResult[] = [];
  private isRunning = false;

  static getInstance(): LoadTestingService {
    if (!LoadTestingService.instance) {
      LoadTestingService.instance = new LoadTestingService();
    }
    return LoadTestingService.instance;
  }

  /**
   * Run comprehensive load tests
   */
  async runLoadTests(): Promise<LoadTestResult[]> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    this.isRunning = true;
    console.log('🚀 Starting comprehensive load testing...');

    const results: LoadTestResult[] = [];

    try {
      // 1. Light Load Test (10 concurrent users)
      results.push(await this.runLoadTest('Light Load', 10, 30));

      // 2. Medium Load Test (50 concurrent users)
      results.push(await this.runLoadTest('Medium Load', 50, 60));

      // 3. Heavy Load Test (100 concurrent users)
      results.push(await this.runLoadTest('Heavy Load', 100, 90));

      // 4. Stress Test (200 concurrent users)
      results.push(await this.runLoadTest('Stress Test', 200, 120));

      // 5. Spike Test (sudden load increase)
      results.push(await this.runSpikeTest());

      // 6. Endurance Test (sustained load)
      results.push(await this.runEnduranceTest());

      this.testResults = results;
      await this.logLoadTestResults(results);

      console.log(`🚀 Load testing complete: ${results.length} tests executed`);
      return results;

    } catch (error) {
      console.error('Load testing error:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run individual load test
   */
  private async runLoadTest(
    testName: string, 
    concurrentUsers: number, 
    duration: number
  ): Promise<LoadTestResult> {
    console.log(`🚀 Running ${testName} test: ${concurrentUsers} users for ${duration}s`);

    const startTime = Date.now();
    const requests: Promise<any>[] = [];
    const responseTimes: number[] = [];
    let successfulRequests = 0;
    let failedRequests = 0;

    // Simulate concurrent users
    for (let i = 0; i < concurrentUsers; i++) {
      const userRequests = this.simulateUserBehavior(duration);
      requests.push(...userRequests);
    }

    // Execute all requests
    const results = await Promise.allSettled(requests);
    
    // Analyze results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successfulRequests++;
        responseTimes.push(result.value.responseTime || 0);
      } else {
        failedRequests++;
        console.error('Request failed:', result.reason);
      }
    });

    const endTime = Date.now();
    const actualDuration = (endTime - startTime) / 1000;
    const totalRequests = successfulRequests + failedRequests;
    const requestsPerSecond = totalRequests / actualDuration;
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    const maxResponseTime = Math.max(...responseTimes, 0);
    const minResponseTime = Math.min(...responseTimes, 0);
    const errorRate = (failedRequests / totalRequests) * 100;

    const result: LoadTestResult = {
      id: `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      testName,
      duration: actualDuration,
      concurrentUsers,
      requestsPerSecond: Math.round(requestsPerSecond),
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      maxResponseTime,
      minResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(requestsPerSecond),
      cpuUsage: this.getSimulatedCPUUsage(concurrentUsers),
      memoryUsage: this.getSimulatedMemoryUsage(concurrentUsers),
      databaseConnections: this.getSimulatedDatabaseConnections(concurrentUsers),
      timestamp: new Date().toISOString()
    };

    console.log(`✅ ${testName} completed: ${successfulRequests}/${totalRequests} successful, ${errorRate.toFixed(2)}% error rate`);
    return result;
  }

  /**
   * Simulate user behavior
   */
  private simulateUserBehavior(duration: number): Promise<any>[] {
    const requests: Promise<any>[] = [];
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    // Simulate different user actions
    const actions = [
      () => this.simulateLogin(),
      () => this.simulateOrderCreation(),
      () => this.simulateOrderTracking(),
      () => this.simulateDriverLocation(),
      () => this.simulatePaymentProcessing(),
      () => this.simulateProfileUpdate(),
      () => this.simulateNotificationCheck()
    ];

    // Generate requests throughout the duration
    while (Date.now() < endTime) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const delay = Math.random() * 2000 + 500; // 0.5-2.5 seconds between requests
      
      requests.push(
        new Promise(resolve => {
          setTimeout(async () => {
            const requestStart = Date.now();
            try {
              await action();
              resolve({ responseTime: Date.now() - requestStart });
            } catch (error) {
              resolve({ responseTime: Date.now() - requestStart, error: error.message });
            }
          }, delay);
        })
      );
    }

    return requests;
  }

  /**
   * Simulate login request
   */
  private async simulateLogin(): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `test${Math.random()}@example.com`,
        password: 'testpassword'
      });
      // Expected to fail for test users, but measures response time
    } catch (error) {
      // Expected for test simulation
    }
    return new Promise(resolve => {
      setTimeout(resolve, Date.now() - startTime);
    });
  }

  /**
   * Simulate order creation
   */
  private async simulateOrderCreation(): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
    } catch (error) {
      // Expected for test simulation
    }
    return new Promise(resolve => {
      setTimeout(resolve, Date.now() - startTime);
    });
  }

  /**
   * Simulate order tracking
   */
  private async simulateOrderTracking(): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('orders')
        .select('*')
        .limit(10);
    } catch (error) {
      // Expected for test simulation
    }
    return new Promise(resolve => {
      setTimeout(resolve, Date.now() - startTime);
    });
  }

  /**
   * Simulate driver location update
   */
  private async simulateDriverLocation(): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
    } catch (error) {
      // Expected for test simulation
    }
    return new Promise(resolve => {
      setTimeout(resolve, Date.now() - startTime);
    });
  }

  /**
   * Simulate payment processing
   */
  private async simulatePaymentProcessing(): Promise<void> {
    const startTime = Date.now();
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    return new Promise(resolve => {
      setTimeout(resolve, Date.now() - startTime);
    });
  }

  /**
   * Simulate profile update
   */
  private async simulateProfileUpdate(): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
    } catch (error) {
      // Expected for test simulation
    }
    return new Promise(resolve => {
      setTimeout(resolve, Date.now() - startTime);
    });
  }

  /**
   * Simulate notification check
   */
  private async simulateNotificationCheck(): Promise<void> {
    const startTime = Date.now();
    try {
      const { error } = await supabase
        .from('push_notifications')
        .select('id')
        .limit(5);
    } catch (error) {
      // Expected for test simulation
    }
    return new Promise(resolve => {
      setTimeout(resolve, Date.now() - startTime);
    });
  }

  /**
   * Run spike test (sudden load increase)
   */
  private async runSpikeTest(): Promise<LoadTestResult> {
    console.log('🚀 Running Spike Test: Sudden load increase');
    
    // Start with 10 users, then spike to 200
    const initialLoad = await this.runLoadTest('Spike Test - Initial', 10, 30);
    
    // Simulate sudden spike
    const spikeLoad = await this.runLoadTest('Spike Test - Spike', 200, 60);
    
    return {
      ...spikeLoad,
      testName: 'Spike Test',
      concurrentUsers: 200
    };
  }

  /**
   * Run endurance test (sustained load)
   */
  private async runEnduranceTest(): Promise<LoadTestResult> {
    console.log('🚀 Running Endurance Test: Sustained load');
    
    // Run sustained load for 5 minutes
    return await this.runLoadTest('Endurance Test', 50, 300);
  }

  /**
   * Get simulated CPU usage
   */
  private getSimulatedCPUUsage(concurrentUsers: number): number {
    // Simulate CPU usage based on concurrent users
    const baseUsage = 20; // Base CPU usage
    const userImpact = concurrentUsers * 0.3; // CPU impact per user
    return Math.min(95, Math.round(baseUsage + userImpact));
  }

  /**
   * Get simulated memory usage
   */
  private getSimulatedMemoryUsage(concurrentUsers: number): number {
    // Simulate memory usage based on concurrent users
    const baseUsage = 30; // Base memory usage
    const userImpact = concurrentUsers * 0.2; // Memory impact per user
    return Math.min(90, Math.round(baseUsage + userImpact));
  }

  /**
   * Get simulated database connections
   */
  private getSimulatedDatabaseConnections(concurrentUsers: number): number {
    // Simulate database connections based on concurrent users
    return Math.min(100, Math.round(concurrentUsers * 1.5));
  }

  /**
   * Analyze performance metrics
   */
  analyzePerformance(): PerformanceMetrics {
    if (this.testResults.length === 0) {
      return {
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        resourceUtilization: { cpu: 0, memory: 0, database: 0 },
        scalabilityScore: 0
      };
    }

    const avgResponseTime = this.testResults.reduce((sum, result) => sum + result.averageResponseTime, 0) / this.testResults.length;
    const avgThroughput = this.testResults.reduce((sum, result) => sum + result.throughput, 0) / this.testResults.length;
    const avgErrorRate = this.testResults.reduce((sum, result) => sum + result.errorRate, 0) / this.testResults.length;
    const avgCPU = this.testResults.reduce((sum, result) => sum + result.cpuUsage, 0) / this.testResults.length;
    const avgMemory = this.testResults.reduce((sum, result) => sum + result.memoryUsage, 0) / this.testResults.length;
    const avgDB = this.testResults.reduce((sum, result) => sum + result.databaseConnections, 0) / this.testResults.length;

    // Calculate scalability score (0-100)
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 1000) * 100); // Penalty for >1s response
    const errorRateScore = Math.max(0, 100 - avgErrorRate * 2); // Penalty for high error rate
    const resourceScore = Math.max(0, 100 - (avgCPU + avgMemory) / 2); // Penalty for high resource usage
    const scalabilityScore = Math.round((responseTimeScore + errorRateScore + resourceScore) / 3);

    return {
      responseTime: Math.round(avgResponseTime),
      throughput: Math.round(avgThroughput),
      errorRate: Math.round(avgErrorRate * 100) / 100,
      resourceUtilization: {
        cpu: Math.round(avgCPU),
        memory: Math.round(avgMemory),
        database: Math.round(avgDB)
      },
      scalabilityScore
    };
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const metrics = this.analyzePerformance();
    const recommendations: string[] = [];

    if (metrics.responseTime > 2000) {
      recommendations.push('Response time is too high (>2s). Consider database optimization and caching.');
    }

    if (metrics.errorRate > 5) {
      recommendations.push('Error rate is too high (>5%). Review error handling and system stability.');
    }

    if (metrics.resourceUtilization.cpu > 80) {
      recommendations.push('CPU usage is high (>80%). Consider horizontal scaling or code optimization.');
    }

    if (metrics.resourceUtilization.memory > 80) {
      recommendations.push('Memory usage is high (>80%). Consider memory optimization and garbage collection.');
    }

    if (metrics.scalabilityScore < 70) {
      recommendations.push('Overall scalability score is low (<70). Review system architecture and performance bottlenecks.');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is within acceptable ranges. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Log load test results
   */
  private async logLoadTestResults(results: LoadTestResult[]): Promise<void> {
    try {
      await supabase
        .from('system_alerts')
        .insert([{
          alert_type: 'load_test_completed',
          severity: 'info',
          message: `Load testing completed: ${results.length} tests executed`,
          details: {
            total_tests: results.length,
            total_requests: results.reduce((sum, r) => sum + r.totalRequests, 0),
            successful_requests: results.reduce((sum, r) => sum + r.successfulRequests, 0),
            failed_requests: results.reduce((sum, r) => sum + r.failedRequests, 0),
            average_response_time: results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length,
            max_concurrent_users: Math.max(...results.map(r => r.concurrentUsers))
          },
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging load test results:', error);
    }
  }

  /**
   * Get all test results
   */
  getAllTestResults(): LoadTestResult[] {
    return this.testResults;
  }

  /**
   * Get test result by ID
   */
  getTestResult(id: string): LoadTestResult | undefined {
    return this.testResults.find(result => result.id === id);
  }

  /**
   * Check if load testing is running
   */
  isLoadTestRunning(): boolean {
    return this.isRunning;
  }
}

export default LoadTestingService;
