const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Service pour la gestion des fonctionnalités de collaboration entre enseignants
 */
class CollaborationService {
  constructor(options = {}) {
    this.notificationService = options.notificationService;
    this.cacheService = options.cacheService;
    this.userModel = options.userModel || mongoose.model('User');
    this.collaborationSpaceModel = mongoose.model('CollaborationSpace');
    this.rubricModel = mongoose.model('Rubric');
    this.assignmentModel = mongoose.model('Assignment');
  }

  /**
   * Crée un nouvel espace de collaboration
   * @param {Object} spaceData - Données de l'espace de collaboration
   * @param {string} creatorId - ID de l'utilisateur créateur
   * @returns {Promise<Object>} Espace de collaboration créé
   */
  async createCollaborationSpace(spaceData, creatorId) {
    try {
      const newSpace = new this.collaborationSpaceModel({
        ...spaceData,
        creator: creatorId,
        members: [{ user: creatorId, role: 'admin' }],
        isActive: true
      });

      await newSpace.save();
      logger.info(`Espace de collaboration créé: ${newSpace._id}`, { userId: creatorId });
      return newSpace;
    } catch (error) {
      logger.error(`Erreur lors de la création d'un espace de collaboration: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Ajoute un membre à un espace de collaboration
   * @param {string} spaceId - ID de l'espace
   * @param {string} userId - ID de l'utilisateur à ajouter
   * @param {string} role - Rôle du membre ('admin', 'contributor', 'viewer')
   * @param {string} inviterId - ID de l'utilisateur invitant
   * @returns {Promise<Object>} Espace de collaboration mis à jour
   */
  async addMember(spaceId, userId, role, inviterId) {
    try {
      // Vérifier si l'utilisateur existe
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Récupérer l'espace de collaboration
      const space = await this.collaborationSpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Espace de collaboration non trouvé');
      }

      // Vérifier si l'utilisateur est déjà membre
      const existingMember = space.members.find(member => member.user.toString() === userId);
      if (existingMember) {
        // Mettre à jour le rôle si différent
        if (existingMember.role !== role) {
          existingMember.role = role;
          await space.save();
          logger.info(`Rôle de l'utilisateur ${userId} mis à jour dans l'espace ${spaceId}`, { userId: inviterId });
        }
        return space;
      }

      // Ajouter le nouveau membre
      space.members.push({ user: userId, role, addedBy: inviterId, addedAt: new Date() });
      await space.save();

      // Envoyer une notification à l'utilisateur invité
      if (this.notificationService) {
        const inviter = await this.userModel.findById(inviterId);
        await this.notificationService.sendNotification({
          user: userId,
          title: 'Invitation à un espace de collaboration',
          message: `${inviter.name} vous a invité à rejoindre l'espace de collaboration "${space.name}"`,
          type: 'info',
          link: `/collaboration/spaces/${space._id}`,
          metadata: { spaceId: space._id }
        });
      }

