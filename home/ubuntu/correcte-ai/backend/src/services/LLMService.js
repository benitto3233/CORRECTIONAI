const axios = require('axios');
const { logger } = require('../utils/logger');
const CacheService = require('./CacheService');

/**
 * Service d'interface avec les grands modèles de langage (LLM)
 * Fournit des méthodes pour générer du texte, noter des travaux et analyser des contenus éducatifs
 */
class LLMService {
  constructor(config = {}) {
    const {
      openaiApiKey = process.env.OPENAI_API_KEY,
      defaultModel = 'gpt-4o',
      cacheService = null,
      cacheTTL = 3600, // 1 heure par défaut
      temperature = 0.3, // Valeur relativement faible pour des résultats plus cohérents
      systemMessageDefault = 'Vous êtes un assistant pédagogique expert pour les enseignants du primaire et secondaire.'
    } = config;

    this.openaiApiKey = openaiApiKey;
    this.defaultModel = defaultModel;
    this.temperature = temperature;
    this.systemMessageDefault = systemMessageDefault;
    this.cacheService = cacheService || new CacheService();
    this.cacheTTL = cacheTTL;
  }

  /**
   * Génère du texte à l'aide d'un LLM
   * @param {string} prompt - Consigne pour le LLM
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Texte généré et métadonnées
   */
  async generateText(prompt, options = {}) {
    const {
      model = this.defaultModel,
      temperature = this.temperature,
      systemMessage = this.systemMessageDefault,
      maxTokens = 1000,
      useCache = true,
      cachePriority = 'accuracy' // 'accuracy' ou 'performance'
    } = options;

    // Vérifier si le prompt est valide
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt invalide ou vide');
    }

    // Générer une clé de cache unique
    // Pour les prompts de génération, nous incluons le modèle et la température
    // car ils affectent significativement le résultat
    const cacheKey = `llm_gen_${model}_${temperature}_${Buffer.from(prompt).toString('base64')}`;

