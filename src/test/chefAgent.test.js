import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChefAgent } from '../../server/agents/ChefAgent.js';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      constructor() {
        this.messages = {
          create: vi.fn().mockResolvedValue({
            content: [{ text: 'Hello, I am the Chef Agent.' }],
          }),
        };
      }
    },
  };
});

describe('Chef Agent', () => {
  let chef;
  let mockMenuData;

  beforeEach(() => {
    chef = new ChefAgent();
    mockMenuData = {
      structure: {
        sections: [
          {
            name: 'APPETIZERS',
            items: [
              { name: 'Bruschetta', prices: [8.99], description: 'Tomatoes on toast' }
            ],
          },
        ],
        items: [
          { name: 'Bruschetta', prices: [8.99], description: 'Tomatoes on toast' }
        ],
        rawLines: ['Restaurant Menu', 'APPETIZERS', 'Bruschetta $8.99'],
      },
      context: {
        cuisineType: 'italian',
        restaurantType: 'casual-dining',
        priceRange: { min: 8.99, max: 24.99, average: 15.50, category: 'mid-range' },
        targetAudience: ['general public'],
        currentProblems: [],
        strengths: ['Well-organized section structure'],
      },
      metadata: {
        itemCount: 1,
        sectionCount: 1,
      },
    };
  });

  it('should greet with menu analysis', async () => {
    const greeting = await chef.greet(mockMenuData);
    expect(greeting).toBeDefined();
    expect(typeof greeting).toBe('string');
  });

  it('should build context correctly', () => {
    const context = chef._buildContext(mockMenuData, []);
    expect(context).toContain('italian');
    expect(context).toContain('mid-range');
    expect(context).toContain('APPETIZERS');
  });

  it('should include conversation history in context', () => {
    const history = [
      { role: 'chef', content: 'Hello', timestamp: new Date() },
      { role: 'user', content: 'Hi there', timestamp: new Date() },
    ];
    const context = chef._buildContext(mockMenuData, history);
    expect(context).toContain('CONVERSATION HISTORY');
    expect(context).toContain('Hello');
  });

  it('should handle user messages', async () => {
    const response = await chef.handleUserMessage(
      'Can you help improve the menu?',
      mockMenuData,
      []
    );
    expect(response).toBeDefined();
    expect(response.messages).toBeDefined();
    expect(Array.isArray(response.messages)).toBe(true);
  });

  it('should apply changes to menu structure', () => {
    const changes = [
      {
        type: 'modify',
        target: 'item: Bruschetta',
        newValue: {
          description: 'Fresh tomatoes, basil, and garlic on toasted bread',
        },
      },
    ];

    const updated = chef._applyChanges(mockMenuData, changes);
    expect(updated.structure.items[0].description).toContain('Fresh tomatoes');
  });

  it('should generate context-specific specialist prompts', async () => {
    const specialist = await chef._generateSpecialistAgent(
      'Design specialist for cluttered Italian menu',
      'Menu has too many items and poor readability',
      mockMenuData,
      []
    );

    expect(specialist.type).toBe('Design specialist for cluttered Italian menu');
    expect(specialist.context).toContain('too many items');
    expect(specialist.menuData).toBe(mockMenuData);
  });
});
