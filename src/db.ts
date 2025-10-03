import mongoose, { Schema, model } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
interface IUser {
  name: string;
  password: string;
}
if (!process.env.DATABASE_URL) {
  throw new Error("MongoDB_URL environment variable is missing!");
}
mongoose.connect(process.env.DATABASE_URL);
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected!');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
const UserSchema = new Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
});
export const UserModel = model('User', UserSchema);

// Dedicated subdocument schema for uploaded documents (no _id needed per item)
const DocumentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  cloudinaryId: { type: String, required: true }
}, { _id: false });

const ContentSchema = new Schema({
  type: { type: String },
  title: { type: String },
  link: { type: String },
  note: { type: String },
  richNoteDelta: { type: Schema.Types.Mixed },
  documents: { type: [DocumentSchema], default: [] },
  tags: [{ type: mongoose.Schema.Types.ObjectId }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt:{type:Date,default:Date.now},
  updatedAt:{type:Date,default:Date.now}
});

// If the model was previously compiled with an incorrect schema (e.g., documents:String),
// remove it so we can apply the corrected array-of-subdocuments schema.
if (mongoose.models.Content) {
  delete mongoose.models.Content;
}
export const ContentModel = model('Content', ContentSchema);


const linkSchema = new Schema({
  hash: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
})
export const LinkModel = model('Link', linkSchema);