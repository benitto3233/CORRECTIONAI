const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class OCRService {
  constructor(apiKey, provider = 'mistral') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  /**
   * Extrait le texte d'une image ou d'un PDF en utilisant Mistral OCR
   * @param {string} filePath - Chemin du fichier à analyser
   * @returns {Promise<string>} - Texte extrait
   */
  async extractTextFromImage(filePath) {
    try {
      // Vérifier que le fichier existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Le fichier ${filePath} n'existe pas`);
      }

      // Créer un FormData pour l'envoi du fichier
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      // Configuration de la requête selon le fournisseur
      let response;
      
      if (this.provider === 'mistral') {
        response = await axios.post(
          'https://api.mistral.ai/v1/ocr',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${this.apiKey}`
            }
          }
        );
        
        return response.data.text;
      } else if (this.provider === 'google') {
        // Implémentation pour Google Cloud Vision API
        response = await axios.post(
          `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
          {
            requests: [
              {
                image: {
                  content: fs.readFileSync(filePath).toString('base64')
                },
                features: [
                  {
                    type: 'TEXT_DETECTION'
                  }
                ]
              }
            ]
          }
        );
        
        return response.data.responses[0].fullTextAnnotation.text;
      } else {
        throw new Error(`Fournisseur OCR non pris en charge: ${this.provider}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'extraction de texte:', error);
      throw error;
    }
  }
}

module.exports = OCRService;
