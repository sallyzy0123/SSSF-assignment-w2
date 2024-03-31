// TODO: create the following functions:
// - userGet - get user by id ✅
// - userListGet - get all users ✅
// - userPost - create new user. Remember to hash password ✅
// - userPutCurrent - update current user ✅
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query ✅
import {Request, Response, NextFunction} from 'express';
import {User, UserOutput} from '../../types/DBTypes';
import userModel from '../models/userModel';
import {MessageResponse} from '../../types/MessageTypes';
import bcrypt from 'bcrypt';
import CustomError from '../../classes/CustomError';

const userListGet = async (
    req: Request,
    res: Response<User[]>,
    next: NextFunction
) => {
    try {
      const users = await userModel.find().select('-password -__v -role');
      res.json(users);
    } catch (error) {
      next(error);
    }
};

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -__v -role');
    if (!user) {
      throw new CustomError('No species found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const userPost = async (
    req: Request<{}, {}, Omit<User, 'user_id'>>,
    res: Response<MessageResponse & {data: UserOutput}>,
    next: NextFunction
) => {
    try {
      req.body.role = 'user';
      req.body.password = bcrypt.hashSync(req.body.password, 10);
      const user = await userModel.create(req.body);
      const userOutput: UserOutput = {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      };
      const response = {
        message: 'User added',
        data: userOutput,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
};

const userPutCurrent = async (
  req: Request<{}, {}, Omit<User, 'user_id'>>,
  res: Response<MessageResponse & {data: UserOutput}>,
  next: NextFunction
) => {
  try {
    const id = res.locals.user._id;
    const user = await userModel
      .findByIdAndUpdate(id, req.body, {
        new: true,
      })
      .select('-password -__v -role');
    if (!user) {
      throw new CustomError('No user found', 404);
    }
    const response = {
      message: 'User updated',
      data: user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
  req: Request<{}, {}, {}>,
  res: Response<MessageResponse & {data: UserOutput}>,
  next: NextFunction
) => {
  try {
    const id = res.locals.user._id;
    const user = await userModel
      .findByIdAndDelete(id)
      .select('-password -__v -role');
    if (!user) {
      throw new CustomError('No user found', 404);
    }
    const response = {
      message: 'User added',
      data: user,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const checkToken = async (
  req: Request,
  res: Response<UserOutput>,
  next: NextFunction
): Promise<UserOutput | null> => {
  try {
    if (res.locals.user) {
      const user = res.locals.user;
      const userData: UserOutput = {
        _id: user._id,
        user_name: user.user_name,
        email: user.email,
      };
      res.json(userData);
      return userData;
    } else {
      return null;
    }
  } catch (error) {
    next(error);
    return null;
  }
};

export {userListGet, userGet, userPost, userPutCurrent, userDeleteCurrent, checkToken};