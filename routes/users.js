import { Router } from "express";
import {register, login, update, remove} from "../controllers/user.controller.js"
export const users = Router();

users.post("/register", register);

users.post("/login", login);

users.post("/update/:idUser", update);

users.delete("/delete/idUser", remove);