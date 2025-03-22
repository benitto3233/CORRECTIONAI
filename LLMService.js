const axios = require('axios');

class LLMService {
  constructor(apiKey, provider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
    this.baseURL = this._getBaseURL();
    this.model = this._getDefaultModel();
  }

  /**
   * Obtient l'URL de base pour l'API selon le fournisseur
   * @returns {string} - URL de base
   * @private
   */
  _getBaseURL() {
    switch (this.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'gemini':
        return 'https://generativelanguage.googleapis.com/v1beta';
      case 'anthropic':
        return 'https://api.anthropic.com/v1';
      case 'deepseek':
        return 'https://api.deepseek.com/v1';
      default:
        throw new Error(`Fournisseur LLM non pris en charge: ${this.provider}`);
    }
  }

  /**
   * Obtient le modèle par défaut selon le fournisseur
   * @returns {string} - Nom du modèle
   * @private
   */
  _getDefaultModel() {
    switch (this.provider) {
      case 'openai':
        return 'gpt-4';
      case 'gemini':
        return 'gemini-pro';
      case 'anthropic':
        return 'claude-3-opus-20240229';
      case 'deepseek':
        return 'deepseek-r1-v3';
      default:
        throw new Error(`Fournisseur LLM non pris en charge: ${this.provider}`);
    }
  }

