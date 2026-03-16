import { chatCompletion } from './apiService';
import { twowheelers } from '../data/bike/twowheelerProducts';

class BikeAIRecommendationService {
  constructor() {
    this.vehicleCache = null;
  }

  buildVehicleDataset() {
    if (this.vehicleCache) return this.vehicleCache;

    this.vehicleCache = twowheelers.slice(0, 100).map(v => {
      const firstVariant = v.variants?.[0];
      const specs = firstVariant?.specs || {};
      
      return {
        id: v.model_details?.model_id,
        model_slug: v.model_details?.model_masking_name || v.model_slug,
        make_slug: v.model_details?.make_masking_name || v.make_slug,
        display_name: v.bike_name || v.model_details?.model_name,
        brand: v.model_details?.make_name,
        vehicle_type: v.vehicle_type,
        fuel_type: v.fuel_type,
        is_electric: v.model_details?.is_electric,
        ex_showroom_price: v.ex_showroom_price || firstVariant?.ex_showroom_price || 0,
        rating: v.model_details?.overall_rating || 4.0,
        reviews: v.model_details?.total_reviews || 0,
        model_image: v.model_details?.image_path,
        specs: {
          displacement: specs.Displacement,
          mileage: specs['Mileage - ARAI'],
          power: specs['Max Power(bhp)'] || specs['Max Power'],
          torque: specs['Max Torque'],
          transmission: specs.Transmission,
          kerb_weight: specs['Kerb Weight'],
          fuel_tank: specs['Fuel Tank Capacity'],
          seat_height: specs['Seat Height'],
          ground_clearance: specs['Ground Clearance'],
          top_speed: specs['Top Speed']
        },
        variant_count: v.variants?.length || 1,
        variant_price_range: v.variants ? {
          min: Math.min(...v.variants.map(vr => vr.ex_showroom_price || 0)),
          max: Math.max(...v.variants.map(vr => vr.ex_showroom_price || 0))
        } : null
      };
    }).filter(v => v.model_slug && v.ex_showroom_price > 0);

    return this.vehicleCache;
  }

  buildSystemPrompt() {
    return `You are an expert two-wheeler sales consultant with deep knowledge of Indian motorcycles and scooters. Your job is to analyze user requirements and recommend the BEST 2 vehicles from our available inventory.

Consider these factors when making recommendations:
1. Primary use case (commute, touring, sports, family)
2. Budget constraints and value for money
3. Fuel efficiency and running costs
4. Maintenance and reliability
5. Resale value
6. Brand reputation and service network
7. Latest features and technology
8. Rider experience level

You must return EXACTLY 2 vehicle model_slugs from the provided dataset that best match the user's requirements. Do not recommend vehicles outside the dataset.`;
  }

  buildUserPrompt(userPreferences, vehicles) {
    const { purpose, budget, type, additionalContext = '' } = userPreferences;
    
    const vehicleList = vehicles.map(v => `
MODEL: ${v.model_slug}
Name: ${v.display_name}
Brand: ${v.brand}
Type: ${v.vehicle_type} | ${v.fuel_type}${v.is_electric ? ' (Electric)' : ''}
Price: ₹${v.ex_showroom_price.toLocaleString()}
Rating: ${v.rating}/5 (${v.reviews} reviews)
Engine: ${v.specs.displacement || 'N/A'}
Mileage: ${v.specs.mileage || 'N/A'}
Power: ${v.specs.power || 'N/A'}
Weight: ${v.specs.kerb_weight || 'N/A'}
Variants: ${v.variant_count}
`).join('\n---\n');

    return `USER REQUIREMENTS:
Purpose: ${purpose || 'Not specified'}
Budget: ${budget || 'Not specified'}
Preferred Type: ${type || 'Any'}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

AVAILABLE VEHICLES (${vehicles.length} options):
${vehicleList}

Based on the user's requirements and available vehicles, analyze and recommend the TOP 2 most suitable vehicles.

Return ONLY a JSON object in this exact format:
{
  "recommendations": [
    {
      "model_slug": "exact-model-slug-from-list",
      "rank": 1,
      "reasoning": "Detailed explanation of why this is the best match",
      "best_for": "Who should buy this bike"
    },
    {
      "model_slug": "exact-model-slug-from-list", 
      "rank": 2,
      "reasoning": "Detailed explanation",
      "best_for": "Who should buy this"
    }
  ],
  "comparison_summary": "Brief comparison of the two recommendations",
  "verdict": "Which one is better for the user's specific needs and why"
}

IMPORTANT: 
- Use exact model_slug values from the vehicle list above
- Return exactly 2 recommendations
- Be specific about why each bike matches the user's needs`;
  }

