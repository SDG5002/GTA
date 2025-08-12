import wrapAsync from "../utils/wrapAsync.js";
import ExpressError from "../utils/ExpressError.js";
import User from "../DB/models/userModel.js";
import { emailVerMailer } from "../utils/emailVerrficationMailer.js";
import jwt from "jsonwebtoken";


const generateAccessAndrefreshTokens=async (userId)=>{
  try {

  const user=await User.findById(userId)

  const accessToken=await user.createAccessToken()
  const refreshToken=await user.createRefreshToken()
  
  user.refreshToken=refreshToken
  await user.save({validateBeforeSave:false})

  return {accessToken, refreshToken}
    
  } catch (error) {
    throw new ExpressError(500,"Something went wronge while generating access and refresh token pp")  
  }

  
}


export const refreshAccessToken = wrapAsync(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new ExpressError(401, 'Unauthorized request');
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ExpressError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decodedToken?._id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ExpressError(401, 'Invalid refresh token');
  }

  const accessToken = await user.createAccessToken(); 
  
  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProduction, 
     sameSite: isProduction ? "none" : "lax",
  };

  res
    .status(200)
    .cookie('accessToken', accessToken, options)
});


export const register = wrapAsync(async (req, res, next) => {
  const { name, role, password, email } = req.body;
  const existedUser = await User.findOne({ email });

  if (existedUser && existedUser.isVerified) {
    return next(new ExpressError(409, "User already exists with given Email"));
  }

  if (existedUser && !existedUser.isVerified) {
    await User.findByIdAndDelete(existedUser._id);
  }

  const newUser = new User({
    name,
    email,
    password,
    role,
    isVerified: false,
  });

  await newUser.save();

  const emailVerificationToken = jwt.sign(
    { _id: newUser._id, email: newUser.email, role: newUser.role },
    process.env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: "15m" }
  );

   const verificationUrl = `${process.env.BACKEND_URL}/user/verify-email?token=${emailVerificationToken}`;


  await emailVerMailer(verificationUrl, newUser.email);

  res.status(201).json({
    msg: "Registration successful! Please check your email to verify your account.",
    user: {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isVerified: newUser.isVerified,
    },
  });
});



export const verifyEmail = wrapAsync(async (req, res, next) => {

  const { token } = req.query;
  if (!token) {
    throw new ExpressError(400, "Invalid or missing token");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
  } catch (err) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?verified=failed`);
  }

 await User.findByIdAndUpdate(decoded._id, { isVerified: true });

 
  const { accessToken, refreshToken } = await generateAccessAndrefreshTokens(decoded._id);

  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.cookie("refreshToken", refreshToken, options);
  res.cookie("accessToken", accessToken, options);
 
   
  if (decoded.role === "student") {
    return res.redirect(`${process.env.FRONTEND_URL}/student-dashboard`);
  }
  if (decoded.role === "professor") {
    return res.redirect(`${process.env.FRONTEND_URL}/teacher-dashboard`);
  }

  res.redirect(`${process.env.FRONTEND_URL}/login?verified=success`);
});


export const verify = wrapAsync(async (req, res) => {
  res.status(200).json({ user: req.user });
});


export const login = wrapAsync(async (req, res,next) => {

  const {email,password}=req.body;

  if(!email){
    const err=new ExpressError("409","Email required.")
    next(err)
  }

  const user= await User.findOne({
    email:email
  })
  
  if(!user){
    next(new ExpressError(409,"User does not exist with given email"))
  }


  const isPassswordValid=await user?.isPasswordCorrect(password)

  if(!isPassswordValid){
    next(new ExpressError(409,"Incorrect Password"))
  }

const {accessToken,refreshToken}=await generateAccessAndrefreshTokens(user?._id)


  

const currentUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )

const isProduction=process.env.NODE_ENV==="production"
  
const options={
    httpOnly:true,
    secure:isProduction,
    sameSite: isProduction ? "none" : "lax",
  }

  
  res.cookie("refreshToken",refreshToken,options)
  res.cookie("accessToken",accessToken,options)

  
 res.json({
    msg: "Very good Login",
    user: currentUser
  });


});


export const logout=wrapAsync(async(req,res)=>{

  await User.findByIdAndUpdate(
    req.user._id,{
      $set:{
        refreshToken:undefined
      }},
      {
        new:true
      }

  )

   const isProduction=process.env.NODE_ENV==="production"
  
  const options={
    httpOnly:true,
    secure:isProduction,
     sameSite: isProduction ? "none" : "lax",
  }

  return res
  .status(200)
  .clearCookie("refreshToken",options)
  .clearCookie("accessToken",options)
  .json({"msg":"user logged out"})

})


export const googleLogin = wrapAsync(async (req, res, next) => {
  const { name, email } = req.body;

  if (!email) {
    return next(new ExpressError(400, "Email is required for Google login"));
  }


  let user = await User.findOne({ email });

  if (!user) {
  
    user = new User({
      name,
      email,
      role: 'user',
    });

    await user.save();
  }


  const { accessToken, refreshToken } = await generateAccessAndrefreshTokens(user._id);

  
  const currentUser = await User.findById(user._id).select("-password -refreshToken");

  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res.cookie("refreshToken", refreshToken, options);
  res.cookie("accessToken", accessToken, options);

  res.json({
    msg: "Google login successful",
    user: currentUser,
  });
});



