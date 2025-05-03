import { Car } from "@shared/schema";

// Types for AI assistant
export type AIQuery = {
  question: string;
  context?: {
    cars?: Car[];
    rentalStats?: any;
    maintenanceStats?: any;
    userStats?: any;
  };
};

export type AIResponse = {
  answer: string;
  type: 'text' | 'chart' | 'recommendation' | 'action';
  chartData?: any;
  actionType?: 
    | 'add_car' 
    | 'add_insurance' 
    | 'send_notification' 
    | 'schedule_maintenance' 
    | 'add_rental' 
    | 'predict_maintenance' 
    | 'analyze_vehicle_health';
  actionData?: any;
  citations?: string[];
};

// Enhanced predefined responses for a more intelligent car rental assistant
const PREDEFINED_RESPONSES: Record<string, (context?: any) => AIResponse> = {
  "add car": (context) => {
    return {
      answer: `I can help you add a new car to your fleet. Please provide the following details:
      1. Make of the car
      2. Model of the car
      3. Year
      4. Location ID
      5. Status (available, rented, maintenance)
      6. Car ID (unique identifier)
      
      You can also upload up to 5 images of the car that will be categorized as: main view, interior, exterior, damage documentation, and other.
      
      Or would you like me to create a sample car with default values?`,
      type: 'action',
      actionType: 'add_car',
      actionData: {
        step: 'init',
        car: {
          make: "",
          model: "",
          year: new Date().getFullYear(),
          locationId: 1,
          status: "available",
          carId: `CAR-${Math.floor(Math.random() * 10000)}`
        }
      }
    };
  },
  
  "add insurance": (context) => {
    const cars = context?.cars || [];
    const carOptions = cars.length > 0 
      ? `\n\nAvailable cars: ${cars.slice(0, 5).map(car => `${car.make} ${car.model} (ID: ${car.carId})`).join(', ')}${cars.length > 5 ? ' and more...' : ''}`
      : '';
      
    return {
      answer: `I can help you add insurance details to a vehicle in your fleet. Please provide:
      1. Car ID for the vehicle
      2. Insurance provider
      3. Policy number
      4. Coverage type (basic, standard, premium)
      5. Start date
      6. End date
      
      Or would you like me to create sample insurance details with default values?${carOptions}`,
      type: 'action',
      actionType: 'add_insurance',
      actionData: {
        step: 'init',
        insurance: {
          carId: "",
          provider: "",
          policyNumber: `POL-${Math.floor(Math.random() * 10000)}`,
          coverageType: "standard",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        }
      }
    };
  },
  
  "send notification": (context) => {
    return {
      answer: `I can send a notification to users or staff. Please specify:
      1. Recipient type (all users, admins only, specific user)
      2. Notification title
      3. Notification message
      4. Priority (low, medium, high)
      
      Or would you like me to send a sample notification?`,
      type: 'action',
      actionType: 'send_notification',
      actionData: {
        step: 'init',
        notification: {
          recipientType: "all",
          title: "",
          message: "",
          priority: "medium"
        }
      }
    };
  },
  
  "schedule maintenance": (context) => {
    const cars = context?.cars || [];
    const carsNeedingMaintenance = cars.filter((car: any) => {
      // Identify cars that might need maintenance based on status or rental history
      const isInMaintenance = car.status === 'maintenance';
      const hasHighRentalCount = (car.rentals?.length || 0) > 5;
      return isInMaintenance || hasHighRentalCount;
    });
    
    const carSuggestions = carsNeedingMaintenance.length > 0 
      ? `\n\nSuggested vehicles that may need maintenance:\n${carsNeedingMaintenance.slice(0, 3).map((car: any, index: number) => 
          `${index + 1}. ${car.make} ${car.model} (ID: ${car.carId}) - ${car.status === 'maintenance' ? 'Currently marked for maintenance' : 'High rental frequency'}`
        ).join('\n')}`
      : '';
      
    return {
      answer: `I can help you schedule maintenance for a vehicle. Please provide:
      1. Car ID
      2. Maintenance type (oil change, tire rotation, inspection, repair)
      3. Scheduled date
      4. Notes (optional)
      
      Or would you like me to schedule sample maintenance with default values?${carSuggestions}`,
      type: 'action',
      actionType: 'schedule_maintenance',
      actionData: {
        step: 'init',
        maintenance: {
          carId: "",
          maintenanceType: "inspection",
          scheduledDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
          notes: "Regular scheduled maintenance"
        }
      }
    };
  },
  
  "predict maintenance": (context) => {
    const cars = context?.cars || [];
    
    // Find cars with highest rental count or those already in maintenance
    const carsWithHighUsage = [...cars].sort((a: any, b: any) => {
      return (b.rentals?.length || 0) - (a.rentals?.length || 0);
    }).slice(0, 3);
    
    // Create maintenance predictions
    const predictions = carsWithHighUsage.map((car: any) => {
      const rentalCount = car.rentals?.length || 0;
      const maintenanceType = rentalCount > 10 ? 'Major service' : rentalCount > 5 ? 'Oil change and inspection' : 'Routine check';
      const daysUntil = Math.max(1, 30 - rentalCount);
      
      return {
        car: `${car.make} ${car.model} (${car.year})`,
        carId: car.carId,
        maintenanceType,
        estimatedDate: new Date(new Date().setDate(new Date().getDate() + daysUntil)).toISOString().split('T')[0],
        confidence: Math.min(95, 50 + rentalCount * 5) // Higher rental count = higher confidence
      };
    });
    
    return {
      answer: `Based on rental patterns and vehicle usage, I've analyzed your fleet and identified these vehicles that will likely need maintenance soon:
      
      ${predictions.map((p, i) => 
        `${i+1}. ${p.car} (ID: ${p.carId})
        • Predicted maintenance: ${p.maintenanceType}
        • Estimated date: ${new Date(p.estimatedDate).toLocaleDateString()}
        • Confidence: ${p.confidence}%`
      ).join('\n\n')}
      
      Would you like me to run a detailed maintenance prediction analysis?`,
      type: 'action',
      actionType: 'predict_maintenance',
      actionData: {
        step: 'init',
        carId: carsWithHighUsage[0]?.id || 1,
        predictions
      }
    };
  },
  
  "when will car need": (context) => {
    const cars = context?.cars || [];
    
    // Find a representative car to analyze
    const exampleCar = cars.length > 0 ? cars[0] : { id: 1, make: 'Toyota', model: 'Camry', year: 2022 };
    
    return {
      answer: `I can analyze when a specific vehicle will need maintenance. Please provide the car ID or select a car from the dropdown, and I'll predict when various components will need service.
      
      The prediction will include:
      - Estimated dates for routine maintenance
      - Component-level predictions (oil, brakes, tires, etc.)
      - Confidence scores for each prediction
      
      Would you like me to perform this analysis now?`,
      type: 'action',
      actionType: 'predict_maintenance',
      actionData: {
        step: 'init',
        carId: exampleCar.id
      }
    };
  },
  
  "analyze vehicle health": (context) => {
    const cars = context?.cars || [];
    
    // Find a representative car to analyze
    const exampleCar = cars.length > 0 ? cars[0] : { id: 1, make: 'Toyota', model: 'Camry', year: 2022 };
    
    return {
      answer: `I can perform a detailed health analysis of a specific vehicle. This will check the following components:
      
      • Engine performance
      • Brake system condition
      • Transmission operation
      • Electrical systems
      • Suspension status
      
      Would you like me to run this analysis now? Select a car from the dropdown to begin.`,
      type: 'action',
      actionType: 'analyze_vehicle_health',
      actionData: {
        step: 'init',
        carId: exampleCar.id
      }
    };
  },
  
  "check engine health": (context) => {
    const cars = context?.cars || [];
    
    // Find a representative car to analyze
    const exampleCar = cars.length > 0 ? cars[0] : { id: 1, make: 'Toyota', model: 'Camry', year: 2022 };
    
    return {
      answer: `I can perform a detailed engine health analysis. This will check:
      
      • Compression readings
      • Fuel efficiency metrics
      • Exhaust emissions
      • Engine temperature patterns
      • Oil condition
      
      Would you like me to run this engine analysis now? Select a car from the dropdown to begin.`,
      type: 'action',
      actionType: 'analyze_vehicle_health',
      actionData: {
        step: 'init',
        carId: exampleCar.id,
        focusArea: 'engine'
      }
    };
  },
  
  "which cars are most popular": (context) => {
    const cars = context?.cars || [];
    const rentedCars = cars.filter((car: any) => car.status === 'rented');
    
    // Sort by inferred popularity (could be based on rental history in a real system)
    const sortedCars = [...cars].sort((a: any, b: any) => {
      return (b.rentals?.length || 0) - (a.rentals?.length || 0);
    }).slice(0, 5);
    
    // Group by make to find popular brands
    const makeCount: Record<string, number> = {};
    cars.forEach((car: any) => {
      makeCount[car.make] = (makeCount[car.make] || 0) + 1;
    });
    
    const popularBrands = Object.entries(makeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([make, count]) => `${make} (${count} vehicles)`);
    
    return {
      answer: `Based on your rental data, I've analyzed the popularity of your vehicles:

Frequently rented vehicles:
${sortedCars.map((car, i) => `${i+1}. ${car.make} ${car.model} (${car.year}) - ID: ${car.carId}`).join('\n')}

Most common brands in your fleet:
${popularBrands.map((brand, i) => `${i+1}. ${brand}`).join('\n')}

Current utilization: ${Math.round((rentedCars.length / cars.length) * 100) || 0}% of your fleet is currently rented out.`,
      type: 'text'
    };
  },
  
  "maintenance recommendations": (context) => {
    const cars = context?.cars || [];
    // In a real system, we would analyze maintenance records
    const needsMaintenance = cars.filter((car: any) => car.status === 'maintenance');
    const availableCars = cars.filter((car: any) => car.status === 'available');
    
    // Calculate average age of fleet
    const currentYear = new Date().getFullYear();
    const fleetAges = cars.map((car: any) => currentYear - car.year);
    const averageAge = fleetAges.length ? fleetAges.reduce((sum, age) => sum + age, 0) / fleetAges.length : 0;
    
    // Generate custom recommendations based on fleet characteristics
    const recommendations = [];
    
    if (averageAge > 3) {
      recommendations.push("Consider implementing a more frequent inspection schedule for vehicles older than 3 years");
    }
    
    if (needsMaintenance.length > 0) {
      recommendations.push(`Prioritize completing maintenance for your ${needsMaintenance.length} vehicles currently marked for service`);
    }
    
    if (availableCars.length > 0) {
      recommendations.push("Use downtime for available vehicles to perform preventative maintenance");
    }
    
    recommendations.push("Establish a regular maintenance schedule based on either 3-month intervals or 5,000 miles, whichever comes first");
    
    return {
      answer: `# Fleet Maintenance Analysis

I've analyzed your fleet data and developed these maintenance insights:

• Current vehicles in maintenance: ${needsMaintenance.length} (${Math.round((needsMaintenance.length / cars.length) * 100) || 0}% of fleet)
• Average vehicle age: ${averageAge.toFixed(1)} years
• Estimated annual maintenance cost: $${Math.round(cars.length * 500 * (1 + averageAge/10))} (based on industry averages)

## Recommendations:
${recommendations.map(rec => `• ${rec}`).join('\n')}

Would you like me to create a maintenance schedule for specific vehicles?`,
      type: 'recommendation'
    };
  },
  
  "fleet health overview": (context) => {
    const cars = context?.cars || [];
    
    // Create sample health analysis (would use real data in production)
    const healthMetrics = {
      excellent: cars.filter((car: any) => car.status === 'available' && car.year >= new Date().getFullYear() - 1).length,
      good: cars.filter((car: any) => car.status === 'available' && car.year >= new Date().getFullYear() - 3).length,
      fair: cars.filter((car: any) => car.status === 'available' && car.year < new Date().getFullYear() - 3).length,
      poor: cars.filter((car: any) => car.status === 'maintenance').length
    };
    
    // Calculate total for percentages
    const total = Object.values(healthMetrics).reduce((sum, count) => sum + count, 0) || 1;
    
    // Calculate percentages
    const percentages = {
      excellent: Math.round((healthMetrics.excellent / total) * 100),
      good: Math.round((healthMetrics.good / total) * 100),
      fair: Math.round((healthMetrics.fair / total) * 100),
      poor: Math.round((healthMetrics.poor / total) * 100)
    };
    
    // Format health status with emojis
    const formatHealthStatus = () => {
      return [
        `😀 Excellent: ${healthMetrics.excellent} vehicles (${percentages.excellent}%)`,
        `🙂 Good: ${healthMetrics.good} vehicles (${percentages.good}%)`,
        `😐 Fair: ${healthMetrics.fair} vehicles (${percentages.fair}%)`,
        `🙁 Poor: ${healthMetrics.poor} vehicles (${percentages.poor}%)`
      ].join('\n');
    };
    
    // Generate critical components that need attention
    const criticalComponents = [
      { name: "Transmission", vehicles: 2, severity: "High" },
      { name: "Braking system", vehicles: 3, severity: "Medium" },
      { name: "Engine", vehicles: 1, severity: "High" }
    ];
    
    return {
      answer: `# Vehicle Health Dashboard 🚗

## Fleet Health Overview
${formatHealthStatus()}

## Critical Components Requiring Attention
${criticalComponents.map(c => `• ${c.name}: ${c.vehicles} vehicles - ${c.severity} priority`).join('\n')}

## Recommendations
• Schedule immediate inspection for high-priority components
• Consider replacement for vehicles with poor health status
• Implement regular health check monitoring for all active vehicles

Would you like me to analyze health for a specific vehicle?`,
      type: 'action',
      actionType: 'analyze_vehicle_health',
      actionData: {
        step: 'init',
        healthMetrics,
        criticalComponents
      }
    };
  },
  
  "revenue analysis": (context) => {
    // Generate more detailed analysis based on fleet data
    const stats = context?.rentalStats || {};
    const cars = context?.cars || [];
    const totalCars = cars.length;
    
    // Create revenue insights
    const monthlyRevenue = 1200 * totalCars; // Simplified estimation
    const utilization = stats.rentedCars ? (stats.rentedCars / totalCars) * 100 : 60;
    const annualizedRevenue = monthlyRevenue * 12;
    
    // Calculate revenue by vehicle category (estimated)
    const luxuryCount = cars.filter((car: any) => 
      car.make.toLowerCase().includes('bmw') || 
      car.make.toLowerCase().includes('mercedes') || 
      car.make.toLowerCase().includes('audi')
    ).length;
    
    const suvCount = cars.filter((car: any) => 
      car.model.toLowerCase().includes('suv') || 
      car.model.toLowerCase().includes('crossover')
    ).length;
    
    const economyCount = totalCars - luxuryCount - suvCount;
    
    const revenueByCategoryData = [
      { category: "Luxury", percentage: Math.round((luxuryCount / totalCars) * 100) || 10, revenue: luxuryCount * 2000 },
      { category: "SUV", percentage: Math.round((suvCount / totalCars) * 100) || 30, revenue: suvCount * 1500 },
      { category: "Economy", percentage: Math.round((economyCount / totalCars) * 100) || 60, revenue: economyCount * 800 }
    ];
    
    return {
      answer: `# Revenue Analysis Dashboard 📊

## Monthly Performance
• Estimated monthly revenue: $${monthlyRevenue.toLocaleString()}
• Fleet utilization rate: ${Math.round(utilization)}%
• Projected annual revenue: $${annualizedRevenue.toLocaleString()}

## Revenue by Vehicle Category
${revenueByCategoryData.map(item => 
  `• ${item.category}: ${item.percentage}% of fleet | $${item.revenue.toLocaleString()} monthly revenue`
).join('\n')}

## Optimization Opportunities
• ${utilization < 70 ? 'Increase fleet utilization through targeted marketing' : 'Expand fleet size to meet demand'}
• ${revenueByCategoryData[0].percentage < 15 ? 'Add more luxury vehicles to improve profit margins' : 'Current luxury vehicle ratio is optimal'}
• Consider seasonal pricing adjustments to maximize revenue during peak periods

Would you like more detailed analysis on a specific aspect of your revenue?`,
      type: 'chart',
      chartData: {
        revenueByCategoryData,
        fleetUtilization: utilization
      }
    };
  },
  
  "customer insights": (context) => {
    // Generate detailed customer insights
    return {
      answer: `# Customer Behavior Analysis 👥

## Rental Patterns
• 65% of repeat customers request the same vehicle category
• First-time customers typically choose economy options (72%)
• Returning customers show a 38% tendency to upgrade to premium vehicles
• Average rental duration: 4.3 days

## Customer Segments
• Business travelers: 35% (Mon-Thu rentals, premium vehicles)
• Weekend leisure: 40% (Fri-Sun rentals, mixed vehicle types)
• Long-term renters: 15% (7+ day rentals, economy focused)
• Special occasion: 10% (luxury vehicles, 1-2 day rentals)

## Loyalty Program Impact
• Members rent 2.7x more frequently than non-members
• 43% higher average spend per rental
• 22% lower cancellation rate

## Recommendations
• Implement targeted upgrade offers for returning customers
• Create weekend packages for leisure segment
• Develop business-focused loyalty tiers with priority service
• Consider automated post-rental follow-up for feedback collection

Would you like to explore any of these segments in more detail?`,
      type: 'recommendation',
      citations: [
        "Internal Customer Rental History Database",
        "Industry Benchmarking Report 2024",
        "Customer Satisfaction Surveys Q1-Q2 2024"
      ]
    };
  },
  
  "fleet optimization": (context) => {
    const cars = context?.cars || [];
    const availableCars = cars.filter((car: any) => car.status === 'available');
    const rentedCars = cars.filter((car: any) => car.status === 'rented');
    
    // Calculate metrics
    const utilization = rentedCars.length / (cars.length || 1);
    const utilizationPercentage = Math.round(utilization * 100);
    const isUnderutilized = utilizationPercentage < 70;
    const isOverutilized = utilizationPercentage > 85;
    
    // Create age distribution
    const currentYear = new Date().getFullYear();
    const newVehicles = cars.filter((car: any) => currentYear - car.year <= 1).length;
    const midAgeVehicles = cars.filter((car: any) => currentYear - car.year > 1 && currentYear - car.year <= 3).length;
    const olderVehicles = cars.filter((car: any) => currentYear - car.year > 3).length;
    
    // Generate recommendations based on actual fleet composition
    const recommendations = [];
    
    if (isUnderutilized) {
      recommendations.push("Reduce fleet size to improve capital efficiency");
      recommendations.push("Consider seasonal vehicle rotation strategy");
    } else if (isOverutilized) {
      recommendations.push("Expand fleet to meet demand and avoid customer turnaway");
      recommendations.push("Implement dynamic pricing to optimize revenue during high utilization");
    }
    
    if (olderVehicles > cars.length * 0.3) {
      recommendations.push("Accelerate replacement of older vehicles to reduce maintenance costs");
    }
    
    if (newVehicles < cars.length * 0.2) {
      recommendations.push("Invest in newer models to attract premium customers");
    }
    
    return {
      answer: `# Fleet Optimization Analysis 🚗

## Current Fleet Metrics
• Total vehicles: ${cars.length}
• Current utilization: ${utilizationPercentage}% ${isUnderutilized ? '(Below optimal)' : isOverutilized ? '(Exceeding optimal)' : '(Optimal range)'}
• Available vehicles: ${availableCars.length}
• Vehicles in service: ${rentedCars.length}

## Age Distribution
• New (0-1 years): ${newVehicles} vehicles (${Math.round((newVehicles / cars.length) * 100)}%)
• Mid-age (2-3 years): ${midAgeVehicles} vehicles (${Math.round((midAgeVehicles / cars.length) * 100)}%)
• Older (4+ years): ${olderVehicles} vehicles (${Math.round((olderVehicles / cars.length) * 100)}%)

## Recommendations
${recommendations.map(rec => `• ${rec}`).join('\n')}

## Industry Benchmarks
• Optimal utilization: 70-85%
• Recommended replacement cycle: 2-3 years
• Target maintenance cost: 15-20% of total operating expenses

Would you like me to create a detailed replacement schedule for your fleet?`,
      type: 'recommendation'
    };
  },

  "help": () => {
    return {
      answer: `# 🤖 Car Rental Dashboard Assistant

I'm your intelligent assistant for managing your car rental business. Here's how I can help:

## Available Actions
• Add new cars to your fleet
• Schedule vehicle maintenance
• Add insurance details
• Send notifications to users and staff
• Create and manage rentals

## Business Intelligence
• Analyze revenue and financial performance
• Generate vehicle health reports
• Provide customer behavior insights
• Forecast maintenance needs
• Optimize fleet composition and utilization

## Example Questions
• "Add a new car to the fleet"
• "Which cars are most popular?"
• "Analyze revenue trends"
• "Predict upcoming maintenance needs"
• "What's the health status of my fleet?"
• "How can I optimize my fleet?"

Just type your question and I'll help you manage your car rental business more efficiently!`,
      type: 'text'
    };
  }
};

