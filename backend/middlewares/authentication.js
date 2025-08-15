import jwt from "jsonwebtoken";
import User from "../DB/models/userModel.js";
import ExpressError from "../utils/ExpressError.js";

const isProduction = process.env.NODE_ENV === "production";

const authenticate = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;


  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      req.user = decoded;
      console.log(req.user)
      
      return next();
    } catch (err) {
     
    }
  }


  if (!refreshToken) {
    return next(new ExpressError(401, "Not logged in. Please log in again."));
  }

  try {
    const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedRefresh._id);

    if (!user || user.refreshToken !== refreshToken) {
      return next(new ExpressError(401, "Invalid refresh token. Please login again."));
    }

    const newAccessToken = await user.createAccessToken();
    const newRefreshToken = await user.createRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
    });

    
    req.user = jwt.verify(newAccessToken, process.env.ACCESS_TOKEN_SECRET);
   
    next();
  } catch (err) {
    return next(new ExpressError(401, "Session expired. Please log in again."));
  }
};

export default authenticate;