  async getRecommendations(userPreferences) {
    const vehicles = this.buildVehicleDataset();
    
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(userPreferences, vehicles);

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await chatCompletion(messages, {
        model: 'claude-sonnet-4-5',
        maxTokens: 4096,
        useCache: false
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      const parsedResponse = this.parseAIResponse(content, vehicles);
      
      return {
        success: true,
        recommendations: parsedResponse.recommendations,
        comparison_summary: parsedResponse.comparison_summary,
        verdict: parsedResponse.verdict,
        vehicles: parsedResponse.vehicles
      };
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      return this.getFallbackRecommendations(userPreferences, vehicles);
    }
  }

  parseAIResponse(content, allVehicles) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      
      const enrichedVehicles = parsed.recommendations.map(rec => {
        const vehicle = allVehicles.find(v => 
          v.model_slug === rec.model_slug || 
          v.display_name.toLowerCase() === rec.model_slug.toLowerCase()
        );
        return {
          ...rec,
          vehicleData: vehicle || null
        };
      }).filter(rec => rec.vehicleData !== null);

      return {
        recommendations: enrichedVehicles,
        comparison_summary: parsed.comparison_summary || '',
        verdict: parsed.verdict || '',
        vehicles: enrichedVehicles.map(rec => rec.vehicleData)
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return { recommendations: [], comparison_summary: '', verdict: '', vehicles: [] };
    }
  }

  getFallbackRecommendations(userPreferences, vehicles) {
    const { budget, type } = userPreferences;
    
    let filtered = [...vehicles];
    
    if (budget) {
      const budgetMap = {
        'Under ₹70K': { max: 70000 },
        '₹70K - ₹1L': { min: 70000, max: 100000 },
        '₹1L - ₹1.5L': { min: 100000, max: 150000 },
        'Above ₹1.5L': { min: 150000 }
      };
      const range = budgetMap[budget];
      if (range) {
        filtered = filtered.filter(v => {
          if (range.min && v.ex_showroom_price < range.min) return false;
          if (range.max && v.ex_showroom_price > range.max) return false;
          return true;
        });
      }
    }
    
    if (type && type !== 'Any') {
      const typeLower = type.toLowerCase();
      filtered = filtered.filter(v => {
        if (typeLower === 'electric') return v.is_electric;
        if (typeLower === 'scooter') return v.vehicle_type === 'Scooter';
        if (typeLower === 'motorcycle') return v.vehicle_type === 'Bike';
        return true;
      });
    }
    
    const sorted = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const topTwo = sorted.slice(0, 2);
    
    return {
      success: true,
      recommendations: topTwo.map((v, idx) => ({
        model_slug: v.model_slug,
        rank: idx + 1,
        reasoning: idx === 0 ? 'Top rated option with excellent features' : 'Great alternative with good value',
        best_for: idx === 0 ? 'Best overall choice' : 'Budget-friendly alternative',
        vehicleData: v
      })),
      comparison_summary: 'Both options are highly rated within your criteria',
      verdict: topTwo[0] ? `${topTwo[0].display_name} is the recommended choice based on ratings and features` : 'No matches found',
      vehicles: topTwo
    };
  }

  async searchWebForReviews(vehicleName) {
    try {
      const searchPrompt = `Search for recent reviews and expert opinions about ${vehicleName} motorcycle/scooter in India. Provide a summary of:
1. Overall user sentiment
2. Common pros and cons
3. Expert ratings
4. Market position`;

      const response = await chatCompletion([
        { role: 'user', content: searchPrompt }
      ], { model: 'kimi-latest', maxTokens: 2048, useCache: true });

      return response.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Web search error:', error);
      return '';
    }
  }
}

export const bikeAIRecommendationService = new BikeAIRecommendationService();
export default BikeAIRecommendationService;