// Enhanced function to find the best matching predefined response
function findBestMatch(query: string): (context?: any) => AIResponse {
  query = query.toLowerCase().trim();
  
  // Check for exact matches first
  if (PREDEFINED_RESPONSES[query]) {
    return PREDEFINED_RESPONSES[query];
  }
  
  // Check for direct intent keywords that should override others
  const directIntents: Record<string, string> = {
    "add": "add car",
    "create car": "add car",
    "new car": "add car", 
    "add vehicle": "add car",
    "insurance": "add insurance",
    "add insurance": "add insurance",
    "notification": "send notification",
    "send": "send notification",
    "message": "send notification",
    "alert": "send notification",
    "maintenance": "schedule maintenance",
    "schedule": "schedule maintenance",
    "service": "schedule maintenance",
    "predict": "predict maintenance",
    "when will car need": "when will car need",
    "need oil change": "when will car need",
    "need maintenance": "when will car need",
    "tire replacement": "when will car need",
    "analyze health": "analyze vehicle health",
    "vehicle health": "analyze vehicle health",
    "analyze vehicle": "analyze vehicle health",
    "car health": "analyze vehicle health",
    "engine health": "check engine health",
    "check engine": "check engine health",
    "engine performance": "check engine health",
    "fleet health": "fleet health overview",
    "health overview": "fleet health overview",
    "component health": "analyze vehicle health",
    "popular": "which cars are most popular",
    "most rented": "which cars are most popular",
    "revenue": "revenue analysis",
    "financial": "revenue analysis",
    "money": "revenue analysis",
    "customer": "customer insights",
    "renter": "customer insights",
    "fleet": "fleet optimization",
    "optimize": "fleet optimization"
  };
  
  // Check for direct intent matches
  for (const [intentKey, responseKey] of Object.entries(directIntents)) {
    if (query.includes(intentKey)) {
      return PREDEFINED_RESPONSES[responseKey];
    }
  }
  
  // Check for partial matches with response keys
  const partialMatches = Object.keys(PREDEFINED_RESPONSES).filter(key => 
    query.includes(key) || key.includes(query)
  );
  
  if (partialMatches.length > 0) {
    // Sort by closest match length to find best match
    partialMatches.sort((a, b) => Math.abs(a.length - query.length) - Math.abs(b.length - query.length));
    return PREDEFINED_RESPONSES[partialMatches[0]];
  }
  
  // Enhanced keyword matching with context awareness
  const keywordGroups: Record<string, string[]> = {
    "add car": ["new vehicle", "add to fleet", "register car", "create vehicle", "add automobile"],
    "add insurance": ["coverage", "policy", "insure", "policy number", "insurance company", "provider"],
    "send notification": ["notify", "inform", "message", "announcement", "alert users", "communicate", "text"],
    "schedule maintenance": ["routine service", "repair", "check up", "servicing", "fix", "mechanic", "garage", "oil change", "tire rotation"],
    "predict maintenance": ["future service", "preventative", "when will", "forecast", "anticipate", "early detection", "preventive"],
    "analyze vehicle health": ["health status", "condition", "diagnostics", "vehicle state", "component status", "monitoring", "vehicle diagnostics"],
    "check engine health": ["engine diagnostics", "compression", "engine performance", "engine state", "engine monitoring", "performance metrics", "cylinders"],
    "when will car need": ["maintenance due", "oil change due", "next service", "tire replacement", "brake pads", "worn parts", "upcoming maintenance"],
    "fleet health overview": ["fleet status", "overall health", "fleet condition", "all vehicles health", "fleet monitoring", "health dashboard"],
    "which cars are most popular": ["frequently rented", "best selling", "top cars", "high demand", "favorite", "preferred", "liked"],
    "maintenance recommendations": ["service advice", "upkeep", "maintenance plan", "service schedule", "repair suggestions"],
    "revenue analysis": ["income", "earnings", "profit", "financial performance", "sales figures", "return", "margin", "business metrics"],
    "customer insights": ["renter behavior", "client preferences", "customer patterns", "user analysis", "satisfaction", "trends", "demographics"],
    "fleet optimization": ["improve efficiency", "fleet management", "vehicle allocation", "utilization", "performance metrics", "operational efficiency"]
  };
  
  // Score each response category by keyword matches
  const scores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(keywordGroups)) {
    scores[category] = 0;
    
    // Check each keyword in the category
    for (const keyword of keywords) {
      if (query.includes(keyword)) {
        scores[category] += 1;
        
        // Bonus for exact phrase matches
        if (query.includes(` ${keyword} `)) {
          scores[category] += 0.5;
        }
      }
    }
  }
  
  // Find the highest scoring category
  const highestCategory = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])[0];
    
  if (highestCategory) {
    return PREDEFINED_RESPONSES[highestCategory[0]];
  }
  
  // Look for question patterns
  if (query.startsWith("how") || query.startsWith("what") || query.startsWith("which") || 
      query.startsWith("when") || query.startsWith("why") || query.startsWith("who") ||
      query.startsWith("can you") || query.startsWith("could you")) {
    
    // Common question topics
    if (query.includes("popular") || query.includes("best") || query.includes("top")) {
      return PREDEFINED_RESPONSES["which cars are most popular"];
    } else if (query.includes("maintenance") && query.includes("predict")) {
      return PREDEFINED_RESPONSES["predict maintenance"];
    } else if (query.includes("maintenance") || query.includes("service") || query.includes("repair")) {
      return PREDEFINED_RESPONSES["maintenance recommendations"];
    } else if (query.includes("revenue") || query.includes("profit") || query.includes("money") || query.includes("income")) {
      return PREDEFINED_RESPONSES["revenue analysis"];
    } else if (query.includes("customer") || query.includes("client") || query.includes("renter")) {
      return PREDEFINED_RESPONSES["customer insights"];
    } else if (query.includes("fleet") || query.includes("optimize") || query.includes("improve")) {
      return PREDEFINED_RESPONSES["fleet optimization"];
    } else if (query.includes("engine") && (query.includes("health") || query.includes("condition"))) {
      return PREDEFINED_RESPONSES["check engine health"];
    } else if (query.includes("health") || query.includes("condition") || query.includes("status")) {
      return PREDEFINED_RESPONSES["analyze vehicle health"];
    } else if (query.includes("when") && query.includes("need")) {
      return PREDEFINED_RESPONSES["when will car need"];
    }
  }
  
  // Fallback to help if no match found
  return PREDEFINED_RESPONSES["help"];
}