      logger.info(`Utilisateur ${userId} ajouté à l'espace ${spaceId}`, { userId: inviterId });
      return space;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout d'un membre à un espace: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Retire un membre d'un espace de collaboration
   * @param {string} spaceId - ID de l'espace
   * @param {string} userId - ID de l'utilisateur à retirer
   * @param {string} requesterId - ID de l'utilisateur effectuant la demande
   * @returns {Promise<Object>} Espace de collaboration mis à jour
   */
  async removeMember(spaceId, userId, requesterId) {
    try {
      const space = await this.collaborationSpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Espace de collaboration non trouvé');
      }

      // Vérifier les permissions
      const requesterMember = space.members.find(member => member.user.toString() === requesterId);
      if (!requesterMember || requesterMember.role !== 'admin') {
        throw new Error('Permissions insuffisantes pour retirer un membre');
      }

      // Vérifier que l'utilisateur n'est pas le dernier admin
      if (userId === requesterId) {
        const adminCount = space.members.filter(member => member.role === 'admin').length;
        if (adminCount <= 1) {
          throw new Error('Impossible de retirer le dernier administrateur');
        }
      }

      // Retirer le membre
      space.members = space.members.filter(member => member.user.toString() !== userId);
      await space.save();

      // Envoyer une notification
      if (this.notificationService) {
        await this.notificationService.sendNotification({
          user: userId,
          title: 'Retrait d\'un espace de collaboration',
          message: `Vous avez été retiré de l'espace de collaboration "${space.name}"`,
          type: 'info'
        });
      }

      logger.info(`Utilisateur ${userId} retiré de l'espace ${spaceId}`, { userId: requesterId });
      return space;
    } catch (error) {
      logger.error(`Erreur lors du retrait d'un membre: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Partage une ressource dans un espace de collaboration
   * @param {string} spaceId - ID de l'espace
   * @param {string} resourceType - Type de ressource ('rubric', 'assignment', etc.)
   * @param {string} resourceId - ID de la ressource
   * @param {string} userId - ID de l'utilisateur partageant
   * @returns {Promise<Object>} Résultat du partage
   */
  async shareResource(spaceId, resourceType, resourceId, userId) {
    try {
      // Vérifier l'espace de collaboration
      const space = await this.collaborationSpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Espace de collaboration non trouvé');
      }

      // Vérifier que l'utilisateur est membre de l'espace
      const isMember = space.members.some(member => member.user.toString() === userId);
      if (!isMember) {
        throw new Error('Vous n\'êtes pas membre de cet espace de collaboration');
      }

      // Vérifier que la ressource existe et appartient à l'utilisateur
      let resource;
      let Model;

      switch (resourceType) {
        case 'rubric':
          Model = this.rubricModel;
          break;
        case 'assignment':
          Model = this.assignmentModel;
          break;
        default:
          throw new Error('Type de ressource non pris en charge');
      }

      resource = await Model.findById(resourceId);
      if (!resource) {
        throw new Error('Ressource non trouvée');
      }

      // Vérifier que l'utilisateur peut partager cette ressource
      if (resource.creator && resource.creator.toString() !== userId) {
        throw new Error('Vous n\'avez pas les droits pour partager cette ressource');
      }

      // Ajouter le partage à l'espace de collaboration
      const shareExists = space.sharedResources.some(
        item => item.resourceType === resourceType && item.resource.toString() === resourceId
      );

      if (!shareExists) {
        space.sharedResources.push({
          resourceType,
          resource: resourceId,
          sharedBy: userId,
          sharedAt: new Date()
        });
        await space.save();
      }

      // Notifier les membres de l'espace
      if (this.notificationService) {
        const user = await this.userModel.findById(userId);
        const resourceName = resource.name || resource.title || 'Ressource';

        // Notifier tous les membres sauf celui qui partage
        const membersToNotify = space.members
          .filter(member => member.user.toString() !== userId)
          .map(member => member.user);

        if (membersToNotify.length > 0) {
          await this.notificationService.sendBulkNotifications(
            membersToNotify,
            {
              title: 'Nouvelle ressource partagée',
              message: `${user.name} a partagé ${resourceType === 'rubric' ? 'une rubrique' : 'un devoir'} "${resourceName}" dans l'espace "${space.name}"`,
              type: 'info',
              link: `/collaboration/spaces/${spaceId}?resourceType=${resourceType}&resourceId=${resourceId}`,
              metadata: { spaceId, resourceType, resourceId }
            }
          );
        }
      }

      logger.info(`Ressource ${resourceType}:${resourceId} partagée dans l'espace ${spaceId}`, { userId });
      return { success: true, spaceId, resourceType, resourceId };
    } catch (error) {
      logger.error(`Erreur lors du partage d'une ressource: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Récupère les espaces de collaboration d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des espaces de collaboration
   */
  async getUserSpaces(userId) {
    try {
      const cacheKey = `user_spaces:${userId}`;

      // Essayer de récupérer depuis le cache
      if (this.cacheService) {
        const cachedSpaces = await this.cacheService.get(cacheKey);
        if (cachedSpaces) {
          return JSON.parse(cachedSpaces);
        }
      }

      // Récupérer depuis la base de données
      const spaces = await this.collaborationSpaceModel
        .find({ 'members.user': userId, isActive: true })
        .populate('creator', 'name email profilePicture')
        .populate('members.user', 'name email profilePicture')
        .select('-sharedResources')
        .sort({ updatedAt: -1 })
        .lean();

      // Mettre en cache
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, JSON.stringify(spaces), 300); // 5 minutes
      }

      return spaces;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des espaces de l'utilisateur: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Récupère les ressources partagées dans un espace
   * @param {string} spaceId - ID de l'espace
   * @param {string} userId - ID de l'utilisateur faisant la demande
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste des ressources partagées
   */
  async getSharedResources(spaceId, userId, options = {}) {
    try {
      // Vérifier que l'utilisateur est membre de l'espace
      const space = await this.collaborationSpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Espace de collaboration non trouvé');
      }

      const isMember = space.members.some(member => member.user.toString() === userId);
      if (!isMember) {
        throw new Error('Accès refusé à cet espace de collaboration');
      }

      // Appliquer les filtres
      const { resourceType, limit = 20, page = 1 } = options;
      const skip = (page - 1) * limit;

      // Construire le pipeline d'agrégation
      const pipeline = [
        { $match: { _id: mongoose.Types.ObjectId(spaceId) } },
        { $unwind: '$sharedResources' },
        { $sort: { 'sharedResources.sharedAt': -1 } }
      ];

      if (resourceType) {
        pipeline.push({ $match: { 'sharedResources.resourceType': resourceType } });
      }

      pipeline.push(
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'sharedResources.sharedBy',
            foreignField: '_id',
            as: 'sharedResources.sharedByUser'
          }
        },
        { $unwind: '$sharedResources.sharedByUser' },
        {
          $project: {
            _id: 0,
            resourceId: '$sharedResources.resource',
            resourceType: '$sharedResources.resourceType',
            sharedAt: '$sharedResources.sharedAt',
            sharedBy: {
              _id: '$sharedResources.sharedByUser._id',
              name: '$sharedResources.sharedByUser.name',
              email: '$sharedResources.sharedByUser.email',
              profilePicture: '$sharedResources.sharedByUser.profilePicture'
            }
          }
        }
      );

      // Exécuter l'agrégation
      const resources = await this.collaborationSpaceModel.aggregate(pipeline);

      // Enrichir chaque ressource avec ses détails
      const enrichedResources = await Promise.all(resources.map(async (item) => {
        let resourceDetails = null;
        try {
          let Model;

          switch (item.resourceType) {
            case 'rubric':
              Model = this.rubricModel;
              break;
            case 'assignment':
              Model = this.assignmentModel;
              break;
            default:
              return item;
          }

          resourceDetails = await Model.findById(item.resourceId)
            .select('title name description createdAt')
            .lean();
        } catch (err) {
          logger.warn(`Ressource introuvable: ${item.resourceType}:${item.resourceId}`);
        }

        return {
          ...item,
          resource: resourceDetails
        };
      }));

      return enrichedResources;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des ressources partagées: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * Supprime un espace de collaboration
   * @param {string} spaceId - ID de l'espace
   * @param {string} userId - ID de l'utilisateur faisant la demande
   * @returns {Promise<boolean>} Résultat de la suppression
   */
  async deleteCollaborationSpace(spaceId, userId) {
    try {
      const space = await this.collaborationSpaceModel.findById(spaceId);
      if (!space) {
        throw new Error('Espace de collaboration non trouvé');
      }

      // Vérifier que l'utilisateur est admin
      const userMember = space.members.find(member => member.user.toString() === userId);
      if (!userMember || userMember.role !== 'admin') {
        throw new Error('Permissions insuffisantes pour supprimer cet espace');
      }

      // Suppression logique
      space.isActive = false;
      space.deletedAt = new Date();
      space.deletedBy = userId;
      await space.save();

      // Notifier les membres
      if (this.notificationService) {
        const user = await this.userModel.findById(userId);
        const membersToNotify = space.members
          .filter(member => member.user.toString() !== userId)
          .map(member => member.user);

        if (membersToNotify.length > 0) {
          await this.notificationService.sendBulkNotifications(
            membersToNotify,
            {
              title: 'Espace de collaboration supprimé',
              message: `L'espace de collaboration "${space.name}" a été supprimé par ${user.name}`,
              type: 'warning'
            }
          );
        }
      }

      logger.info(`Espace de collaboration ${spaceId} supprimé`, { userId });
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression d'un espace: ${error.message}`, { error });
      throw error;
    }
  }
}

module.exports = CollaborationService;
