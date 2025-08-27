import {
    registerUser,
    loginUser,
    updateUser,
    deleteUser,
  } from "../services/user.service.js";
  
  export const register = async (req, res) => {
    try {
      console.log(req.body);
      const user = await registerUser(req.body);
      res.status(201).json({success: true,
        user: user});
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const login = async (req, res) => {
    try {
      console.log(req.body);
      const user = await loginUser(req.body);
      res.status(200).json({success: true,
        user: user});
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  };
  
  export const update = async (req, res) => {
    try {
      const user = await updateUser(req.params.idUser, req.body);
      res.status(200).json({success: true,
        user: user});
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  export const remove = async (req, res) => {
    try {
      const user = await deleteUser(req.params.idUser);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };