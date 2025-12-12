import { CustomAPIError } from '../errors/index.js';

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    // Set default
    statusCode: err.statusCode || 500,
    msg: err.message || 'Something went wrong try again later',
  };

  // If it's one of our custom errors, use that status code
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(',');
    customError.statusCode = 400;
  }

  // Mongoose Duplicate Key Error (e.g. Email already exists)
  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = 400;
  }

  // Mongoose Cast Error (e.g. Invalid ID format)
  if (err.name === 'CastError') {
    customError.msg = `No item found with id : ${err.value}`;
    customError.statusCode = 404;
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

export default errorHandlerMiddleware;