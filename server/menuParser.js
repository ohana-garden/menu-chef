import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Parse a menu file (PDF or image) and extract structured data with rich context
 */
export async function parseMenu(filePath, fileType) {
  let extractedText = '';
  let layoutInfo = null;

  if (fileType === 'application/pdf') {
    const result = await parsePDF(filePath);
    extractedText = result.text;
    layoutInfo = result.layoutInfo;
  } else {
    extractedText = await parseImage(filePath);
    layoutInfo = { method: 'ocr', confidence: 'medium' };
  }

  // Build structured menu representation
  const menuStructure = analyzeMenuStructure(extractedText);

  // Extract rich context
  const context = extractMenuContext(menuStructure, extractedText);

  return {
    originalText: extractedText,
    structure: menuStructure,
    context,
    layoutInfo,
    metadata: {
      itemCount: menuStructure.items.length,
      sectionCount: menuStructure.sections.length,
      parsedAt: new Date().toISOString(),
    },
  };
}

async function parsePDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);

  return {
    text: data.text,
    layoutInfo: {
      pages: data.numpages,
      method: 'pdf-parse',
      info: data.info,
    },
  };
}

async function parseImage(filePath) {
  // Convert image to buffer and perform OCR
  const imageBuffer = await fs.readFile(filePath);

  // Use Tesseract for OCR
  const result = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: () => {}, // Suppress logs
  });

  return result.data.text;
}

function analyzeMenuStructure(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  const sections = [];
  const items = [];
  let currentSection = null;

  // Patterns for detection
  const pricePattern = /\$\s*\d+(\.\d{2})?/g;
  const sectionPattern = /^[A-Z\s&]+$/; // All caps likely section headers

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section headers (all caps, no prices)
    if (sectionPattern.test(line) && !pricePattern.test(line) && line.length < 50) {
      currentSection = {
        name: line,
        items: [],
        startIndex: i,
      };
      sections.push(currentSection);
      continue;
    }

    // Detect menu items (contains price)
    const prices = line.match(pricePattern);
    if (prices) {
      const item = {
        rawText: line,
        section: currentSection?.name || 'Uncategorized',
        prices: prices.map(p => parseFloat(p.replace('$', '').trim())),
        lineIndex: i,
      };

      // Try to extract name and description
      const parts = line.split(/\s{2,}|\t/); // Split on multiple spaces or tabs
      if (parts.length >= 2) {
        item.name = parts[0].replace(pricePattern, '').trim();
        item.description = parts.slice(1).join(' ').replace(pricePattern, '').trim();
      } else {
        // Try to extract name before price
        const beforePrice = line.split(pricePattern)[0];
        item.name = beforePrice.trim();
        item.description = line.replace(beforePrice, '').replace(pricePattern, '').trim();
      }

      items.push(item);
      if (currentSection) {
        currentSection.items.push(item);
      }
    }
  }

  return {
    sections,
    items,
    rawLines: lines,
  };
}

function extractMenuContext(structure, fullText) {
  const context = {
    cuisineType: detectCuisineType(fullText, structure),
    priceRange: calculatePriceRange(structure.items),
    targetAudience: inferTargetAudience(fullText, structure),
    currentProblems: identifyProblems(structure, fullText),
    restaurantType: inferRestaurantType(fullText, structure),
    strengths: identifyStrengths(structure),
  };

  return context;
}

function detectCuisineType(text, structure) {
  const cuisineKeywords = {
    italian: ['pasta', 'pizza', 'risotto', 'marinara', 'parmigiana', 'lasagna'],
    mexican: ['taco', 'burrito', 'enchilada', 'quesadilla', 'salsa', 'guacamole'],
    chinese: ['kung pao', 'chow mein', 'fried rice', 'dim sum', 'szechuan'],
    japanese: ['sushi', 'sashimi', 'ramen', 'tempura', 'teriyaki', 'miso'],
    thai: ['pad thai', 'curry', 'tom yum', 'basil', 'coconut milk'],
    indian: ['curry', 'tandoori', 'naan', 'biryani', 'masala', 'tikka'],
    american: ['burger', 'steak', 'fries', 'bbq', 'wings', 'sandwich'],
    french: ['boeuf', 'coq au vin', 'ratatouille', 'bouillabaisse', 'escargot'],
  };

  const textLower = text.toLowerCase();
  const scores = {};

  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    scores[cuisine] = keywords.filter(kw => textLower.includes(kw)).length;
  }

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) return 'general';

  const detectedCuisines = Object.entries(scores)
    .filter(([_, score]) => score === maxScore)
    .map(([cuisine]) => cuisine);

  return detectedCuisines.length === 1 ? detectedCuisines[0] : detectedCuisines.join('/');
}

