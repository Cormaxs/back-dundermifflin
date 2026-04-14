import Peticiones from '../model/peticiones.model.js';

class PeticionesRepository {
    async create(data) {
        return await Peticiones.create(data);
    }

    async findAll(filters = {}, skip = 0, limit = 10) {
        return await Peticiones.find(filters)
            .populate('userId', 'username email')
            .sort({ prioridad: -1, createdAt: 1 })
            .skip(skip)
            .limit(limit);
    }

    async findById(id) {
        return await Peticiones.findById(id).populate('userId', 'username');
    }

    async updateStatus(id, status, adminNote, linkBook) {
        return await Peticiones.findByIdAndUpdate(
            id, 
            { status, adminNote, linkBook }, 
            { new: true }
        );
    }

    async count(filters = {}) {
        return await Peticiones.countDocuments(filters);
    }
}

export default new PeticionesRepository();