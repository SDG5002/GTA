import mongoose from "mongoose";
import { Schema } from "mongoose";
import { model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const userSchema = new Schema({
    email: {
        type: String,
        required: [true, "Your email is required"],
        unique: true,
    },
    password: {
        type: String,
        minLength: [5, "Password must be at least 5 characters long"],
        required: [true, "Your password is required"],
    },
    name: {
        type: String,
        required: [true, "Your name is required"],
    },
    role: {
        type: String,
        default: "user",
    },
    refreshToken:{
        type: String
    },
    exams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Exam"
      }
    ],
    history: [
      {
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
  ],

  responses: [
    {
      type: Schema.Types.ObjectId,
      ref: "ExamResponses"
    }
  ],
  isVerified: { 
            type: Boolean,
            default: false 
              },
  createdAt: {
    type: Date,
    default: Date.now
  },


    
},
{timestamps: true}
);

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password);

}

userSchema.methods.createAccessToken=async function(){

  return jwt.sign(
    {
      _id:this._id,
      email:this.email,
      name:this.name,
      role:this.role,
      createdAt:this.createdAt
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }

  )
  
}

userSchema.methods.createRefreshToken=async function(){

  return jwt.sign(
    {
      _id:this._id,
      
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }

  )
  
}


const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;

