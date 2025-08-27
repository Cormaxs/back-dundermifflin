import User from "../model/user.model.js";

export const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

export const findUserByUsername = async (username) => {
  return await User.findOne({ username });
};

export const findUserByIdAndUpdate = async (id, updateData) => {
  return await User.findByIdAndUpdate(id, updateData, { new: true });
};

export const findUserByIdAndRemove = async (id) => {
  return await User.findByIdAndDelete(id);
};