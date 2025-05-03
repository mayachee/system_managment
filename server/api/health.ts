/**
 * Health Check API
 * 
 * This API provides health check endpoints for monitoring the system's health.
 */

import { Request, Response } from 'express';
import { db } from '../db';
import os from 'os';

/**
 * Get basic health status
 * GET /api/health
 */
export async function getHealth(req: Request, res: Response) {
  try {
    // Basic health check - returns 200 OK if server is running
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      serverName: os.hostname(),
      uptime: Math.floor(process.uptime()),
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: 'Error checking health' });
  }
}

/**
 * Get detailed health status including database connection
 * GET /api/health/detailed
 */
export async function getDetailedHealth(req: Request, res: Response) {
  try {
    // Start with basic info
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: {
        hostname: os.hostname(),
        uptime: Math.floor(process.uptime()),
        platform: process.platform,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        cpuLoad: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
      },
      services: {
        database: { status: 'checking' },
      }
    };

    // Check database
    try {
      const dbStart = Date.now();
      // Run a simple query to test connection
      await db.execute('SELECT NOW()');
      const dbEnd = Date.now();
      
      health.services.database = {
        status: 'ok',
        responseTime: `${dbEnd - dbStart}ms`
      };
    } catch (dbError) {
      health.status = 'degraded';
      health.services.database = {
        status: 'error',
        error: `${dbError}`
      };
    }

    // Set response status based on overall health
    const httpStatus = health.status === 'ok' ? 200 : 
                       health.status === 'degraded' ? 200 : 500;
    
    res.status(httpStatus).json(health);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error performing detailed health check',
      error: `${error}`
    });
  }
}

/**
 * Get database health status
 * GET /api/health/database
 */
export async function getDatabaseHealth(req: Request, res: Response) {
  try {
    const start = Date.now();
    
    // Test database connection
    const result = await db.execute('SELECT NOW() as time, current_database() as database');
    
    const end = Date.now();
    const responseTime = end - start;
    
    res.status(200).json({
      status: 'ok',
      database: result.rows ? result.rows[0] : null, 
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: `${error}`,
      timestamp: new Date().toISOString()
    });
  }
}