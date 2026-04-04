import User from "../model/user.model.js";
import Subscription from "../model/Subscription.model.js";

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


export const findUserByEmailAndUpdate = async (email, updateData) => {
  return await User.findOneAndUpdate(
      { email }, 
      { $set: updateData }, 
      { new: true } // Para que devuelva el usuario actualizado
  );
};



//suscripcion del usuario
export const updateSubscriptionData = async (email, creemData) => {
  const { status, period_start, period_end, amount, id } = creemData;

  // 1. Buscamos y actualizamos al usuario en un solo paso
  const user = await User.findOneAndUpdate(
      { email },
      { 
          $set: { 
              isSubscribed: status === 'active',
              subscriptionStatus: status 
          } 
      },
      { new: true }
  );

  if (!user) return null;

  // 2. Creamos el registro en el historial
  const newHistoryEntry = new Subscription({
      userId: user._id,
      creemSubscriptionId: id,
      status: status,
      amount: amount,
      periodStart: period_start ? new Date(period_start) : new Date(),
      periodEnd: period_end ? new Date(period_end) : null,
      rawWebhookData: creemData 
  });

  return await newHistoryEntry.save();
};