function calculatePriceRange(items) {
  if (items.length === 0) return { min: 0, max: 0, average: 0, category: 'unknown' };

  const allPrices = items.flatMap(item => item.prices);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const average = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

  let category = 'budget';
  if (average > 30) category = 'upscale';
  else if (average > 15) category = 'mid-range';

  return { min, max, average: parseFloat(average.toFixed(2)), category };
}

function inferTargetAudience(text, structure) {
  const indicators = [];
  const textLower = text.toLowerCase();

  if (textLower.includes('kids') || textLower.includes('children')) {
    indicators.push('families');
  }
  if (textLower.includes('romantic') || textLower.includes('wine pairing')) {
    indicators.push('couples');
  }
  if (textLower.includes('quick') || textLower.includes('lunch special')) {
    indicators.push('business lunch crowd');
  }
  if (textLower.includes('brunch') || textLower.includes('breakfast')) {
    indicators.push('breakfast/brunch crowd');
  }
  if (structure.items.length > 50) {
    indicators.push('diverse clientele');
  }

  return indicators.length > 0 ? indicators : ['general public'];
}

function identifyProblems(structure, fullText) {
  const problems = [];

  // Too many items
  if (structure.items.length > 40) {
    problems.push({
      type: 'clutter',
      severity: 'high',
      description: `Menu has ${structure.items.length} items, which may overwhelm customers`,
    });
  }

  // Missing sections
  if (structure.sections.length === 0) {
    problems.push({
      type: 'organization',
      severity: 'high',
      description: 'No clear sections detected, menu lacks organization',
    });
  }

  // Inconsistent pricing format
  const priceFormats = structure.items.map(item => item.rawText.match(/\$\s*\d+(\.\d{2})?/)?.[0] || '');
  const uniqueFormats = new Set(priceFormats.map(p => {
    if (p.includes('.')) return 'decimal';
    return 'whole';
  }));
  if (uniqueFormats.size > 1) {
    problems.push({
      type: 'consistency',
      severity: 'medium',
      description: 'Inconsistent price formatting detected',
    });
  }

  // Missing descriptions
  const itemsWithoutDesc = structure.items.filter(item => !item.description || item.description.length < 10);
  if (itemsWithoutDesc.length > structure.items.length * 0.3) {
    problems.push({
      type: 'content',
      severity: 'medium',
      description: `${itemsWithoutDesc.length} items lack detailed descriptions`,
    });
  }

  // Very long descriptions (readability issue)
  const itemsWithLongDesc = structure.items.filter(item => item.description && item.description.length > 150);
  if (itemsWithLongDesc.length > 5) {
    problems.push({
      type: 'readability',
      severity: 'low',
      description: 'Some descriptions are very long and may hurt readability',
    });
  }

  return problems;
}

function inferRestaurantType(text, structure) {
  const textLower = text.toLowerCase();

  if (textLower.includes('fine dining') || structure.context?.priceRange?.category === 'upscale') {
    return 'fine-dining';
  }
  if (textLower.includes('cafe') || textLower.includes('coffee')) {
    return 'cafe';
  }
  if (textLower.includes('diner') || textLower.includes('breakfast all day')) {
    return 'diner';
  }
  if (textLower.includes('bistro')) {
    return 'bistro';
  }
  if (structure.items.length < 15) {
    return 'specialized';
  }

  return 'casual-dining';
}

function identifyStrengths(structure) {
  const strengths = [];

  if (structure.sections.length >= 3 && structure.sections.length <= 8) {
    strengths.push('Well-organized section structure');
  }

  const itemsWithDesc = structure.items.filter(item => item.description && item.description.length >= 20);
  if (itemsWithDesc.length > structure.items.length * 0.7) {
    strengths.push('Good item descriptions');
  }

  if (structure.items.length >= 10 && structure.items.length <= 30) {
    strengths.push('Appropriate menu size - not overwhelming');
  }

  return strengths;
}
