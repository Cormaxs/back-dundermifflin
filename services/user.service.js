import {
    createUser,
    findUserByUsername,
    findUserByIdAndUpdate,
    findUserByIdAndRemove,
    findUserByEmailAndUpdate
  } from "../repositories/user.repository.js";
  import { hashPassword, comparePassword, generateToken } from "../utils/auth.utils.js";
  import { updateSubscriptionData } from "../repositories/user.repository.js";



  export const registerUser = async (userData) => {
    const { password } = userData;
    const hashedPassword = await hashPassword(password);
    const newUser = { ...userData,
      password: hashedPassword
    };
    return await createUser(newUser);
  };
  
  export const loginUser = async (credentials) => {
    const { username, password } = credentials;
    const user = await findUserByUsername(username);
  
    if (!user || !(await comparePassword(password, user.password))) {
      throw new Error("Invalid credentials");
    }
  
    const token = generateToken(user);
    return { user, token };
  };
  
  export const updateUser = async (id, updateData) => {
    console.log(updateData);
    if (updateData.password != ' ' || null) {
      updateData.password = await hashPassword(updateData.password);
    }
    return await findUserByIdAndUpdate(id, updateData);
  };
  
  export const deleteUser = async (id) => {
    const deletedUser = await findUserByIdAndRemove(id);
    if (!deletedUser) {
      throw new Error("User not found");
    }
    return deletedUser;
  };



  //suscripcion
  export const processSubscriptionUpdate = async (email, creemData) => {
    // Aquí el servicio solo se encarga de llamar al repositorio 
    // que maneja la persistencia de ambos modelos.
    const result = await updateSubscriptionData(email, creemData);
    
    if (!result) {
        throw new Error("No se pudo procesar la suscripción para: " + email);
    }
    
    return result;
};