  /**
   * Configure les en-têtes pour la requête API
   * @returns {Object} - En-têtes HTTP
   * @private
   */
  _getHeaders() {
    switch (this.provider) {
      case 'openai':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };
      case 'gemini':
        return {
          'Content-Type': 'application/json'
        };
      case 'anthropic':
        return {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        };
      case 'deepseek':
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        };
      default:
        throw new Error(`Fournisseur LLM non pris en charge: ${this.provider}`);
    }
  }

  /**
   * Formate la requête selon le fournisseur
   * @param {string} prompt - Texte de la requête
   * @param {Object} options - Options supplémentaires
   * @returns {Object} - Corps de la requête formaté
   * @private
   */
  _formatRequest(prompt, options = {}) {
    const { temperature = 0.7, maxTokens = 1000 } = options;
    
    switch (this.provider) {
      case 'openai':
        return {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        };
      case 'gemini':
        return {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        };
      case 'anthropic':
        return {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        };
      case 'deepseek':
        return {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        };
      default:
        throw new Error(`Fournisseur LLM non pris en charge: ${this.provider}`);
    }
  }

  /**
   * Extrait la réponse selon le fournisseur
   * @param {Object} response - Réponse de l'API
   * @returns {string} - Texte de la réponse
   * @private
   */
  _extractResponse(response) {
    switch (this.provider) {
      case 'openai':
        return response.data.choices[0].message.content;
      case 'gemini':
        return response.data.candidates[0].content.parts[0].text;
      case 'anthropic':
        return response.data.content[0].text;
      case 'deepseek':
        return response.data.choices[0].message.content;
      default:
        throw new Error(`Fournisseur LLM non pris en charge: ${this.provider}`);
    }
  }

  /**
   * Envoie une requête au modèle de langage
   * @param {string} prompt - Texte de la requête
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<string>} - Réponse du modèle
   */
  async generateText(prompt, options = {}) {
    try {
      let url = '';
      let params = {};
      
      // Configurer l'URL et les paramètres selon le fournisseur
      switch (this.provider) {
        case 'openai':
          url = `${this.baseURL}/chat/completions`;
          break;
        case 'gemini':
          url = `${this.baseURL}/models/${this.model}:generateContent?key=${this.apiKey}`;
          break;
        case 'anthropic':
          url = `${this.baseURL}/messages`;
          break;
        case 'deepseek':
          url = `${this.baseURL}/chat/completions`;
          break;
        default:
          throw new Error(`Fournisseur LLM non pris en charge: ${this.provider}`);
      }
      
      const requestData = this._formatRequest(prompt, options);
      const headers = this._getHeaders();
      
      const response = await axios.post(url, requestData, { headers });
      return this._extractResponse(response);
    } catch (error) {
      console.error('Erreur lors de la génération de texte:', error);
      throw error;
    }
  }

  /**
   * Génère une notation pour un travail d'élève
   * @param {string} studentWork - Texte du travail de l'élève
   * @param {string} rubric - Critères de notation
   * @param {string} instructions - Instructions supplémentaires
   * @returns {Promise<Object>} - Résultat de la notation
   */
  async gradeAssignment(studentWork, rubric, instructions = '') {
    try {
      const prompt = `
Tu es un assistant de notation pour les enseignants. Ton rôle est d'évaluer le travail d'un élève selon les critères fournis.

Travail de l'élève:
${studentWork}

Critères de notation:
${rubric}

Instructions supplémentaires:
${instructions}

Évalue le travail et fournis:
1. Une note globale sur 100
2. Des commentaires détaillés sur les points forts et les points à améliorer
3. Une évaluation pour chaque critère de la rubrique
4. Des suggestions spécifiques pour l'amélioration

Réponds au format JSON avec les champs suivants:
{
  "score": (note sur 100),
  "feedback": "(commentaires généraux)",
  "criteriaEvaluations": [
    {
      "criteriaName": "(nom du critère)",
      "score": (note pour ce critère),
      "feedback": "(commentaires spécifiques)"
    }
  ],
  "improvementSuggestions": ["suggestion 1", "suggestion 2", ...]
}
`;

      const response = await this.generateText(prompt, { temperature: 0.3 });
      
      // Analyser la réponse JSON
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Erreur lors de l\'analyse de la réponse JSON:', parseError);
        // Tenter d'extraire un JSON valide de la réponse
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Impossible d\'analyser la réponse du modèle');
      }
    } catch (error) {
      console.error('Erreur lors de la notation du travail:', error);
      throw error;
    }
  }

  /**
   * Génère du matériel pédagogique
   * @param {string} type - Type de matériel (devoir, examen, rubrique)
   * @param {string} title - Titre du matériel
   * @param {string} instructions - Instructions supplémentaires
   * @returns {Promise<Object>} - Matériel généré
   */
  async generateEducationalMaterial(type, title, instructions = '') {
    try {
      let prompt = `
Tu es un assistant pédagogique pour les enseignants. Ton rôle est de créer du matériel pédagogique de haute qualité.

Type de matériel: ${type}
Titre: ${title}
Instructions supplémentaires: ${instructions}

`;

      if (type === 'homework') {
        prompt += `
Crée un devoir complet avec:
1. Une introduction au sujet
2. Des objectifs d'apprentissage clairs
3. 5-7 questions ou exercices variés
4. Des instructions détaillées pour chaque question
5. Un barème de notation suggéré

Réponds au format JSON avec les champs suivants:
{
  "title": "${title}",
  "introduction": "(texte d'introduction)",
  "learningObjectives": ["objectif 1", "objectif 2", ...],
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "(texte de la question)",
      "instructions": "(instructions)",
      "pointsValue": (nombre de points)
    }
  ],
  "totalPoints": (total des points)
}
`;
      } else if (type === 'exam') {
        prompt += `
Crée un examen complet avec:
1. Une page de garde avec titre et instructions
2. 3-4 sections différentes (QCM, réponses courtes, problèmes, etc.)
3. Un total de 15-20 questions
4. Un barème de notation détaillé
5. Un temps recommandé pour chaque section

Réponds au format JSON avec les champs suivants:
{
  "title": "${title}",
  "duration": "(durée recommandée)",
  "instructions": "(instructions générales)",
  "sections": [
    {
      "sectionTitle": "(titre de la section)",
      "sectionInstructions": "(instructions)",
      "questions": [
        {
          "type": "(type de question: multiple_choice, short_answer, etc.)",
          "questionText": "(texte de la question)",
          "options": ["option 1", "option 2", ...] (pour les QCM),
          "correctAnswer": "(réponse correcte)",
          "pointsValue": (nombre de points)
        }
      ]
    }
  ],
  "totalPoints": (total des points)
}
`;
      } else if (type === 'rubric') {
        prompt += `
Crée une rubrique d'évaluation complète avec:
1. 4-6 critères d'évaluation
2. 4 niveaux de performance pour chaque critère
3. Des descripteurs détaillés pour chaque niveau
4. Une pondération suggérée pour chaque critère

Réponds au format JSON avec les champs suivants:
{
  "title": "${title}",
  "criteria": [
    {
      "criteriaName": "(nom du critère)",
      "weight": (pourcentage de pondération),
      "levels": [
        {
          "level": "Excellent",
          "description": "(description détaillée)",
          "pointsRange": "(plage de points)"
        },
        {
          "level": "Satisfaisant",
          "description": "(description détaillée)",
          "pointsRange": "(plage de points)"
        },
        {
          "level": "Besoin d'amélioration",
          "description": "(description détaillée)",
          "pointsRange": "(plage de points)"
        },
        {
          "level": "Insuffisant",
          "description": "(description détaillée)",
          "pointsRange": "(plage de points)"
        }
      ]
    }
  ]
}
`;
      }

      const response = await this.generateText(prompt, { temperature: 0.7, maxTokens: 2000 });
      
      // Analyser la réponse JSON
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Erreur lors de l\'analyse de la réponse JSON:', parseError);
        // Tenter d'extraire un JSON valide de la réponse
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Impossible d\'analyser la réponse du modèle');
      }
    } catch (error) {
      console.error('Erreur lors de la génération de matériel pédagogique:', error);
      throw error;
    }
  }
}

module.exports = LLMService;