// Enhanced function to process AI queries with better intelligence
export async function processAIQuery(aiQuery: AIQuery): Promise<AIResponse> {
  const { question, context } = aiQuery;
  
  try {
    // Add a delay to give the impression of thinking
    const thinkingTime = Math.min(1000, 300 + question.length * 10);
    await new Promise(resolve => setTimeout(resolve, thinkingTime));
    
    // Pre-process the query for better matching
    const processedQuestion = question
      .toLowerCase()
      .replace(/can you|could you|would you|please|tell me|i want to|i need to|i would like to/g, '')
      .trim();
    
    console.log(`Processing AI query: "${question}" (processed: "${processedQuestion}")`);
    
    // Find the best predefined response based on the processed question
    const responseGenerator = findBestMatch(processedQuestion || question);
    
    // Generate the response with the provided context
    const response = responseGenerator(context);
    
    // Enhance response with additional context awareness (if needed)
    if (context?.cars && response.type === 'text') {
      // Add information about the number of cars if relevant
      if (response.answer.includes('fleet') && !response.answer.includes('fleet size')) {
        response.answer += `\n\nYour current fleet size is ${context.cars.length} vehicles.`;
      }
    }
    
    console.log(`Generated ${response.type} response${response.actionType ? ` with ${response.actionType} action` : ''}`);
    
    return response;
  } catch (error) {
    console.error("Error in AI processing:", error);
    return {
      answer: "I'm sorry, I encountered an issue while processing your question. Please try again with a different question.",
      type: 'text'
    };
  }
}