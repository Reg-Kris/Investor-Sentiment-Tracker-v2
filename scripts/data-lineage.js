#!/usr/bin/env node

/**
 * Data Lineage Tracking System
 * Provides comprehensive data lineage tracking for financial data pipeline
 * Enables tracing of data flow from source to consumption with transformation tracking
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { getAuditLogger, AUDIT_LEVELS, AUDIT_CATEGORIES } from './audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data lineage node types
const NODE_TYPES = {
  SOURCE: 'SOURCE',           // External data sources
  TRANSFORMER: 'TRANSFORMER', // Data transformation steps
  VALIDATOR: 'VALIDATOR',     // Data validation steps
  AGGREGATOR: 'AGGREGATOR',   // Data aggregation steps
  SINK: 'SINK',              // Final output destinations
  CACHE: 'CACHE',            // Cache layers
  ENRICHER: 'ENRICHER'       // Data enrichment steps
};

// Data flow types
const FLOW_TYPES = {
  EXTRACT: 'EXTRACT',         // Data extraction from source
  TRANSFORM: 'TRANSFORM',     // Data transformation
  VALIDATE: 'VALIDATE',       // Data validation
  ENRICH: 'ENRICH',          // Data enrichment
  AGGREGATE: 'AGGREGATE',     // Data aggregation
  LOAD: 'LOAD',              // Data loading to destination
  CACHE_READ: 'CACHE_READ',   // Cache read operation
  CACHE_WRITE: 'CACHE_WRITE'  // Cache write operation
};

// Data quality impact levels
const QUALITY_IMPACT = {
  NONE: 'NONE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export class DataLineageTracker {
  constructor(config = {}) {
    this.config = {
      enableLineageTracking: true,
      enableTransformationLogging: true,
      enableDataFingerprinting: true,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
      lineageStoragePath: path.resolve(__dirname, '../logs/data-lineage'),
      maxLineageDepth: 10,
      enableRealTimeTracking: true,
      ...config
    };

    this.auditLogger = getAuditLogger();
    
    // Lineage tracking state
    this.lineageGraph = new Map(); // nodeId -> node
    this.lineageEdges = new Map(); // edgeId -> edge
    this.activeSessions = new Map(); // sessionId -> session
    this.dataFingerprints = new Map(); // dataHash -> metadata
    
    this.initializeLineageTracking();
  }

  /**
   * Initialize data lineage tracking system
   */
  initializeLineageTracking() {
    // Ensure storage directory exists
    fs.ensureDirSync(this.config.lineageStoragePath);
    
    // Load existing lineage data
    this.loadExistingLineage();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupOldLineage();
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    this.auditLogger.logSystemEvent('DATA_LINEAGE_TRACKING_INITIALIZED', {
      config: this.sanitizeConfig(),
      existingNodes: this.lineageGraph.size,
      existingEdges: this.lineageEdges.size
    });
  }

  /**
   * Start a new data lineage session
   */
  startLineageSession(sessionName, context = {}) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      name: sessionName,
      startTime: Date.now(),
      context,
      nodes: [],
      edges: [],
      status: 'ACTIVE',
      rootNode: null,
      leafNodes: [],
      metadata: {
        pipelineVersion: context.pipelineVersion || '1.0.0',
        executionEnvironment: process.env.NODE_ENV || 'development',
        userId: context.userId || 'system',
        traceId: context.traceId || this.generateTraceId()
      }
    };

    this.activeSessions.set(sessionId, session);
    
    this.auditLogger.logSystemEvent('LINEAGE_SESSION_STARTED', {
      sessionId,
      sessionName,
      traceId: session.metadata.traceId
    });

    return sessionId;
  }

  /**
   * Create a lineage node
   */
  createLineageNode(sessionId, nodeConfig) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown lineage session: ${sessionId}`);
    }

    const nodeId = this.generateNodeId();
    
    const node = {
      id: nodeId,
      sessionId,
      type: nodeConfig.type,
      name: nodeConfig.name,
      description: nodeConfig.description || '',
      timestamp: Date.now(),
      properties: nodeConfig.properties || {},
      dataSchema: nodeConfig.dataSchema || null,
      dataFingerprint: null,
      qualityMetrics: {
        completeness: null,
        accuracy: null,
        consistency: null,
        validity: null
      },
      transformationRules: nodeConfig.transformationRules || [],
      dependencies: [], // Will be populated through edges
      dependents: [], // Will be populated through edges
      metadata: {
        source: nodeConfig.source || 'unknown',
        version: nodeConfig.version || '1.0.0',
        tags: nodeConfig.tags || [],
        businessContext: nodeConfig.businessContext || {}
      }
    };

    // Add to graph and session
    this.lineageGraph.set(nodeId, node);
    session.nodes.push(nodeId);

    // Set as root node if first node
    if (!session.rootNode) {
      session.rootNode = nodeId;
    }

    this.auditLogger.logDataTransformation(
      'LINEAGE_NODE_CREATED',
      {},
      { nodeId, type: node.type, name: node.name },
      { sessionId, nodeType: node.type }
    );

    return nodeId;
  }

  /**
   * Create a lineage edge (data flow connection)
   */
  createLineageEdge(sessionId, sourceNodeId, targetNodeId, flowConfig) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown lineage session: ${sessionId}`);
    }

    const sourceNode = this.lineageGraph.get(sourceNodeId);
    const targetNode = this.lineageGraph.get(targetNodeId);
    
    if (!sourceNode || !targetNode) {
      throw new Error(`Source or target node not found`);
    }

    const edgeId = this.generateEdgeId();
    
    const edge = {
      id: edgeId,
      sessionId,
      sourceNodeId,
      targetNodeId,
      flowType: flowConfig.flowType,
      timestamp: Date.now(),
      dataVolume: flowConfig.dataVolume || 0,
      processingTime: flowConfig.processingTime || 0,
      transformationDetails: flowConfig.transformationDetails || {},
      qualityImpact: flowConfig.qualityImpact || QUALITY_IMPACT.NONE,
      dataMapping: flowConfig.dataMapping || {},
      conditions: flowConfig.conditions || [],
      metadata: {
        triggeredBy: flowConfig.triggeredBy || 'system',
        businessRule: flowConfig.businessRule || null,
        complianceRequirement: flowConfig.complianceRequirement || null
      }
    };

    // Add to graph and session
    this.lineageEdges.set(edgeId, edge);
    session.edges.push(edgeId);

    // Update node dependencies
    sourceNode.dependents.push(targetNodeId);
    targetNode.dependencies.push(sourceNodeId);

    this.auditLogger.logDataTransformation(
      'LINEAGE_EDGE_CREATED',
      { sourceNode: sourceNode.name },
      { targetNode: targetNode.name },
      { sessionId, flowType: edge.flowType, edgeId }
    );

    return edgeId;
  }

  /**
   * Track data transformation with lineage
   */
  async trackTransformation(sessionId, sourceNodeId, targetNodeId, inputData, outputData, transformationConfig = {}) {
    try {
      // Create data fingerprints
      const inputFingerprint = this.createDataFingerprint(inputData);
      const outputFingerprint = this.createDataFingerprint(outputData);
      
      // Update node fingerprints
      const sourceNode = this.lineageGraph.get(sourceNodeId);
      const targetNode = this.lineageGraph.get(targetNodeId);
      
      if (sourceNode) sourceNode.dataFingerprint = inputFingerprint;
      if (targetNode) targetNode.dataFingerprint = outputFingerprint;

      // Store fingerprint metadata
      this.dataFingerprints.set(inputFingerprint, {
        nodeId: sourceNodeId,
        timestamp: Date.now(),
        dataSize: JSON.stringify(inputData).length,
        recordCount: Array.isArray(inputData) ? inputData.length : 1,
        schema: this.extractDataSchema(inputData)
      });

      this.dataFingerprints.set(outputFingerprint, {
        nodeId: targetNodeId,
        timestamp: Date.now(),
        dataSize: JSON.stringify(outputData).length,
        recordCount: Array.isArray(outputData) ? outputData.length : 1,
        schema: this.extractDataSchema(outputData)
      });

      // Create or update edge with transformation details
      const edgeId = this.createLineageEdge(sessionId, sourceNodeId, targetNodeId, {
        flowType: FLOW_TYPES.TRANSFORM,
        dataVolume: JSON.stringify(inputData).length,
        processingTime: transformationConfig.processingTime || 0,
        transformationDetails: {
          inputFingerprint,
          outputFingerprint,
          transformationType: transformationConfig.type || 'unknown',
          fieldsAdded: this.getFieldsAdded(inputData, outputData),
          fieldsRemoved: this.getFieldsRemoved(inputData, outputData),
          fieldsModified: this.getFieldsModified(inputData, outputData),
          businessLogic: transformationConfig.businessLogic || null
        },
        qualityImpact: this.assessQualityImpact(inputData, outputData),
        dataMapping: this.createDataMapping(inputData, outputData)
      });

      // Log the transformation
      await this.auditLogger.logDataTransformation(
        transformationConfig.operation || 'data_transformation',
        inputData,
        outputData,
        {
          sessionId,
          sourceNodeId,
          targetNodeId,
          edgeId,
          inputFingerprint,
          outputFingerprint
        }
      );

      return {
        edgeId,
        inputFingerprint,
        outputFingerprint,
        transformationDetails: this.lineageEdges.get(edgeId).transformationDetails
      };

    } catch (error) {
      await this.auditLogger.logError(error, {
        operation: 'track_transformation',
        sessionId,
        sourceNodeId,
        targetNodeId,
        affectsDataIntegrity: true
      });
      throw error;
    }
  }

  /**
   * Track data quality metrics for a node
   */
  updateNodeQualityMetrics(nodeId, qualityMetrics) {
    const node = this.lineageGraph.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    node.qualityMetrics = {
      ...node.qualityMetrics,
      ...qualityMetrics,
      lastUpdated: Date.now()
    };

    this.auditLogger.logDataValidation(
      `node_${nodeId}`,
      {
        isValid: qualityMetrics.validity > 0.8,
        qualityScore: (qualityMetrics.completeness + qualityMetrics.accuracy + qualityMetrics.consistency + qualityMetrics.validity) / 4
      }
    );
  }

  /**
   * Complete a lineage session
   */
  completeLineageSession(sessionId, result = 'SUCCESS') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown lineage session: ${sessionId}`);
    }

    session.status = result;
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Identify leaf nodes (nodes with no dependents)
    session.leafNodes = session.nodes.filter(nodeId => {
      const node = this.lineageGraph.get(nodeId);
      return node && node.dependents.length === 0;
    });

    // Save session lineage
    this.saveSessionLineage(session);

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    this.auditLogger.logSystemEvent('LINEAGE_SESSION_COMPLETED', {
      sessionId,
      result,
      duration: session.duration,
      nodesCreated: session.nodes.length,
      edgesCreated: session.edges.length,
      leafNodes: session.leafNodes.length
    });

    return {
      sessionId,
      result,
      duration: session.duration,
      summary: this.generateSessionSummary(session)
    };
  }

  /**
   * Query lineage for a specific data element
   */
  queryLineage(nodeId, direction = 'both', maxDepth = null) {
    const depth = maxDepth || this.config.maxLineageDepth;
    const visited = new Set();
    const result = {
      rootNode: nodeId,
      upstream: [],
      downstream: [],
      fullPath: []
    };

    if (direction === 'upstream' || direction === 'both') {
      result.upstream = this.traverseLineage(nodeId, 'upstream', depth, visited);
    }

    if (direction === 'downstream' || direction === 'both') {
      visited.clear();
      result.downstream = this.traverseLineage(nodeId, 'downstream', depth, visited);
    }

    // Generate full path from sources to sinks
    result.fullPath = this.generateFullPath(nodeId);

    return result;
  }

  /**
   * Traverse lineage graph in specified direction
   */
  traverseLineage(nodeId, direction, maxDepth, visited = new Set(), currentDepth = 0) {
    if (currentDepth >= maxDepth || visited.has(nodeId)) {
      return [];
    }

    visited.add(nodeId);
    const node = this.lineageGraph.get(nodeId);
    if (!node) return [];

    const result = [{
      node: this.sanitizeNodeForQuery(node),
      depth: currentDepth,
      edges: []
    }];

    const relatedNodes = direction === 'upstream' ? node.dependencies : node.dependents;

    for (const relatedNodeId of relatedNodes) {
      const edgeId = this.findEdgeBetweenNodes(
        direction === 'upstream' ? relatedNodeId : nodeId,
        direction === 'upstream' ? nodeId : relatedNodeId
      );
      
      if (edgeId) {
        const edge = this.lineageEdges.get(edgeId);
        result[0].edges.push(this.sanitizeEdgeForQuery(edge));
      }

      const childResults = this.traverseLineage(relatedNodeId, direction, maxDepth, visited, currentDepth + 1);
      result.push(...childResults);
    }

    return result;
  }

  /**
   * Generate data impact analysis
   */
  generateImpactAnalysis(nodeId, changeType = 'SCHEMA_CHANGE') {
    const downstreamNodes = this.queryLineage(nodeId, 'downstream');
    
    const impact = {
      sourceNode: nodeId,
      changeType,
      timestamp: Date.now(),
      affectedNodes: [],
      riskLevel: 'LOW',
      recommendations: []
    };

    // Analyze downstream impact
    downstreamNodes.downstream.forEach(item => {
      const node = item.node;
      const riskFactors = [];

      // Check for transformation complexity
      const incomingEdges = item.edges.filter(e => e.targetNodeId === node.id);
      incomingEdges.forEach(edge => {
        if (edge.transformationDetails && Object.keys(edge.transformationDetails).length > 0) {
          riskFactors.push('COMPLEX_TRANSFORMATION');
        }
        if (edge.qualityImpact === QUALITY_IMPACT.HIGH || edge.qualityImpact === QUALITY_IMPACT.CRITICAL) {
          riskFactors.push('HIGH_QUALITY_IMPACT');
        }
      });

      // Check for business criticality
      if (node.metadata.businessContext.critical) {
        riskFactors.push('BUSINESS_CRITICAL');
      }

      impact.affectedNodes.push({
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        riskFactors,
        impactLevel: this.calculateImpactLevel(riskFactors),
        recommendations: this.generateNodeRecommendations(node, riskFactors)
      });
    });

    // Calculate overall risk level
    impact.riskLevel = this.calculateOverallRisk(impact.affectedNodes);

    // Generate general recommendations
    impact.recommendations = this.generateImpactRecommendations(impact);

    return impact;
  }

  /**
   * Get lineage statistics
   */
  getLineageStatistics() {
    const stats = {
      timestamp: Date.now(),
      totalNodes: this.lineageGraph.size,
      totalEdges: this.lineageEdges.size,
      activeSessions: this.activeSessions.size,
      nodesByType: {},
      edgesByFlowType: {},
      averageNodeDegree: 0,
      qualityMetrics: {
        averageCompleteness: 0,
        averageAccuracy: 0,
        averageConsistency: 0,
        averageValidity: 0
      }
    };

    // Count nodes by type
    for (const node of this.lineageGraph.values()) {
      stats.nodesByType[node.type] = (stats.nodesByType[node.type] || 0) + 1;
    }

    // Count edges by flow type
    for (const edge of this.lineageEdges.values()) {
      stats.edgesByFlowType[edge.flowType] = (stats.edgesByFlowType[edge.flowType] || 0) + 1;
    }

    // Calculate average node degree (connections)
    let totalDegree = 0;
    for (const node of this.lineageGraph.values()) {
      totalDegree += node.dependencies.length + node.dependents.length;
    }
    stats.averageNodeDegree = this.lineageGraph.size > 0 ? totalDegree / this.lineageGraph.size : 0;

    // Calculate quality metrics
    const nodesWithQuality = Array.from(this.lineageGraph.values()).filter(n => n.qualityMetrics.completeness !== null);
    if (nodesWithQuality.length > 0) {
      stats.qualityMetrics.averageCompleteness = nodesWithQuality.reduce((sum, n) => sum + n.qualityMetrics.completeness, 0) / nodesWithQuality.length;
      stats.qualityMetrics.averageAccuracy = nodesWithQuality.reduce((sum, n) => sum + n.qualityMetrics.accuracy, 0) / nodesWithQuality.length;
      stats.qualityMetrics.averageConsistency = nodesWithQuality.reduce((sum, n) => sum + n.qualityMetrics.consistency, 0) / nodesWithQuality.length;
      stats.qualityMetrics.averageValidity = nodesWithQuality.reduce((sum, n) => sum + n.qualityMetrics.validity, 0) / nodesWithQuality.length;
    }

    return stats;
  }

  // Utility methods

  generateSessionId() {
    return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateNodeId() {
    return `node_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateEdgeId() {
    return `edge_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateTraceId() {
    return crypto.randomBytes(16).toString('hex');
  }

  createDataFingerprint(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  extractDataSchema(data) {
    if (Array.isArray(data) && data.length > 0) {
      return this.extractDataSchema(data[0]);
    }
    
    if (typeof data === 'object' && data !== null) {
      const schema = {};
      for (const [key, value] of Object.entries(data)) {
        schema[key] = typeof value;
      }
      return schema;
    }
    
    return { type: typeof data };
  }

  getFieldsAdded(before, after) {
    const beforeKeys = this.getObjectKeys(before);
    const afterKeys = this.getObjectKeys(after);
    return afterKeys.filter(key => !beforeKeys.includes(key));
  }

  getFieldsRemoved(before, after) {
    const beforeKeys = this.getObjectKeys(before);
    const afterKeys = this.getObjectKeys(after);
    return beforeKeys.filter(key => !afterKeys.includes(key));
  }

  getFieldsModified(before, after) {
    const beforeKeys = this.getObjectKeys(before);
    const afterKeys = this.getObjectKeys(after);
    const commonKeys = beforeKeys.filter(key => afterKeys.includes(key));
    
    return commonKeys.filter(key => {
      const beforeValue = this.getNestedValue(before, key);
      const afterValue = this.getNestedValue(after, key);
      return JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
    });
  }

  getObjectKeys(obj, prefix = '') {
    if (typeof obj !== 'object' || obj === null) return [];
    
    const keys = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.getObjectKeys(value, fullKey));
      }
    }
    return keys;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key];
    }, obj);
  }

  assessQualityImpact(inputData, outputData) {
    const inputSize = JSON.stringify(inputData).length;
    const outputSize = JSON.stringify(outputData).length;
    const sizeChange = Math.abs(outputSize - inputSize) / inputSize;
    
    if (sizeChange > 0.5) return QUALITY_IMPACT.HIGH;
    if (sizeChange > 0.2) return QUALITY_IMPACT.MEDIUM;
    if (sizeChange > 0.05) return QUALITY_IMPACT.LOW;
    return QUALITY_IMPACT.NONE;
  }

  createDataMapping(inputData, outputData) {
    // Simplified data mapping - in production this would be more sophisticated
    return {
      inputSchema: this.extractDataSchema(inputData),
      outputSchema: this.extractDataSchema(outputData),
      mappingRules: [] // Would contain field-to-field mappings
    };
  }

  findEdgeBetweenNodes(sourceNodeId, targetNodeId) {
    for (const [edgeId, edge] of this.lineageEdges.entries()) {
      if (edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId) {
        return edgeId;
      }
    }
    return null;
  }

  sanitizeNodeForQuery(node) {
    return {
      id: node.id,
      type: node.type,
      name: node.name,
      description: node.description,
      timestamp: node.timestamp,
      properties: node.properties,
      qualityMetrics: node.qualityMetrics,
      metadata: node.metadata
    };
  }

  sanitizeEdgeForQuery(edge) {
    return {
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      flowType: edge.flowType,
      timestamp: edge.timestamp,
      processingTime: edge.processingTime,
      qualityImpact: edge.qualityImpact,
      metadata: edge.metadata
    };
  }

  generateFullPath(nodeId) {
    // Implementation would generate complete data flow path
    return [];
  }

  calculateImpactLevel(riskFactors) {
    if (riskFactors.includes('BUSINESS_CRITICAL') || riskFactors.includes('HIGH_QUALITY_IMPACT')) {
      return 'HIGH';
    }
    if (riskFactors.includes('COMPLEX_TRANSFORMATION')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  generateNodeRecommendations(node, riskFactors) {
    const recommendations = [];
    
    if (riskFactors.includes('COMPLEX_TRANSFORMATION')) {
      recommendations.push('Review transformation logic for potential breaking changes');
    }
    if (riskFactors.includes('HIGH_QUALITY_IMPACT')) {
      recommendations.push('Implement additional data quality checks');
    }
    if (riskFactors.includes('BUSINESS_CRITICAL')) {
      recommendations.push('Coordinate with business stakeholders before making changes');
    }
    
    return recommendations;
  }

  calculateOverallRisk(affectedNodes) {
    const highRiskNodes = affectedNodes.filter(n => n.impactLevel === 'HIGH').length;
    const mediumRiskNodes = affectedNodes.filter(n => n.impactLevel === 'MEDIUM').length;
    
    if (highRiskNodes > 0) return 'HIGH';
    if (mediumRiskNodes > 2) return 'MEDIUM';
    return 'LOW';
  }

  generateImpactRecommendations(impact) {
    const recommendations = [];
    
    if (impact.riskLevel === 'HIGH') {
      recommendations.push('Implement comprehensive testing before deployment');
      recommendations.push('Consider phased rollout approach');
    }
    
    if (impact.affectedNodes.length > 10) {
      recommendations.push('Create detailed impact communication plan');
    }
    
    return recommendations;
  }

  generateSessionSummary(session) {
    const nodes = session.nodes.map(id => this.lineageGraph.get(id)).filter(Boolean);
    const edges = session.edges.map(id => this.lineageEdges.get(id)).filter(Boolean);
    
    return {
      nodeTypes: [...new Set(nodes.map(n => n.type))],
      flowTypes: [...new Set(edges.map(e => e.flowType))],
      totalDataVolume: edges.reduce((sum, e) => sum + (e.dataVolume || 0), 0),
      totalProcessingTime: edges.reduce((sum, e) => sum + (e.processingTime || 0), 0),
      qualityImpacts: edges.map(e => e.qualityImpact).filter(i => i !== QUALITY_IMPACT.NONE)
    };
  }

  saveSessionLineage(session) {
    try {
      const fileName = `lineage-session-${session.id}.json`;
      const filePath = path.join(this.config.lineageStoragePath, fileName);
      
      const lineageData = {
        session,
        nodes: session.nodes.map(id => this.lineageGraph.get(id)).filter(Boolean),
        edges: session.edges.map(id => this.lineageEdges.get(id)).filter(Boolean)
      };
      
      fs.writeJSONSync(filePath, lineageData, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save session lineage:', error);
    }
  }

  loadExistingLineage() {
    try {
      const files = fs.readdirSync(this.config.lineageStoragePath);
      const lineageFiles = files.filter(f => f.startsWith('lineage-session-') && f.endsWith('.json'));
      
      lineageFiles.forEach(file => {
        try {
          const filePath = path.join(this.config.lineageStoragePath, file);
          const lineageData = fs.readJSONSync(filePath);
          
          // Restore nodes and edges to memory
          lineageData.nodes?.forEach(node => {
            this.lineageGraph.set(node.id, node);
          });
          
          lineageData.edges?.forEach(edge => {
            this.lineageEdges.set(edge.id, edge);
          });
        } catch (error) {
          console.warn(`Failed to load lineage file ${file}:`, error.message);
        }
      });
    } catch (error) {
      console.warn('Failed to load existing lineage:', error.message);
    }
  }

  cleanupOldLineage() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    // Remove old nodes
    for (const [nodeId, node] of this.lineageGraph.entries()) {
      if (node.timestamp < cutoff) {
        this.lineageGraph.delete(nodeId);
      }
    }
    
    // Remove old edges
    for (const [edgeId, edge] of this.lineageEdges.entries()) {
      if (edge.timestamp < cutoff) {
        this.lineageEdges.delete(edgeId);
      }
    }
    
    // Remove old fingerprints
    for (const [fingerprint, metadata] of this.dataFingerprints.entries()) {
      if (metadata.timestamp < cutoff) {
        this.dataFingerprints.delete(fingerprint);
      }
    }
  }

  sanitizeConfig() {
    return {
      enableLineageTracking: this.config.enableLineageTracking,
      enableTransformationLogging: this.config.enableTransformationLogging,
      maxLineageDepth: this.config.maxLineageDepth,
      retentionPeriod: this.config.retentionPeriod
    };
  }
}

// Export singleton instance
let lineageTracker = null;

export function getLineageTracker(config = {}) {
  if (!lineageTracker) {
    lineageTracker = new DataLineageTracker(config);
  }
  return lineageTracker;
}

export { 
  NODE_TYPES, 
  FLOW_TYPES, 
  QUALITY_IMPACT 
};

export default DataLineageTracker;