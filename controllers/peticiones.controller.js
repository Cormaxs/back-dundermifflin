import peticionesService from '../services/peticiones.service.js';

export const create = async (req, res) => {
    try {
        // req.user viene de tu middleware de JWT
        const result = await peticionesService.createPeticiones(
            req.user.id, 
            req.body, 
            req.user.isSubscribed
        );
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const list = async (req, res) => {
    try {
        const { page, limit, status } = req.query;
        const data = await peticionesService.getAllPeticiones(page, limit, status);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;
        const result = await peticionesService.updatePeticionesStatus(id, status, adminNote);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};