import PeticionesRepository from '../repositories/peticiones.repository.js';

class peticionesService {
    async createPeticiones(userId, bookData, isPremiumUser) {
        const newPeticiones = {
            userId,
            nombreLibro: bookData.nombreLibro,
            autor: bookData.autor,
            prioridad: isPremiumUser // Los usuarios Pro van primero en la cola
        };
        return await PeticionesRepository.create(newPeticiones);
    }

    async getAllPeticiones(page = 1, limit = 10, status, userRole, userId) {
        const filters = status ? { status } : {};
        
        // Si es un usuario normal, solo mostrar sus peticiones
        if (userRole === 'user') {
            filters.userId = userId;
        }
        // Si es admin, mostrar todas (no agregar filtro de userId)
        
        const skip = (page - 1) * limit;
        
        const [Peticioness, total] = await Promise.all([
            PeticionesRepository.findAll(filters, skip, limit),
            PeticionesRepository.count(filters)
        ]);

        return {
            Peticioness,
            metadata: { total, page, totalPages: Math.ceil(total / limit) }
        };
    }

    async updatePeticionesStatus(PeticionesId, status, adminNote, linkBook) {
        return await PeticionesRepository.updateStatus(PeticionesId, status, adminNote, linkBook);
    }
}

export default new peticionesService();