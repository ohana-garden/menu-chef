import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODEL = 'claude-sonnet-4-20250514';

/**
 * Chef Agent - Persistent coordinator that analyzes menus and generates
 * context-specific specialist agents on demand
 */
export class ChefAgent {
  async greet(menuData) {
    const context = this._buildContext(menuData, []);

    const prompt = `You are the Chef Agent, an expert in restaurant menus, food pricing, and operations.

You've been presented with a restaurant menu to analyze and improve. Here's what you know:

${context}

Your job:
1. Greet the user warmly
2. Provide a brief analysis of the menu (2-3 key observations)
3. Explain that you'll be working with specialist agents to improve the menu
4. Ask if they have any specific goals or concerns

Keep your greeting concise and professional. You are starting a collaborative conversation.`;

    const response = await this._callClaude([
      { role: 'user', content: prompt }
    ]);

    return response;
  }

  async continueConversation(menuData, conversationHistory) {
    const context = this._buildContext(menuData, conversationHistory);

    // Determine if we need to spawn a specialist
    const decision = await this._decideNextAction(context, menuData, conversationHistory);

    if (decision.shouldSpawnSpecialist) {
      return await this._spawnAndCoordinate(decision, menuData, conversationHistory);
    } else {
      // Chef continues the conversation
      return await this._continueAsChef(menuData, conversationHistory);
    }
  }

  async handleUserMessage(userMessage, menuData, conversationHistory) {
    const context = this._buildContext(menuData, conversationHistory);

    // Acknowledge user input and decide next action
    const prompt = `You are the Chef Agent coordinating menu improvements.

${context}

The user just said: "${userMessage}"

Analyze their input and decide:
1. Do you need to spawn a specialist agent to address their concern?
2. What specific expertise is needed?
3. How should you respond?

If spawning a specialist, respond with JSON:
{
  "shouldSpawn": true,
  "specialistType": "brief description of specialist needed",
  "specialistContext": "specific context and problem for this specialist",
  "chefResponse": "your acknowledgment to the user"
}

If handling yourself, respond with JSON:
{
  "shouldSpawn": false,
  "chefResponse": "your response to the user"
}`;

    const response = await this._callClaude([
      { role: 'user', content: prompt }
    ]);

    let decision;
    try {
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        decision = { shouldSpawn: false, chefResponse: response };
      }
    } catch {
      decision = { shouldSpawn: false, chefResponse: response };
    }

