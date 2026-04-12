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

    async getAllPeticiones(page = 1, limit = 10, status) {
        const filters = status ? { status } : {};
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

    async updatePeticionesStatus(PeticionesId, status, adminNote) {
        return await PeticionesRepository.updateStatus(PeticionesId, status, adminNote);
    }
}

export default new peticionesService();