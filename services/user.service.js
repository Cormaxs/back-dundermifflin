import {
    createUser,
    findUserByUsername,
    findUserByIdAndUpdate,
    findUserByIdAndRemove,
  } from "../repositories/user.repository.js";
  import { hashPassword, comparePassword, generateToken } from "../utils/auth.utils.js";
  
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