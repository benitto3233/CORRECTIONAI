const redis = require('redis');
const { promisify } = require('util');

/**
 * Service de cache distribué utilisant Redis
 * Optimise les performances en stockant les résultats fréquemment utilisés
 */
class CacheService {
  constructor(config = {}) {
    const {
      host = process.env.REDIS_HOST || 'redis',
      port = process.env.REDIS_PORT || 6379,
      password = process.env.REDIS_PASSWORD,
      db = process.env.REDIS_DB || 0,
      ttl = 3600 // Durée de vie par défaut en secondes (1 heure)
    } = config;

    this.defaultTTL = ttl;
    this.client = redis.createClient({
      host,
      port,
      password,
      db: parseInt(db),
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('REDIS: Connection refused, retrying...');
          return Math.min(options.attempt * 100, 3000);
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Promisifier les méthodes Redis
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);
    this.scanAsync = promisify(this.client.scan).bind(this.client);
    this.infoAsync = promisify(this.client.info).bind(this.client);

    // Gestionnaire d'erreurs
    this.client.on('error', (error) => {
      console.error('REDIS: Error in cache service:', error);
    });

    // Événement de connexion réussie
    this.client.on('connect', () => {
      console.log('REDIS: Successfully connected to cache server');
    });
  }

  /**
   * Récupère une valeur du cache
   * @param {string} key - Clé de l'élément à récupérer
   * @returns {Promise<any>} Valeur désérialisée ou null si non trouvée
   */
  async get(key) {
    try {
      const value = await this.getAsync(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`REDIS: Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache
   * @param {string} key - Clé de l'élément
   * @param {any} value - Valeur à stocker (sera sérialisée)
   * @param {number} ttl - Durée de vie en secondes (optionnel)
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.setAsync(key, serialized, 'EX', ttl);
      } else {
        await this.setAsync(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`REDIS: Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime une valeur du cache
   * @param {string} key - Clé de l'élément à supprimer
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async delete(key) {
    try {
      await this.delAsync(key);
      return true;
    } catch (error) {
      console.error(`REDIS: Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Récupère une valeur du cache ou exécute une fonction pour la générer si absente
   * @param {string} key - Clé de l'élément
   * @param {Function} fallbackFn - Fonction à exécuter si l'élément n'est pas en cache
   * @param {number} ttl - Durée de vie en secondes (optionnel)
   * @returns {Promise<any>} Valeur du cache ou générée par fallbackFn
   */
  async getOrSet(key, fallbackFn, ttl = this.defaultTTL) {
    try {
      // Essayer de récupérer depuis le cache
      const cachedValue = await this.get(key);
      if (cachedValue !== null) {
        console.log(`REDIS: Cache hit for key ${key}`);
        return cachedValue;
      }

      // Valeur non trouvée, exécuter la fonction de repli
      console.log(`REDIS: Cache miss for key ${key}, generating new value`);
      const newValue = await fallbackFn();
      
      // Stocker la nouvelle valeur générée dans le cache
      await this.set(key, newValue, ttl);
      return newValue;
    } catch (error) {
      console.error(`REDIS: Error in getOrSet for key ${key}:`, error);
      // En cas d'erreur, on exécute quand même la fonction de repli
      return await fallbackFn();
    }
  }

  /**
   * Récupère des statistiques sur l'utilisation du cache
   * @returns {Promise<Object>} Statistiques du cache
   */
  async getStats() {
    try {
      const info = await this.infoAsync();
      const lines = info.split('\r\n');
      
      const stats = {};
      const relevantMetrics = [
        'used_memory_human',
        'connected_clients',
        'uptime_in_seconds',
        'keyspace_hits',
        'keyspace_misses',
        'expired_keys'
      ];
      
      for (const line of lines) {
        for (const metric of relevantMetrics) {
          if (line.startsWith(metric + ':')) {
            stats[metric] = line.split(':')[1].trim();
          }
        }
      }
      
      // Calculer le taux de réussite du cache
      if (stats.keyspace_hits && stats.keyspace_misses) {
        const hits = parseInt(stats.keyspace_hits);
        const misses = parseInt(stats.keyspace_misses);
        const total = hits + misses;
        if (total > 0) {
          stats.hit_rate = (hits / total * 100).toFixed(2) + '%';
        }
      }
      
      return stats;
    } catch (error) {
      console.error('REDIS: Error getting cache stats:', error);
      return {};
    }
  }

  /**
   * Invalide toutes les clés correspondant à un motif
   * @param {string} pattern - Motif de recherche (ex: "user:*")
   * @returns {Promise<number>} Nombre de clés supprimées
   */
  async invalidatePattern(pattern) {
    try {
      let cursor = '0';
      let keysToDelete = [];
      
      do {
        const [nextCursor, keys] = await this.scanAsync(cursor, 'MATCH', pattern);
        cursor = nextCursor;
        keysToDelete = keysToDelete.concat(keys);
      } while (cursor !== '0');
      
      if (keysToDelete.length > 0) {
        await this.delAsync(keysToDelete);
        console.log(`REDIS: Invalidated ${keysToDelete.length} keys matching pattern ${pattern}`);
      }
      
      return keysToDelete.length;
    } catch (error) {
      console.error(`REDIS: Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Préchauffe le cache avec des données
   * @param {Object} entries - Paires clé-valeur à mettre en cache
   * @param {number} ttl - Durée de vie en secondes (optionnel)
   * @returns {Promise<number>} Nombre d'entrées mises en cache
   */
  async warmup(entries, ttl = this.defaultTTL) {
    try {
      const promises = Object.entries(entries).map(([key, value]) => {
        return this.set(key, value, ttl);
      });
      
      const results = await Promise.all(promises);
      const successCount = results.filter(result => result).length;
      
      console.log(`REDIS: Warmed up cache with ${successCount} entries`);
      return successCount;
    } catch (error) {
      console.error('REDIS: Error warming up cache:', error);
      return 0;
    }
  }

  /**
   * Ferme la connexion au serveur Redis
   */
  async close() {
    try {
      await promisify(this.client.quit).bind(this.client)();
      console.log('REDIS: Connection closed');
    } catch (error) {
      console.error('REDIS: Error closing connection:', error);
    }
  }
}

module.exports = CacheService;
