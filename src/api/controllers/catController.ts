// TODO: create following functions:
// - catGetByUser - get all cats by current user id ✅
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner ✅
// - catDeleteAdmin - only admin can delete cat ✅
// - catDelete - only owner can delete cat ✅
// - catPut - only owner can update cat ✅
// - catGet - get cat by id ✅
// - catListGet - get all cats ✅
// - catPost - create new cat ✅
import {Request, Response, NextFunction} from 'express';
import {Cat} from '../../types/DBTypes';
import {MessageResponse} from '../../types/MessageTypes';
import catModel from '../models/catModel';
import CustomError from '../../classes/CustomError';
import bcrypt from 'bcrypt';
import {validationResult} from 'express-validator';


const catListGet = async (
    req: Request,
    res: Response<Cat[]>,
    next: NextFunction
  ) => {
    try {
      const cats = await catModel
        .find()
        .select('-__v')
        .populate('owner', '-__v -password -role');
      res.json(cats);
    } catch (error) {
      next(error);
    }
};

const catGet = async (
    req: Request<{id: string}>, 
    res: Response<Cat>, 
    next: NextFunction
) => {
    try {
      const cat = await catModel
        .findById(req.params.id)
        .populate({
            path: 'owner',
            select: '_id user_name email',
        });
      if (!cat) {
        throw new CustomError('No cat found', 404);
      }
      res.json(cat);
    } catch (error) {
      next(error);
    }
  };

const catGetByUser = async (
    req: Request<{id: string}>, 
    res: Response<Cat[]>, 
    next: NextFunction
) => {
    const user = res.locals.user._id;
    if (!user) {
        throw new CustomError('No user', 400);
    }
    try {
      const cat = await catModel
        .find({owner: user})
        .populate({
            path: 'owner',
            select: '_id user_name email',
        });
      if (!cat) {
        throw new CustomError('No cat found by user', 404);
      }
      res.json(cat);
    } catch (error) {
      next(error);
    }
  };

const catPost = async (
    req: Request<{}, {}, Partial<Cat>>,
    res: Response<MessageResponse & {data: Cat}>,
    next: NextFunction
  ) => {
    const errors = validationResult(req.body);
    if (!errors.isEmpty()) {
        const messages: string = errors
            .array()
            .map((error) => `${error.msg}: ${error.param}`)
            .join(', ');
        next(new CustomError(messages, 400));
        return;
    }
  
  const filename = req.file?.filename;
  const owner = res.locals.user._id;
  const coordicates = res.locals.coords;

  if (typeof filename === 'string') {
    const newCat = {
        cat_name: req.body.cat_name, 
        weight: Number(req.body.weight), 
        owner: owner, 
        filename, 
        birthdate: req.body.birthdate, 
        location: coordicates,
    };

      try {
        const result = await catModel.create(newCat);
        if (!result) {
            throw new CustomError('Cat not created', 500);
        }
        const response = {
            message: 'Cat added',
            data: result,
        }
        res.json(response);
      } catch (error) {
        next(error)
      }
  }
};

const catPut = async (
    req: Request<{id: string}, {}, Cat>,
    res: Response<MessageResponse & {data: Cat}>,
    next: NextFunction
  ) => {
    try {
      const cat = req.body;
      const user = res.locals.user._id;
      if (!user) {
        throw new CustomError('No user', 400);
      }
      const result = await catModel.findOneAndUpdate(
        {_id: req.params.id, owner: user},
        cat, 
        {new: true}
    );
    if (!result) {
      throw new CustomError('Cat not found', 404);
    }
    const response = {
        message: 'Cat modified by owner',
        data: result,
    }
    res.json(response);
    } catch (error) {
      next(error);
    }
};

const catDelete = async (
    req: Request<{id: string}, {}, Cat>,
    res: Response<MessageResponse>,
    next: NextFunction
  ) => {
    try {
      const result = await catModel.findOneAndDelete(
        {_id: req.params.id, owner: res.locals.user._id}
      );
      if (!result) {
        throw new Error('No cat found');
      }
      const response = {
        message: 'cat deleted by owner',
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
 };

const catPutAdmin = async (
    req: Request<{id: string}, {}, Cat>,
    res: Response<MessageResponse & {data: Cat}>,
    next: NextFunction
) => {
    try {
        const cat = req.body;
        // console.log('user', res.locals.user)
        if (!res.locals.user || res.locals.user.role !== 'admin') {
          throw new CustomError('Not admin', 400);
        }
        const result = await catModel.findByIdAndUpdate(
          req.params.id,
          cat, 
          {new: true}
      );
      if (!result) {
        throw new CustomError('Cat not found', 404);
      }
      const response = {
          message: 'Cat modified by admin',
          data: result,
      }
      res.json(response);
      } catch (error) {
        next(error);
      }
};

const catDeleteAdmin = async (
    req: Request<{id: string}, {}, Cat>,
    res: Response<MessageResponse>,
    next: NextFunction
  ) => {
    try {
      if (!res.locals.user || res.locals.user.role !== 'admin') {
        throw new CustomError('Not admin', 400);
      }
      const result = await catModel.findByIdAndDelete(req.params.id);
      if (!result) {
        throw new Error('No cat found');
      }
      const response = {
        message: 'cat deleted by admin',
        data: result,
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
 };

const catGetByBoundingBox = async (
    req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
    res: Response<Cat[]>,
    next: NextFunction
) => {
    try {
        // query example: /species/area?topRight=40.73061,-73.935242&bottomLeft=40.71427,-74.00597
        // longitude first, then latitude (opposite of google maps)
    
        const {topRight, bottomLeft} = req.query;
        const rightCorner = topRight.split(',');
        const leftCorner = bottomLeft.split(',');
    
        const cats = await catModel.find({
          location: {
            $geoWithin: {
              $box: [leftCorner, rightCorner],
            },
          },
        });
    
        res.json(cats);
      } catch (error) {
        next(error);
      }
};

export {catListGet, catGet, catGetByUser, catPost, catPut, catDelete, catPutAdmin, catDeleteAdmin, catGetByBoundingBox};

