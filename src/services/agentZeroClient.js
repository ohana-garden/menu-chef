/**
 * Client for communicating with Agent Zero API
 */

const AGENT_ZERO_URL = import.meta.env.VITE_AGENT_ZERO_URL || 'http://localhost:50001';

export class AgentZeroClient {
  constructor() {
    this.baseURL = AGENT_ZERO_URL;
    this.sessionId = null;
  }

  async sendMessage(message, context = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          session_id: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent Zero API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.session_id && !this.sessionId) {
        this.sessionId = data.session_id;
      }

      return data;
    } catch (error) {
      console.error('Agent Zero communication error:', error);
      throw error;
    }
  }

  async startChefAgent(menuData) {
    const context = {
      role: 'chef',
      menuData,
      task: 'analyze_and_improve_menu',
    };

    const message = `You are the Chef Agent. A restaurant menu has been uploaded with the following analysis:

Cuisine: ${menuData.context.cuisineType}
Restaurant Type: ${menuData.context.restaurantType}
Price Range: ${menuData.context.priceRange.category} ($${menuData.context.priceRange.min} - $${menuData.context.priceRange.max})
Items: ${menuData.metadata.itemCount}
Sections: ${menuData.metadata.sectionCount}

Problems identified:
${menuData.context.currentProblems.map(p => `- [${p.severity}] ${p.description}`).join('\n')}

Strengths:
${menuData.context.strengths.map(s => `- ${s}`).join('\n')}

Please greet the user and provide your initial analysis. Then, if appropriate, spawn a context-specific specialist agent to address the most critical issue.`;

    return await this.sendMessage(message, context);
  }

  async continueConversation() {
    const message = "Please continue the conversation and take the next appropriate action. If needed, spawn a specialist agent or make recommendations.";
    return await this.sendMessage(message, { role: 'chef', action: 'continue' });
  }

  async handleUserInput(userMessage, menuData) {
    const context = {
      role: 'chef',
      menuData,
      userInput: true,
    };

    return await this.sendMessage(userMessage, context);
  }

  async spawnSpecialist(specialistType, specialistContext, menuData) {
    const message = `SPAWN_AGENT:
Type: ${specialistType}
Context: ${specialistContext}
Menu Data: ${JSON.stringify(menuData, null, 2)}

Please instantiate this specialist agent and have them provide their analysis and recommendations.`;

    return await this.sendMessage(message, { role: 'spawn', specialistType });
  }

  parseAgentResponse(response) {
    // Parse Agent Zero response to extract:
    // - Agent messages
    // - Specialist spawning events
    // - Menu change proposals

    const parsed = {
      messages: [],
      agentSpawned: null,
      changeProposed: false,
      changes: null,
    };

    if (response.message) {
      // Check for SPAWN_AGENT command
      const spawnMatch = response.message.match(/SPAWN_AGENT:\s*\nType:\s*(.+)\nContext:\s*(.+)/s);
      if (spawnMatch) {
        parsed.agentSpawned = {
          type: spawnMatch[1].trim(),
          context: spawnMatch[2].split('\n')[0].trim(),
        };
      }

      // Extract messages
      parsed.messages.push({
        role: response.agent_type || 'chef',
        content: response.message,
        timestamp: new Date(),
      });
    }

    return parsed;
  }

  reset() {
    this.sessionId = null;
  }
}

export default new AgentZeroClient();
