import mongoose, { Schema, model } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

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
  email: { type: String, unique: true, sparse: true, required: true, lowercase: true, trim: true },
  password: { type: String},
   provider: {
    type: String,
    enum: ["credentials", "google"],
    default: "credentials",
  },
  emailVerified: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String },
  emailVerificationExpiresAt: { type: Date },
  resetPasswordTokenHash: { type: String },
  resetPasswordExpiresAt: { type: Date },
});
export const UserModel = model('User', UserSchema);

UserModel.collection.dropIndex('name_1').catch((err: any) => {
  if (err?.codeName !== 'IndexNotFound') {
    console.warn('Failed to drop legacy User.name index:', err?.message || err);
  }
});


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


if (mongoose.models.Content) {
  delete mongoose.models.Content;
}
export const ContentModel = model('Content', ContentSchema);


const linkSchema = new Schema({
  hash: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
})
export const LinkModel = model('Link', linkSchema);