    // Vérifier le cache si activé
    if (useCache && this.cacheService) {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug(`Résultat LLM récupéré du cache pour prompt: ${prompt.substring(0, 50)}...`);
        return cachedResult;
      }
    }

    try {
      // Préparer les messages pour l'API OpenAI
      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ];

      // Appeler l'API OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          n: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          }
        }
      );

      // Extraire et formater le résultat
      const result = {
        text: response.data.choices[0].message.content,
        model: response.data.model,
        usage: response.data.usage,
        metadata: {
          processedAt: new Date().toISOString(),
          prompt: prompt,
          temperature: temperature
        }
      };

      // Mettre en cache le résultat
      // Si la priorité est la performance, nous mettons en cache tous les résultats
      // Si la priorité est l'exactitude, nous mettons en cache uniquement les résultats avec temperature < 0.4
      const shouldCache = cachePriority === 'performance' || (cachePriority === 'accuracy' && temperature < 0.4);

      if (useCache && shouldCache && this.cacheService) {
        await this.cacheService.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      logger.error(`Erreur lors de la génération de texte: ${error.message}`, { error });
      throw new Error(`Échec de la génération LLM: ${error.message}`);
    }
  }

  /**
   * Note un travail d'élève à l'aide d'un LLM
   * @param {Object} assignment - Travail à noter
   * @param {Object} rubric - Grille d'évaluation
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultat de notation et feedback
   */
  async gradeAssignment(assignment, rubric, options = {}) {
    const {
      model = this.defaultModel,
      detailedFeedback = true,
      language = 'french',
      useCache = true
    } = options;

    // Vérifier si les données sont valides
    if (!assignment || !assignment.content) {
      throw new Error('Contenu du travail manquant');
    }

    if (!rubric || !rubric.criteria || !rubric.criteria.length) {
      throw new Error('Grille d\'évaluation invalide ou vide');
    }

    // Générer une clé de cache unique
    // Pour la notation, nous incluons un hash du contenu et de la grille
    const assignmentHash = Buffer.from(assignment.content).toString('base64').substring(0, 20);
    const rubricHash = Buffer.from(JSON.stringify(rubric.criteria)).toString('base64').substring(0, 20);
    const cacheKey = `llm_grade_${model}_${assignmentHash}_${rubricHash}`;

    // Vérifier le cache si activé
    if (useCache && this.cacheService) {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug(`Résultat de notation récupéré du cache`);
        return cachedResult;
      }
    }

    try {
      // Construire un prompt structuré pour l'évaluation
      const criteriaText = rubric.criteria.map((criterion, index) => 
        `${index + 1}. ${criterion.name} (${criterion.weight}%): ${criterion.description}`
      ).join('\n');

      const prompt = `Évaluez le travail suivant selon la grille d'évaluation fournie.

TRAVAIL À ÉVALUER:
"""${assignment.content}"""

GRILLE D'ÉVALUATION:
${criteriaText}

Instructions:
1. Évaluez chaque critère sur une échelle de 0 à ${rubric.maxScore || 10}.
2. Fournissez une justification pour chaque note.
3. Calculez la note globale en tenant compte des pondérations.
4. ${detailedFeedback ? 'Rédigez un feedback détaillé avec des points forts et des suggestions d\'amélioration.' : 'Rédigez un bref commentaire général.'}
5. Répondez au format JSON structuré comme suit:
{
  "criteria": [
    {
      "name": "Nom du critère",
      "score": score,
      "feedback": "Justification"
    },
    ...
  ],
  "overallScore": score,
  "overallPercentage": pourcentage,
  "generalFeedback": "Commentaire général",
  "strengths": ["Point fort 1", "Point fort 2", ...],
  "improvements": ["Suggestion 1", "Suggestion 2", ...]
}`;

      // Configuration spécifique pour la notation
      const systemMessage = `Vous êtes un enseignant expérimenté spécialisé dans l'évaluation objective et précise des travaux d'élèves. Vos évaluations sont justes, constructives et formatrices. Vous analysez en profondeur les travaux selon les critères d'évaluation fournis. Répondez toujours au format JSON demandé. Votre évaluation est en ${language}.`;

      // Appeler l'API OpenAI avec une configuration spécifique pour la notation
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2, // Température plus basse pour des évaluations plus cohérentes
          max_tokens: 1500,
          n: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          }
        }
      );

      // Extraire et parser le résultat JSON
      const responseText = response.data.choices[0].message.content;
      let gradingResult;
      
      try {
        // Extraire la partie JSON de la réponse (au cas où le modèle inclut du texte avant/après)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          gradingResult = JSON.parse(jsonMatch[0]);
        } else {
          gradingResult = JSON.parse(responseText);
        }
      } catch (parseError) {
        logger.error(`Erreur lors du parsing du résultat JSON: ${parseError.message}`, {
          responseText,
          error: parseError
        });
        
        // Si le parsing échoue, nous utilisons le texte brut
        gradingResult = {
          error: 'Format JSON invalide',
          rawResponse: responseText,
          criteria: [],
          overallScore: 0,
          overallPercentage: 0,
          generalFeedback: 'Erreur lors de l\'analyse des résultats'
        };
      }

      // Ajouter des métadonnées
      const result = {
        ...gradingResult,
        metadata: {
          processedAt: new Date().toISOString(),
          model: response.data.model,
          usage: response.data.usage,
          assignmentId: assignment.id || 'unknown',
          rubricId: rubric.id || 'unknown'
        }
      };

      // Mettre en cache le résultat
      if (useCache && this.cacheService) {
        await this.cacheService.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      logger.error(`Erreur lors de la notation: ${error.message}`, { error });
      throw new Error(`Échec de la notation LLM: ${error.message}`);
    }
  }

  /**
   * Génère des exercices ou des activités pédagogiques
   * @param {Object} parameters - Paramètres de génération
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Exercices générés et métadonnées
   */
  async generateEducationalContent(parameters, options = {}) {
    const {
      subject,
      grade,
      topic,
      difficulty = 'intermediate',
      contentType = 'exercise',
      count = 3,
      language = 'french'
    } = parameters;

    const {
      model = this.defaultModel,
      temperature = 0.5, // Un peu plus de créativité pour la génération de contenu
      useCache = true
    } = options;

    // Vérifier si les paramètres essentiels sont présents
    if (!subject || !grade || !topic) {
      throw new Error('Paramètres incomplets: sujet, niveau et thème sont requis');
    }

    // Générer une clé de cache unique
    const paramsHash = Buffer.from(JSON.stringify(parameters)).toString('base64').substring(0, 30);
    const cacheKey = `llm_edu_content_${model}_${paramsHash}`;

    // Vérifier le cache si activé
    if (useCache && this.cacheService) {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug(`Contenu éducatif récupéré du cache`);
        return cachedResult;
      }
    }

    // Déterminer le type de contenu et les instructions spécifiques
    let contentTypeInstructions;
    switch(contentType) {
      case 'exercise':
        contentTypeInstructions = `${count} exercices avec énoncés clairs et solutions détaillées`;
        break;
      case 'quiz':
        contentTypeInstructions = `un quiz de ${count} questions à choix multiples avec réponses et explications`;
        break;
      case 'project':
        contentTypeInstructions = `${count} idées de projets avec objectifs, matériel nécessaire et étapes de réalisation`;
        break;
      case 'lesson':
        contentTypeInstructions = `un plan de cours complet avec introduction, activités et évaluation`;
        break;
      default:
        contentTypeInstructions = `${count} exercices avec énoncés et solutions`;
    }

    try {
      // Construire un prompt spécifique pour la génération de contenu éducatif
      const prompt = `Générez ${contentTypeInstructions} pour des élèves de ${grade} sur le thème "${topic}" en ${subject}.

Niveau de difficulté: ${difficulty}

Veuillez structurer la réponse au format JSON comme suit:
{
  "title": "Titre de l'ensemble",
  "subject": "${subject}",
  "grade": "${grade}",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "items": [
    {
      "id": "1",
      "title": "Titre de l'item",
      "content": "Contenu détaillé",
      "solution": "Solution détaillée" (si applicable),
      "instructions": "Instructions spécifiques" (si applicable),
      "resources": ["Ressource 1", "Ressource 2"] (si applicable)
    },
    ...
  ],
  "objectives": ["Objectif pédagogique 1", "Objectif pédagogique 2", ...],
  "suggestions": "Suggestions d'utilisation pour l'enseignant"
}`;

      // Configuration spécifique pour la génération de contenu éducatif
      const systemMessage = `Vous êtes un expert en pédagogie et en création de contenus éducatifs adaptés aux différents niveaux scolaires. Vos contenus sont rigoureux, clairs, progressifs et adaptés au niveau des élèves. Vous maîtrisez parfaitement les programmes scolaires et les approches pédagogiques modernes. Votre réponse est en ${language}.`;

      // Appeler l'API OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: 2500,
          n: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          }
        }
      );

      // Extraire et parser le résultat JSON
      const responseText = response.data.choices[0].message.content;
      let contentResult;
      
      try {
        // Extraire la partie JSON de la réponse
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          contentResult = JSON.parse(jsonMatch[0]);
        } else {
          contentResult = JSON.parse(responseText);
        }
      } catch (parseError) {
        logger.error(`Erreur lors du parsing du contenu JSON: ${parseError.message}`, {
          responseText,
          error: parseError
        });
        
        // Si le parsing échoue, nous utilisons le texte brut
        contentResult = {
          error: 'Format JSON invalide',
          rawResponse: responseText,
          title: `Contenu éducatif sur ${topic}`,
          items: [],
          objectives: [],
          suggestions: 'Erreur lors de l\'analyse des résultats'
        };
      }

      // Ajouter des métadonnées
      const result = {
        ...contentResult,
        metadata: {
          processedAt: new Date().toISOString(),
          model: response.data.model,
          usage: response.data.usage,
          contentType,
          language
        }
      };

      // Mettre en cache le résultat
      if (useCache && this.cacheService) {
        await this.cacheService.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      logger.error(`Erreur lors de la génération de contenu éducatif: ${error.message}`, { error });
      throw new Error(`Échec de la génération de contenu: ${error.message}`);
    }
  }

  /**
   * Analyse les performances d'un élève ou d'une classe
   * @param {Object} data - Données à analyser (travaux, notes, etc.)
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Analyse et recommandations
   */
  async analyzePerformance(data, options = {}) {
    const {
      analysisType = 'student', // 'student', 'class', 'progression'
      timespan = 'term', // 'assignment', 'week', 'month', 'term', 'year'
      metrics = ['scores', 'progress', 'strengths', 'weaknesses'],
      generateRecommendations = true,
      language = 'french'
    } = options;

    // Vérifier si les données sont valides
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error('Données d\'analyse vides ou invalides');
    }

    // Générer une clé de cache unique
    // Pour l'analyse, nous utilisons un hash des données et des options
    const dataHash = Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 20);
    const optionsHash = Buffer.from(JSON.stringify(options)).toString('base64').substring(0, 10);
    const cacheKey = `llm_analysis_${dataHash}_${optionsHash}`;

    // Vérifier le cache si activé
    if (options.useCache && this.cacheService) {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug(`Analyse de performance récupérée du cache`);
        return cachedResult;
      }
    }

    try {
      // Prétraiter les données pour les adapter au format attendu par l'API
      let processedData;
      if (Array.isArray(data)) {
        processedData = JSON.stringify(data);
      } else if (typeof data === 'object') {
        processedData = JSON.stringify(data);
      } else {
        processedData = data.toString();
      }

      // Construire un prompt spécifique pour l'analyse de performance
      let analysisInstructions;
      switch(analysisType) {
        case 'student':
          analysisInstructions = 'Analysez les performances individuelles de cet élève';
          break;
        case 'class':
          analysisInstructions = 'Analysez les performances globales de cette classe';
          break;
        case 'progression':
          analysisInstructions = 'Analysez la progression sur la période spécifiée';
          break;
        default:
          analysisInstructions = 'Analysez les performances présentées';
      }

      const metricsInstructions = metrics.map(metric => {
        switch(metric) {
          case 'scores':
            return 'les scores et statistiques clés';
          case 'progress':
            return 'l\'évolution et la progression';
          case 'strengths':
            return 'les points forts identifiés';
          case 'weaknesses':
            return 'les domaines à améliorer';
          default:
            return metric;
        }
      }).join(', ');

      const prompt = `${analysisInstructions} en identifiant ${metricsInstructions}.

DONNÉES:
"""${processedData}"""

PÉRIODE: ${timespan}

${generateRecommendations ? 'Incluez des recommandations pédagogiques personnalisées.' : ''}

Veuillez structurer la réponse au format JSON comme suit:
{
  "summary": "Résumé global de l'analyse",
  "metrics": {
    // Métriques pertinentes selon le type d'analyse
  },
  "strengths": ["Point fort 1", "Point fort 2", ...],
  "weaknesses": ["Point faible 1", "Point faible 2", ...],
  "trends": ["Tendance 1", "Tendance 2", ...],
  "recommendations": ["Recommandation 1", "Recommandation 2", ...] (si demandé)
}`;

      // Configuration spécifique pour l'analyse de performance
      const systemMessage = `Vous êtes un expert en analyse pédagogique, capable d'interpréter des données d'évaluation pour fournir des insights pertinents sur les performances des élèves. Vous êtes objectif, précis et orienté vers des recommandations concrètes et applicables. Votre analyse est en ${language}.`;

      // Appeler l'API OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: options.model || this.defaultModel,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // Température modérée pour un bon équilibre entre créativité et cohérence
          max_tokens: 2000,
          n: 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          }
        }
      );

      // Extraire et parser le résultat JSON
      const responseText = response.data.choices[0].message.content;
      let analysisResult;
      
      try {
        // Extraire la partie JSON de la réponse
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          analysisResult = JSON.parse(responseText);
        }
      } catch (parseError) {
        logger.error(`Erreur lors du parsing de l'analyse JSON: ${parseError.message}`, {
          responseText,
          error: parseError
        });
        
        // Si le parsing échoue, nous utilisons le texte brut
        analysisResult = {
          error: 'Format JSON invalide',
          rawResponse: responseText,
          summary: 'Erreur lors de l\'analyse des résultats',
          metrics: {},
          strengths: [],
          weaknesses: [],
          recommendations: []
        };
      }

      // Ajouter des métadonnées
      const result = {
        ...analysisResult,
        metadata: {
          processedAt: new Date().toISOString(),
          model: response.data.model,
          usage: response.data.usage,
          analysisType,
          timespan,
          metrics
        }
      };

      // Mettre en cache le résultat
      if (options.useCache && this.cacheService) {
        await this.cacheService.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      logger.error(`Erreur lors de l'analyse de performance: ${error.message}`, { error });
      throw new Error(`Échec de l'analyse: ${error.message}`);
    }
  }
}

module.exports = LLMService;
