import mongoose from "mongoose";
const { Schema, model } = mongoose;

const questionSchema = new Schema({
  question: { 
    type: String, 
    required: [true, "Question text is required"] 
  },
  type: { 
    type: String, 
    enum: {
      values: ["MCQ", "NAT"],
      message: "Question type must be either 'MCQ' or 'NAT'"
    },
    required: [true, "Question type is required"]
  },
  options: {
    type: [String],
  },
  correctAnswer: { 
    type: String, 
    required: [true, "Correct answer is required"] 
  },
  isBonus: { type: Boolean, default: false },
  isDropped: { type: Boolean, default: false },

  marks: { 
    type: Number, 
    default: 4 
  },
  negativeMarks: { 
    type: Number, 
    default: -1 
  },
  unattemptedMarks: { 
    type: Number, 
    default: 0 
  },

  imagePublicId:{
    type: String
  },
  imageUrl: {
    type: String
  }

});

const examSchema = new Schema({
  professor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Professor reference is required"]
  },
  title: { 
    type: String, 
    required: [true, "Exam title is required"] 
  },
  description: { 
    type: String 
  },
  totalMarks: { 
    type: Number, 
    default: 0 
  },
  code: { 
    type: String, 
    required: [true, "Exam code is required"], 
    unique: true,
    index: true
  },
  password: { 
    type: String, 
    required: [true, "Exam password is required"] 
  },
  questions: {
    type: [questionSchema],
    validate: [
      {
        validator: (val) => val.length > 0,
        message: "At least one question is required"
      }
    ]
  },

  scheduledAt: {
    type: Date,
    required: [true, "Scheduled start time is required"]
  },
  duration: {
    type: Number,
    required: [true, "Duration in minutes is required"]
  },
  closeAt: {
    type: Date,
    required: [true, "Exam close time is required"]
  }
}, {
  timestamps: true
});

const Exam = model("Exam", examSchema);

export default Exam;
