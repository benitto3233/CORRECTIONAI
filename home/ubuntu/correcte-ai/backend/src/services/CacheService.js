const Redis = require('ioredis');
const { logger } = require('../utils/logger');

/**
 * Service de mise en cache pour optimiser les performances
 * Fournit une couche d'abstraction pour Redis avec fallback sur un cache en mu00e9moire
 */
class CacheService {
  constructor(config = {}) {
    const {
      redisHost = process.env.REDIS_HOST || 'localhost',
      redisPort = process.env.REDIS_PORT || 6379,
      redisPassword = process.env.REDIS_PASSWORD || '',
      redisDb = process.env.REDIS_DB || 0,
      useMemoryFallback = true,
      prefix = 'correcte-ai:'
    } = config;

    this.prefix = prefix;
    this.useMemoryFallback = useMemoryFallback;
    this.memoryCache = new Map();
    this.redisEnabled = false;

    // Initialiser Redis si possible
    if (redisHost) {
      try {
        this.redisClient = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          db: redisDb,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          }
        });

        this.redisClient.on('connect', () => {
          logger.info('Connectu00e9 au service Redis');
          this.redisEnabled = true;
        });

        this.redisClient.on('error', (err) => {
          if (this.redisEnabled) {
            logger.error(`Erreur de connexion Redis: ${err.message}`, { error: err });
            this.redisEnabled = false;
          }
        });

