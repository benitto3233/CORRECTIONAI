const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { logger } = require('../utils/logger');
const CacheService = require('./CacheService');

/**
 * Service de reconnaissance optique de caractu00e8res (OCR)
 * Extrait le texte des images et des documents PDF
 */
class OCRService {
  constructor(config = {}) {
    const {
      azureKey = process.env.AZURE_COMPUTER_VISION_KEY,
      azureEndpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT,
      cacheService = null,
      cacheTTL = 86400 // 24 heures par du00e9faut
    } = config;

    this.azureKey = azureKey;
    this.azureEndpoint = azureEndpoint;
    this.cacheService = cacheService || new CacheService();
    this.cacheTTL = cacheTTL;
  }

  /**
   * Extrait le texte d'une image u00e0 l'aide d'Azure Computer Vision
   * @param {string} imagePath - Chemin de l'image u00e0 analyser
   * @param {Object} options - Options supplu00e9mentaires
   * @returns {Promise<Object>} Texte extrait et mu00e9tadonnu00e9es
   */
  async extractTextFromImage(imagePath, options = {}) {
    const {
      language = 'fr',
      useCache = true,
      detectHandwriting = true
    } = options;

    // Vu00e9rifier si l'image existe
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image non trouvu00e9e: ${imagePath}`);
    }

    // Gu00e9nu00e9rer une clu00e9 de cache unique
    const imageStats = fs.statSync(imagePath);
    const cacheKey = `ocr_image_${imagePath}_${imageStats.size}_${imageStats.mtime.getTime()}`;

    // Vu00e9rifier le cache si activu00e9
    if (useCache && this.cacheService) {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug(`Ru00e9sultat OCR ru00e9cupu00e9ru00e9 du cache pour ${imagePath}`);
        return cachedResult;
      }
    }

    try {
      // Pru00e9parer l'URL de l'API
      const apiUrl = detectHandwriting 
        ? `${this.azureEndpoint}/vision/v3.2/read/analyze` 
        : `${this.azureEndpoint}/vision/v3.2/ocr?language=${language}`;

      // Lire le fichier image
      const imageData = fs.readFileSync(imagePath);

      // Configurer les en-tu00eates
      const headers = {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': this.azureKey
      };

      // Envoyer la requu00eate u00e0 Azure
      const response = await axios.post(apiUrl, imageData, { headers });

      let result;

      if (detectHandwriting) {
        // Pour Read API (reconnaissance d'u00e9criture manuscrite), nous devons suivre une opu00e9ration asynchrone
        const operationLocation = response.headers['operation-location'];
        
        if (!operationLocation) {
          throw new Error('Aucun lien d\'opu00e9ration reu00e7u d\'Azure');
        }

        // Attendre que l'analyse soit terminu00e9e
        result = await this._pollReadResult(operationLocation);
      } else {
        // Pour OCR standard, le ru00e9sultat est retournu00e9 directement
        result = response.data;
      }

      // Traiter le ru00e9sultat
      const extractedText = this._processOCRResult(result, detectHandwriting);

      // Mettre en cache le ru00e9sultat
      if (useCache && this.cacheService) {
        await this.cacheService.set(cacheKey, extractedText, this.cacheTTL);
      }

      return extractedText;
    } catch (error) {
      logger.error(`Erreur lors de l'extraction du texte: ${error.message}`, { error });
      throw new Error(`u00c9chec de l'OCR: ${error.message}`);
    }
  }

  /**
   * Extrait le texte d'un PDF u00e0 l'aide d'une combinaison de bibliothu00e8ques
   * @param {string} pdfPath - Chemin du PDF u00e0 analyser
   * @param {Object} options - Options supplu00e9mentaires
   * @returns {Promise<Object>} Texte extrait et mu00e9tadonnu00e9es
   */
  async extractTextFromPDF(pdfPath, options = {}) {
    const {
      language = 'fr',
      useCache = true,
      pagesLimit = 20
    } = options;

    // Vu00e9rifier si le PDF existe
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF non trouvu00e9: ${pdfPath}`);
    }

    // Gu00e9nu00e9rer une clu00e9 de cache unique
    const pdfStats = fs.statSync(pdfPath);
    const cacheKey = `ocr_pdf_${pdfPath}_${pdfStats.size}_${pdfStats.mtime.getTime()}`;

    // Vu00e9rifier le cache si activu00e9
    if (useCache && this.cacheService) {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug(`Ru00e9sultat OCR ru00e9cupu00e9ru00e9 du cache pour ${pdfPath}`);
        return cachedResult;
      }
    }

    // Note: Dans une implu00e9mentation ru00e9elle, nous utiliserions une bibliothu00e8que comme pdf.js
    // pour convertir les pages du PDF en images, puis utiliserions extractTextFromImage
    // pour chaque page. Pour cette du00e9monstration, nous simulons ce processus.

    try {
      // Simulation de l'extraction de texte d'un PDF
      logger.info(`Extraction de texte du PDF: ${pdfPath}`);

      // Ru00e9sultat simulu00e9
      const result = {
        pages: [],
        totalPages: Math.min(Math.floor(Math.random() * 15) + 1, pagesLimit),
        metadata: {
          filename: pdfPath.split('/').pop(),
          language,
          processedAt: new Date().toISOString()
        }
      };

      // Simuler des donnu00e9es pour chaque page
      for (let i = 0; i < result.totalPages; i++) {
        result.pages.push({
          pageNumber: i + 1,
          text: `Contenu de la page ${i + 1} du document ${pdfPath.split('/').pop()}.`,
          confidence: Math.random() * 0.3 + 0.7 // 70-100% de confiance
        });
      }

      // Mettre en cache le ru00e9sultat
      if (useCache && this.cacheService) {
        await this.cacheService.set(cacheKey, result, this.cacheTTL);
      }

      return result;
    } catch (error) {
      logger.error(`Erreur lors de l'extraction du texte du PDF: ${error.message}`, { error });
      throw new Error(`u00c9chec de l'OCR sur PDF: ${error.message}`);
    }
  }

  /**
   * Vu00e9rifie pu00e9riodiquement le ru00e9sultat d'une opu00e9ration Read API
   * @private
   * @param {string} operationLocation - URL pour vu00e9rifier le statut de l'opu00e9ration
   * @returns {Promise<Object>} Ru00e9sultat final de l'opu00e9ration
   */
  async _pollReadResult(operationLocation) {
    const headers = {
      'Ocp-Apim-Subscription-Key': this.azureKey
    };

    let result = { status: 'notStarted' };
    const startTime = Date.now();
    const timeoutMs = 120000; // 2 minutes max

    while (result.status !== 'succeeded' && result.status !== 'failed') {
      // Vu00e9rifier le timeout
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Timeout lors de l\'attente du ru00e9sultat OCR');
      }

      // Attendre avant de ru00e9essayer
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Vu00e9rifier le statut
      const response = await axios.get(operationLocation, { headers });
      result = response.data;

      if (result.status === 'failed') {
        throw new Error('L\'opu00e9ration OCR a u00e9chouu00e9');
      }
    }

    return result;
  }

  /**
   * Traite le ru00e9sultat brut de l'OCR pour extraire le texte et les mu00e9tadonnu00e9es
   * @private
   * @param {Object} result - Ru00e9sultat brut de l'API OCR
   * @param {boolean} isReadAPI - Indique si le ru00e9sultat provient de la Read API
   * @returns {Object} Texte structuru00e9 et mu00e9tadonnu00e9es
   */
  _processOCRResult(result, isReadAPI) {
    if (isReadAPI) {
      // Traitement du ru00e9sultat de la Read API (reconnaissance d'u00e9criture manuscrite)
      const readResults = result.analyzeResult?.readResults || [];
      
      const extractedText = {
        text: '',
        lines: [],
        confidence: 0,
        isHandwritten: true,
        words: [],
        metadata: {
          processedAt: new Date().toISOString(),
          model: 'Azure Computer Vision Read API v3.2'
        }
      };

      let totalConfidence = 0;
      let wordCount = 0;

      readResults.forEach(page => {
        page.lines?.forEach(line => {
          extractedText.lines.push({
            text: line.text,
            boundingBox: line.boundingBox,
            words: line.words?.length || 0
          });

          extractedText.text += line.text + '\n';

          line.words?.forEach(word => {
            extractedText.words.push({
              text: word.text,
              confidence: word.confidence,
              boundingBox: word.boundingBox
            });

            totalConfidence += word.confidence;
            wordCount++;
          });
        });
      });

      // Calculer la confiance moyenne
      if (wordCount > 0) {
        extractedText.confidence = totalConfidence / wordCount;
      }

      return extractedText;
    } else {
      // Traitement du ru00e9sultat de l'API OCR standard
      const regions = result.regions || [];
      
      const extractedText = {
        text: '',
        lines: [],
        confidence: 0,
        isHandwritten: false,
        words: [],
        metadata: {
          language: result.language,
          orientation: result.orientation,
          processedAt: new Date().toISOString(),
          model: 'Azure Computer Vision OCR API v3.2'
        }
      };

      let totalConfidence = 0;
      let wordCount = 0;

      regions.forEach(region => {
        region.lines?.forEach(line => {
          let lineText = '';
          
          line.words?.forEach(word => {
            lineText += word.text + ' ';
            extractedText.words.push({
              text: word.text,
              confidence: word.confidence,
              boundingBox: word.boundingBox
            });

            totalConfidence += parseFloat(word.confidence);
            wordCount++;
          });

          lineText = lineText.trim();
          extractedText.lines.push({
            text: lineText,
            boundingBox: line.boundingBox,
            words: line.words?.length || 0
          });

          extractedText.text += lineText + '\n';
        });
      });

      // Calculer la confiance moyenne
      if (wordCount > 0) {
        extractedText.confidence = totalConfidence / wordCount;
      }

      return extractedText;
    }
  }

  /**
   * Analyse une image pour du00e9tecter des dessins, schu00e9mas ou diagrammes
   * @param {string} imagePath - Chemin de l'image u00e0 analyser
   * @param {Object} options - Options supplu00e9mentaires
   * @returns {Promise<Object>} Ru00e9sultat de l'analyse
   */
  async analyzeImageContent(imagePath, options = {}) {
    const {
      useCache = true,
      features = ['objects', 'tags', 'description']
    } = options;

    // Vu00e9rifier si l'image existe
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image non trouvu00e9e: ${imagePath}`);
    }

    // Gu00e9nu00e9rer une clu00e9 de cache unique
    const imageStats = fs.statSync(imagePath);
    const cacheKey = `image_analysis_${imagePath}_${imageStats.size}_${imageStats.mtime.getTime()}_${features.join('-')}`;

    // Vu00e9rifier le cache si activu00e9
    if (useCache && this.cacheService) {
      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        logger.debug(`Ru00e9sultat d'analyse d'image ru00e9cupu00e9ru00e9 du cache pour ${imagePath}`);
        return cachedResult;
      }
    }

    try {
      // Pru00e9parer l'URL de l'API
      const apiUrl = `${this.azureEndpoint}/vision/v3.2/analyze?${features.map(f => `visualFeatures=${f}`).join('&')}`;

      // Lire le fichier image
      const imageData = fs.readFileSync(imagePath);

      // Configurer les en-tu00eates
      const headers = {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': this.azureKey
      };

      // Envoyer la requu00eate u00e0 Azure
      const response = await axios.post(apiUrl, imageData, { headers });
      const result = response.data;

      // Traiter le ru00e9sultat pour l'adapter u00e0 nos besoins
      const analysisResult = {
        description: result.description?.captions?.[0]?.text || '',
        confidence: result.description?.captions?.[0]?.confidence || 0,
        tags: result.tags || [],
        objects: result.objects || [],
        isDiagram: false, // Azure ne du00e9tecte pas spu00e9cifiquement les diagrammes
        isChart: false,  // Nous devrons l'infu00e9rer u00e0 partir des tags ou objets
        metadata: {
          processedAt: new Date().toISOString(),
          imageSize: imageStats.size,
          model: 'Azure Computer Vision Analysis API v3.2'
        }
      };

      // Infu00e9rer le type de contenu u00e0 partir des tags
      const tagTexts = result.tags?.map(t => t.name.toLowerCase()) || [];
      
      if (tagTexts.some(t => ['diagram', 'chart', 'graph', 'schematic'].includes(t))) {
        if (tagTexts.includes('diagram') || tagTexts.includes('schematic')) {
          analysisResult.isDiagram = true;
        }
        
        if (tagTexts.includes('chart') || tagTexts.includes('graph')) {
          analysisResult.isChart = true;
        }
      }

      // Mettre en cache le ru00e9sultat
      if (useCache && this.cacheService) {
        await this.cacheService.set(cacheKey, analysisResult, this.cacheTTL);
      }

      return analysisResult;
    } catch (error) {
      logger.error(`Erreur lors de l'analyse de l'image: ${error.message}`, { error });
      throw new Error(`u00c9chec de l'analyse d'image: ${error.message}`);
    }
  }
}

module.exports = OCRService;
