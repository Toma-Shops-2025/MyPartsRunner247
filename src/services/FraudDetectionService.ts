import { supabase } from '@/lib/supabase';

interface FraudRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  reasons: string[];
  recommendations: string[];
}

interface FraudCheck {
  orderId: string;
  customerId: string;
  driverId?: string;
  amount: number;
  risk: FraudRisk;
  timestamp: string;
  action: 'approve' | 'review' | 'reject';
}

class FraudDetectionService {
  private static instance: FraudDetectionService;
  private riskThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    critical: 0.9
  };

  static getInstance(): FraudDetectionService {
    if (!FraudDetectionService.instance) {
      FraudDetectionService.instance = new FraudDetectionService();
    }
    return FraudDetectionService.instance;
  }

  /**
   * Comprehensive fraud detection for new orders
   */
  async checkOrderFraud(orderData: {
    customerId: string;
    amount: number;
    pickupAddress: string;
    deliveryAddress: string;
    itemDescription: string;
    paymentMethod: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<FraudCheck> {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // 1. Customer History Analysis
    const customerRisk = await this.analyzeCustomerHistory(orderData.customerId);
    riskScore += customerRisk.score;
    riskFactors.push(...customerRisk.reasons);

    // 2. Payment Method Analysis
    const paymentRisk = this.analyzePaymentMethod(orderData.paymentMethod, orderData.amount);
    riskScore += paymentRisk.score;
    riskFactors.push(...paymentRisk.reasons);

    // 3. Geographic Analysis
    const geoRisk = await this.analyzeGeographicRisk(orderData.pickupAddress, orderData.deliveryAddress);
    riskScore += geoRisk.score;
    riskFactors.push(...geoRisk.reasons);

    // 4. Item Analysis
    const itemRisk = this.analyzeItemRisk(orderData.itemDescription, orderData.amount);
    riskScore += itemRisk.score;
    riskFactors.push(...itemRisk.reasons);

    // 5. Behavioral Analysis
    const behaviorRisk = await this.analyzeBehavioralPatterns(orderData);
    riskScore += behaviorRisk.score;
    riskFactors.push(...behaviorRisk.reasons);

    // 6. Velocity Checks
    const velocityRisk = await this.analyzeVelocity(orderData.customerId, orderData.ipAddress);
    riskScore += velocityRisk.score;
    riskFactors.push(...velocityRisk.reasons);

    // Determine risk level and action
    const riskLevel = this.calculateRiskLevel(riskScore);
    const action = this.determineAction(riskLevel, riskScore);

    // Generate recommendations
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Manual review required');
      recommendations.push('Request additional verification');
      recommendations.push('Consider phone verification');
    }

    if (riskLevel === 'medium') {
      recommendations.push('Monitor transaction closely');
      recommendations.push('Verify customer identity');
    }

    const fraudCheck: FraudCheck = {
      orderId: `fraud_check_${Date.now()}`,
      customerId: orderData.customerId,
      amount: orderData.amount,
      risk: {
        level: riskLevel,
        score: riskScore,
        reasons: riskFactors,
        recommendations
      },
      timestamp: new Date().toISOString(),
      action
    };

    // Log fraud check
    await this.logFraudCheck(fraudCheck);

    return fraudCheck;
  }

  /**
   * Analyze customer's historical behavior
   */
  private async analyzeCustomerHistory(customerId: string): Promise<{ score: number; reasons: string[] }> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching customer history:', error);
        return { score: 0.1, reasons: ['Unable to verify customer history'] };
      }

      let score = 0;
      const reasons: string[] = [];

      if (!orders || orders.length === 0) {
        score += 0.3;
        reasons.push('New customer - no order history');
      } else {
        // Check for previous fraud indicators
        const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
        const totalOrders = orders.length;
        const cancellationRate = cancelledOrders / totalOrders;

        if (cancellationRate > 0.5) {
          score += 0.4;
          reasons.push(`High cancellation rate: ${(cancellationRate * 100).toFixed(1)}%`);
        }

        // Check for chargebacks or disputes
        const disputedOrders = orders.filter(order => order.status === 'disputed').length;
        if (disputedOrders > 0) {
          score += 0.5;
          reasons.push(`${disputedOrders} previous disputes`);
        }

        // Check order frequency
        const recentOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return orderDate > oneDayAgo;
        });

        if (recentOrders.length > 5) {
          score += 0.3;
          reasons.push(`High order frequency: ${recentOrders.length} orders in 24h`);
        }
      }

      return { score, reasons };
    } catch (error) {
      console.error('Error analyzing customer history:', error);
      return { score: 0.2, reasons: ['Error analyzing customer history'] };
    }
  }

  /**
   * Analyze payment method for fraud indicators
   */
  private analyzePaymentMethod(paymentMethod: string, amount: number): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Check for suspicious payment methods
    if (paymentMethod.includes('prepaid') || paymentMethod.includes('gift')) {
      score += 0.3;
      reasons.push('Prepaid or gift card payment method');
    }

    // Check for high-value transactions with new payment methods
    if (amount > 100 && paymentMethod.includes('new')) {
      score += 0.2;
      reasons.push('High-value transaction with new payment method');
    }

    // Check for international payment methods
    if (paymentMethod.includes('international')) {
      score += 0.1;
      reasons.push('International payment method');
    }

    return { score, reasons };
  }

  /**
   * Analyze geographic risk factors
   */
  private async analyzeGeographicRisk(pickupAddress: string, deliveryAddress: string): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Check for suspicious address patterns
    if (pickupAddress.toLowerCase().includes('warehouse') || 
        pickupAddress.toLowerCase().includes('storage')) {
      score += 0.2;
      reasons.push('Pickup from warehouse/storage facility');
    }

    if (deliveryAddress.toLowerCase().includes('hotel') || 
        deliveryAddress.toLowerCase().includes('motel')) {
      score += 0.1;
      reasons.push('Delivery to hotel/motel');
    }

    // Check for very long distances
    // This would typically use a geocoding service to calculate actual distance
    const distance = this.estimateDistance(pickupAddress, deliveryAddress);
    if (distance > 50) { // miles
      score += 0.3;
      reasons.push(`Long distance delivery: ${distance} miles`);
    }

    // Check for cross-border deliveries
    if (this.isCrossBorder(pickupAddress, deliveryAddress)) {
      score += 0.4;
      reasons.push('Cross-border delivery detected');
    }

    return { score, reasons };
  }

  /**
   * Analyze item description for risk factors
   */
  private analyzeItemRisk(itemDescription: string, amount: number): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    const description = itemDescription.toLowerCase();

    // Check for prohibited items
    const prohibitedItems = ['cash', 'jewelry', 'electronics', 'medicine', 'alcohol', 'weapon'];
    for (const item of prohibitedItems) {
      if (description.includes(item)) {
        score += 0.5;
        reasons.push(`Potentially prohibited item: ${item}`);
      }
    }

    // Check for high-value items
    if (amount > 500) {
      score += 0.2;
      reasons.push(`High-value item: $${amount}`);
    }

    // Check for vague descriptions
    if (description.length < 10 || description.includes('misc') || description.includes('stuff')) {
      score += 0.3;
      reasons.push('Vague or unclear item description');
    }

    return { score, reasons };
  }

  /**
   * Analyze behavioral patterns
   */
  private async analyzeBehavioralPatterns(orderData: any): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Check for unusual timing (e.g., orders at 3 AM)
    const hour = new Date().getHours();
    if (hour < 5 || hour > 23) {
      score += 0.1;
      reasons.push('Unusual order timing');
    }

    // Check for rapid order creation
    const recentOrders = await this.getRecentOrders(orderData.customerId, 1); // Last hour
    if (recentOrders.length > 3) {
      score += 0.4;
      reasons.push('Rapid order creation detected');
    }

    return { score, reasons };
  }

  /**
   * Analyze velocity patterns
   */
  private async analyzeVelocity(customerId: string, ipAddress?: string): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Check for multiple orders from same IP
    if (ipAddress) {
      const ipOrders = await this.getOrdersByIP(ipAddress, 1); // Last hour
      if (ipOrders.length > 5) {
        score += 0.3;
        reasons.push(`Multiple orders from same IP: ${ipOrders.length}`);
      }
    }

    // Check for account creation velocity
    const accountAge = await this.getAccountAge(customerId);
    if (accountAge < 1) { // Less than 1 hour
      score += 0.2;
      reasons.push('New account with immediate order');
    }

    return { score, reasons };
  }

  /**
   * Calculate risk level based on score
   */
  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.riskThresholds.critical) return 'critical';
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Determine action based on risk level
   */
  private determineAction(riskLevel: string, score: number): 'approve' | 'review' | 'reject' {
    if (riskLevel === 'critical' || score > 0.9) return 'reject';
    if (riskLevel === 'high' || score > 0.7) return 'review';
    return 'approve';
  }

  /**
   * Log fraud check results
   */
  private async logFraudCheck(fraudCheck: FraudCheck): Promise<void> {
    try {
      await supabase
        .from('fraud_checks')
        .insert([{
          order_id: fraudCheck.orderId,
          customer_id: fraudCheck.customerId,
          driver_id: fraudCheck.driverId,
          amount: fraudCheck.amount,
          risk_level: fraudCheck.risk.level,
          risk_score: fraudCheck.risk.score,
          risk_reasons: fraudCheck.risk.reasons,
          recommendations: fraudCheck.risk.recommendations,
          action: fraudCheck.action,
          timestamp: fraudCheck.timestamp
        }]);
    } catch (error) {
      console.error('Error logging fraud check:', error);
    }
  }

  /**
   * Get recent orders for a customer
   */
  private async getRecentOrders(customerId: string, hours: number): Promise<any[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .gte('created_at', cutoffTime);

    if (error) {
      console.error('Error fetching recent orders:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get orders by IP address
   */
  private async getOrdersByIP(ipAddress: string, hours: number): Promise<any[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('created_at', cutoffTime);

    if (error) {
      console.error('Error fetching orders by IP:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get account age
   */
  private async getAccountAge(customerId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', customerId)
      .single();

    if (error || !data) {
      return 0;
    }

    const accountCreated = new Date(data.created_at);
    const now = new Date();
    return (now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60); // hours
  }

  /**
   * Estimate distance between addresses (simplified)
   */
  private estimateDistance(address1: string, address2: string): number {
    // This is a simplified estimation
    // In production, use a proper geocoding service
    return Math.random() * 100; // Placeholder
  }

  /**
   * Check if delivery is cross-border
   */
  private isCrossBorder(address1: string, address2: string): boolean {
    // Simplified check - in production, use proper geocoding
    return address1.includes('Canada') && address2.includes('USA') ||
           address1.includes('USA') && address2.includes('Canada');
  }

  /**
   * Get fraud statistics
   */
  async getFraudStatistics(): Promise<{
    totalChecks: number;
    approvedOrders: number;
    reviewedOrders: number;
    rejectedOrders: number;
    fraudRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('fraud_checks')
        .select('action');

      if (error) {
        console.error('Error fetching fraud statistics:', error);
        return {
          totalChecks: 0,
          approvedOrders: 0,
          reviewedOrders: 0,
          rejectedOrders: 0,
          fraudRate: 0
        };
      }

      const totalChecks = data.length;
      const approvedOrders = data.filter(check => check.action === 'approve').length;
      const reviewedOrders = data.filter(check => check.action === 'review').length;
      const rejectedOrders = data.filter(check => check.action === 'reject').length;
      const fraudRate = (reviewedOrders + rejectedOrders) / totalChecks;

      return {
        totalChecks,
        approvedOrders,
        reviewedOrders,
        rejectedOrders,
        fraudRate
      };
    } catch (error) {
      console.error('Error calculating fraud statistics:', error);
      return {
        totalChecks: 0,
        approvedOrders: 0,
        reviewedOrders: 0,
        rejectedOrders: 0,
        fraudRate: 0
      };
    }
  }
}

export default FraudDetectionService;
