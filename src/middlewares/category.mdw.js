import * as categoryModel from '../models/category.model.js';

export async function categoryMiddleware(req, res, next) {
  const [plist, clist] = await Promise.all([
    categoryModel.findLevel1Categories(),
    categoryModel.findLevel2Categories(),
  ]);
  res.locals.lcCategories1 = plist;
  res.locals.lcCategories2 = clist;
  next();
}