        // Vu00e9rifier la connexion Redis
        this._validateRedisConnection();
      } catch (error) {
        logger.warn(`Impossible d'initialiser Redis: ${error.message}. Utilisation du cache en mu00e9moire.`, { error });
        this.redisEnabled = false;
      }
    } else {
      logger.info('Configuration Redis non fournie. Utilisation du cache en mu00e9moire.');
    }
  }

  /**
   * Vu00e9rifie la connexion Redis
   * @private
   */
  async _validateRedisConnection() {
    try {
      await this.redisClient.ping();
      this.redisEnabled = true;
    } catch (error) {
      logger.warn(`La connexion Redis a u00e9chouu00e9: ${error.message}. Utilisation du cache en mu00e9moire.`, { error });
      this.redisEnabled = false;
    }
  }

  /**
   * Gu00e9nu00e8re une clu00e9 avec pru00e9fixe
   * @private
   * @param {string} key - Clu00e9 de base
   * @returns {string} Clu00e9 avec pru00e9fixe
   */
  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Ru00e9cupu00e8re une valeur du cache
   * @param {string} key - Clu00e9 u00e0 ru00e9cupu00e9rer
   * @returns {Promise<any>} Valeur du cache ou null
   */
  async get(key) {
    const prefixedKey = this._getKey(key);

    // Essayer Redis d'abord si disponible
    if (this.redisEnabled) {
      try {
        const value = await this.redisClient.get(prefixedKey);
        if (value) {
          try {
            return JSON.parse(value);
          } catch (error) {
            logger.debug(`Valeur non-JSON ru00e9cupu00e9ru00e9e de Redis pour la clu00e9 ${prefixedKey}`);
            return value;
          }
        }
      } catch (error) {
        logger.warn(`Erreur lors de la ru00e9cupu00e9ration depuis Redis: ${error.message}`, { error });
        // Basculer vers le cache en mu00e9moire
      }
    }

    // Fallback sur le cache en mu00e9moire
    if (this.useMemoryFallback) {
      const item = this.memoryCache.get(prefixedKey);
      if (item && (item.expiry === 0 || item.expiry > Date.now())) {
        return item.value;
      }
    }

    return null;
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clu00e9 pour stocker la valeur
   * @param {any} value - Valeur u00e0 stocker
   * @param {number} ttl - Duru00e9e de vie en secondes (0 = pas d'expiration)
   * @returns {Promise<boolean>} Succu00e8s de l'opu00e9ration
   */
  async set(key, value, ttl = 3600) {
    const prefixedKey = this._getKey(key);
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value.toString();

    // Stocker dans Redis si disponible
    if (this.redisEnabled) {
      try {
        if (ttl === 0) {
          await this.redisClient.set(prefixedKey, serializedValue);
        } else {
          await this.redisClient.set(prefixedKey, serializedValue, 'EX', ttl);
        }
      } catch (error) {
        logger.warn(`Erreur lors du stockage dans Redis: ${error.message}`, { error });
        // Continuer avec le cache en mu00e9moire
      }
    }

    // Stocker/mettre u00e0 jour dans le cache en mu00e9moire
    if (this.useMemoryFallback) {
      const expiry = ttl === 0 ? 0 : Date.now() + (ttl * 1000);
      this.memoryCache.set(prefixedKey, { value, expiry });
    }

    return true;
  }

  /**
   * Supprime une valeur du cache
   * @param {string} key - Clu00e9 u00e0 supprimer
   * @returns {Promise<boolean>} Succu00e8s de l'opu00e9ration
   */
  async delete(key) {
    const prefixedKey = this._getKey(key);

    // Supprimer de Redis si disponible
    if (this.redisEnabled) {
      try {
        await this.redisClient.del(prefixedKey);
      } catch (error) {
        logger.warn(`Erreur lors de la suppression dans Redis: ${error.message}`, { error });
      }
    }

    // Supprimer du cache en mu00e9moire
    if (this.useMemoryFallback) {
      this.memoryCache.delete(prefixedKey);
    }

    return true;
  }

  /**
   * Supprime toutes les clu00e9s avec un pru00e9fixe spu00e9cifique
   * @param {string} pattern - Modu00e8le de clu00e9s u00e0 supprimer
   * @returns {Promise<number>} Nombre de clu00e9s supprimu00e9es
   */
  async deletePattern(pattern) {
    const fullPattern = this._getKey(pattern + '*');
    let count = 0;

    // Supprimer de Redis si disponible
    if (this.redisEnabled) {
      try {
        const keys = await this.redisClient.keys(fullPattern);
        if (keys.length > 0) {
          count = await this.redisClient.del(keys);
        }
      } catch (error) {
        logger.warn(`Erreur lors de la suppression par modu00e8le dans Redis: ${error.message}`, { error });
      }
    }

    // Supprimer du cache en mu00e9moire
    if (this.useMemoryFallback) {
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(this._getKey(pattern))) {
          this.memoryCache.delete(key);
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Met u00e0 jour la duru00e9e de vie d'une clu00e9
   * @param {string} key - Clu00e9 u00e0 mettre u00e0 jour
   * @param {number} ttl - Nouvelle duru00e9e de vie en secondes
   * @returns {Promise<boolean>} Succu00e8s de l'opu00e9ration
   */
  async updateTTL(key, ttl) {
    const prefixedKey = this._getKey(key);

    // Mettre u00e0 jour dans Redis si disponible
    if (this.redisEnabled) {
      try {
        const exists = await this.redisClient.exists(prefixedKey);
        if (exists) {
          await this.redisClient.expire(prefixedKey, ttl);
        } else {
          return false;
        }
      } catch (error) {
        logger.warn(`Erreur lors de la mise u00e0 jour du TTL dans Redis: ${error.message}`, { error });
      }
    }

    // Mettre u00e0 jour dans le cache en mu00e9moire
    if (this.useMemoryFallback) {
      const item = this.memoryCache.get(prefixedKey);
      if (item) {
        item.expiry = ttl === 0 ? 0 : Date.now() + (ttl * 1000);
        this.memoryCache.set(prefixedKey, item);
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Incru00e9mente une valeur dans le cache
   * @param {string} key - Clu00e9 u00e0 incru00e9menter
   * @param {number} increment - Valeur d'incru00e9mentation (par du00e9faut 1)
   * @returns {Promise<number>} Nouvelle valeur
   */
  async increment(key, increment = 1) {
    const prefixedKey = this._getKey(key);
    let newValue = increment;

    // Incru00e9menter dans Redis si disponible
    if (this.redisEnabled) {
      try {
        if (increment === 1) {
          newValue = await this.redisClient.incr(prefixedKey);
        } else {
          newValue = await this.redisClient.incrby(prefixedKey, increment);
        }
      } catch (error) {
        logger.warn(`Erreur lors de l'incru00e9mentation dans Redis: ${error.message}`, { error });
        // Continuer avec le cache en mu00e9moire
      }
    }

    // Incru00e9menter dans le cache en mu00e9moire
    if (this.useMemoryFallback && (!this.redisEnabled || !newValue)) {
      const item = this.memoryCache.get(prefixedKey);
      if (item) {
        const currentValue = parseInt(item.value, 10) || 0;
        newValue = currentValue + increment;
        item.value = newValue;
        this.memoryCache.set(prefixedKey, item);
      } else {
        this.memoryCache.set(prefixedKey, {
          value: increment,
          expiry: 0
        });
        newValue = increment;
      }
    }

    return newValue;
  }
}

module.exports = CacheService;
