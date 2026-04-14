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
        const userRole = req.userRole;
        const userId = req.user.id;
        const data = await peticionesService.getAllPeticiones(page, limit, status, userRole, userId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        console.log('updateStatus called with:', req.params, req.body);
        const { idPeticion } = req.params;
        const { status, adminNote , linkBook} = req.body;
        const result = await peticionesService.updatePeticionesStatus(idPeticion, status, adminNote, linkBook);
        console.log("result from service:", result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};