    if (decision.shouldSpawn) {
      // Spawn specialist and coordinate
      return await this._spawnSpecialist(
        decision.specialistType,
        decision.specialistContext,
        menuData,
        conversationHistory,
        decision.chefResponse
      );
    } else {
      return {
        messages: [
          {
            role: 'chef',
            content: decision.chefResponse,
            timestamp: new Date(),
          }
        ],
        menuUpdated: false,
      };
    }
  }

  async _decideNextAction(context, menuData, conversationHistory) {
    // Only continue conversation if there have been recent messages
    const recentMessages = conversationHistory.slice(-3);

    if (recentMessages.length === 0) {
      return { shouldSpawnSpecialist: false };
    }

    const prompt = `You are the Chef Agent analyzing the current conversation state.

${context}

Based on the menu analysis and conversation, decide if you should:
1. Spawn a context-specific specialist agent to address identified issues
2. Continue the conversation yourself

If you decide to spawn a specialist, provide:
- What type of specialist is needed (be VERY specific to this menu's context)
- What specific problem they should solve
- Why this specialist is needed now

Respond with JSON:
{
  "shouldSpawnSpecialist": true/false,
  "reason": "explanation",
  "specialistType": "specific description" (if spawning),
  "specialistContext": "the specific problem in context" (if spawning)
}`;

    const response = await this._callClaude([
      { role: 'user', content: prompt }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Default to not spawning
    }

    return { shouldSpawnSpecialist: false };
  }

  async _spawnAndCoordinate(decision, menuData, conversationHistory) {
    return await this._spawnSpecialist(
      decision.specialistType,
      decision.specialistContext,
      menuData,
      conversationHistory,
      `I'm going to bring in a specialist to help with this. Let me summon ${decision.specialistType}.`
    );
  }

  async _spawnSpecialist(specialistType, specialistContext, menuData, conversationHistory, chefIntro) {
    // Generate the specialist agent with full context
    const specialist = await this._generateSpecialistAgent(
      specialistType,
      specialistContext,
      menuData,
      conversationHistory
    );

    // Get specialist's analysis and recommendations
    const specialistResponse = await this._getSpecialistResponse(
      specialist,
      menuData,
      conversationHistory
    );

    // Coordinate between chef and specialist
    const coordination = await this._coordinateDiscussion(
      specialistResponse,
      menuData,
      conversationHistory
    );

    const messages = [
      {
        role: 'chef',
        content: chefIntro,
        timestamp: new Date(),
      },
      {
        role: 'specialist',
        agentType: specialistType,
        content: specialistResponse.greeting,
        timestamp: new Date(),
      },
      {
        role: 'specialist',
        agentType: specialistType,
        content: specialistResponse.analysis,
        timestamp: new Date(),
      }
    ];

    if (coordination.agreement) {
      messages.push({
        role: 'chef',
        content: coordination.chefResponse,
        timestamp: new Date(),
      });

      if (coordination.shouldApplyChanges) {
        messages.push({
          role: 'system',
          content: 'Applying agreed changes to menu...',
          timestamp: new Date(),
        });
      }
    }

    return {
      messages,
      menuUpdated: coordination.shouldApplyChanges,
      updatedMenu: coordination.updatedMenu || menuData,
      agentSpawned: {
        type: specialistType,
        context: specialistContext,
      },
    };
  }

  async _generateSpecialistAgent(specialistType, specialistContext, menuData, conversationHistory) {
    // This generates a context-specific specialist prompt
    return {
      type: specialistType,
      context: specialistContext,
      menuData,
      conversationHistory,
      createdAt: new Date(),
    };
  }

  async _getSpecialistResponse(specialist, menuData, conversationHistory) {
    const context = this._buildContext(menuData, conversationHistory);

    const prompt = `You are a ${specialist.type}.

FULL CONTEXT:
${context}

SPECIFIC PROBLEM TO SOLVE:
${specialist.context}

Your role:
1. Introduce yourself briefly (1 sentence) explaining your specific expertise for THIS menu
2. Provide detailed analysis of the specific problem
3. Make 2-4 concrete, actionable recommendations
4. Explain the expected impact of each recommendation

Be specific to this menu's context. Don't give generic advice.

Respond in this format:
GREETING: [your introduction]
---
ANALYSIS: [your detailed analysis]
---
RECOMMENDATIONS: [your specific recommendations]`;

    const response = await this._callClaude([
      { role: 'user', content: prompt }
    ]);

    // Parse the response
    const parts = response.split('---').map(p => p.trim());

    return {
      greeting: parts[0]?.replace('GREETING:', '').trim() || 'Hello, I\'m here to help.',
      analysis: parts[1]?.replace('ANALYSIS:', '').trim() || response,
      recommendations: parts[2]?.replace('RECOMMENDATIONS:', '').trim() || '',
    };
  }

  async _coordinateDiscussion(specialistResponse, menuData, conversationHistory) {
    const context = this._buildContext(menuData, conversationHistory);

    const prompt = `You are the Chef Agent reviewing a specialist's recommendations.

${context}

SPECIALIST'S ANALYSIS:
${specialistResponse.analysis}

SPECIALIST'S RECOMMENDATIONS:
${specialistResponse.recommendations}

As the Chef, decide:
1. Do you agree with these recommendations?
2. Should we apply these changes to the menu?
3. What changes specifically should be made?

Respond with JSON:
{
  "agreement": true/false,
  "chefResponse": "your response to the specialist and user",
  "shouldApplyChanges": true/false,
  "changes": [
    {
      "type": "add/modify/remove",
      "target": "what to change",
      "newValue": "the new value"
    }
  ]
}`;

    const response = await this._callClaude([
      { role: 'user', content: prompt }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const coordination = JSON.parse(jsonMatch[0]);

        if (coordination.shouldApplyChanges && coordination.changes) {
          const updatedMenu = this._applyChanges(menuData, coordination.changes);
          return { ...coordination, updatedMenu };
        }

        return coordination;
      }
    } catch (e) {
      console.error('Failed to parse coordination response:', e);
    }

    return {
      agreement: true,
      chefResponse: response,
      shouldApplyChanges: false,
    };
  }

  async _continueAsChef(menuData, conversationHistory) {
    const context = this._buildContext(menuData, conversationHistory);

    const prompt = `You are the Chef Agent continuing the conversation.

${context}

Continue the discussion about menu improvements. Consider:
1. What has been discussed so far
2. What improvements have been suggested
3. Whether to invite user feedback

Keep it conversational and brief (2-3 sentences).`;

    const response = await this._callClaude([
      { role: 'user', content: prompt }
    ]);

    return {
      messages: [
        {
          role: 'chef',
          content: response,
          timestamp: new Date(),
        }
      ],
      menuUpdated: false,
    };
  }

  _buildContext(menuData, conversationHistory) {
    const ctx = menuData.context;

    let context = `MENU ANALYSIS:
- Cuisine Type: ${ctx.cuisineType}
- Restaurant Type: ${ctx.restaurantType}
- Price Range: ${ctx.priceRange.category} ($${ctx.priceRange.min} - $${ctx.priceRange.max}, avg: $${ctx.priceRange.average})
- Item Count: ${menuData.metadata.itemCount}
- Section Count: ${menuData.metadata.sectionCount}
- Target Audience: ${ctx.targetAudience.join(', ')}

IDENTIFIED PROBLEMS:
${ctx.currentProblems.map(p => `- [${p.severity}] ${p.description}`).join('\n')}

STRENGTHS:
${ctx.strengths.map(s => `- ${s}`).join('\n')}

MENU STRUCTURE:
${menuData.structure.sections.map(s => `- ${s.name} (${s.items.length} items)`).join('\n')}
`;

    if (conversationHistory.length > 0) {
      context += `\n\nCONVERSATION HISTORY (last 5 messages):\n`;
      const recent = conversationHistory.slice(-5);
      recent.forEach(msg => {
        const role = msg.role === 'specialist' ? `${msg.agentType}` : msg.role;
        context += `[${role}]: ${msg.content.substring(0, 200)}...\n`;
      });
    }

    return context;
  }

  _applyChanges(menuData, changes) {
    // Create a deep copy
    const updated = JSON.parse(JSON.stringify(menuData));

    for (const change of changes) {
      try {
        if (change.type === 'modify' && change.target && change.newValue) {
          // Simple text replacement in menu structure
          if (change.target.includes('section')) {
            const sectionName = change.target.replace('section:', '').trim();
            const section = updated.structure.sections.find(s =>
              s.name.toLowerCase().includes(sectionName.toLowerCase())
            );
            if (section && change.newValue.name) {
              section.name = change.newValue.name;
            }
          } else if (change.target.includes('item')) {
            // Modify item
            const itemName = change.target.replace('item:', '').trim();
            const item = updated.structure.items.find(i =>
              i.name.toLowerCase().includes(itemName.toLowerCase())
            );
            if (item) {
              if (change.newValue.name) item.name = change.newValue.name;
              if (change.newValue.description) item.description = change.newValue.description;
              if (change.newValue.price) item.prices = [parseFloat(change.newValue.price)];
            }
          }
        } else if (change.type === 'add') {
          // Add new item or section
          if (change.target === 'section' && change.newValue) {
            updated.structure.sections.push({
              name: change.newValue.name,
              items: [],
              startIndex: updated.structure.sections.length,
            });
          }
        } else if (change.type === 'remove') {
          // Remove item or section
          if (change.target.includes('section')) {
            const sectionName = change.target.replace('section:', '').trim();
            updated.structure.sections = updated.structure.sections.filter(s =>
              !s.name.toLowerCase().includes(sectionName.toLowerCase())
            );
          }
        }
      } catch (e) {
        console.error('Error applying change:', change, e);
      }
    }

    return updated;
  }

  async _callClaude(messages) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        messages,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);

      // Graceful fallback
      if (error.status === 401) {
        return 'I apologize, but I\'m having trouble connecting to my AI service. Please check that the ANTHROPIC_API_KEY is set correctly.';
      }

      return 'I encountered an error processing your request. Please try again.';
    }
  }
}
