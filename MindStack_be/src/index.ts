import express from "express";
import * as z from "zod";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ContentModel, UserModel, LinkModel } from "./db";
import cors from "cors";
const app = express();
import { JWT_PASSWORD } from "./config";
import { middleware } from "./middleware/auth";
import { random } from "lodash";
import cloudinaryRouter from './utils/cloudinary';
import { upsertToPinecone, deleteFromPinecone, searchInPinecone } from './utils/pinecone';
import { buildEmbeddingText } from "./utils/textExtractor";
import { Pinecone } from "@pinecone-database/pinecone";

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors());

// declare module 'express' {
//   interface Request {
//     userId?: string;
//   }
// }
const saltRounds=10;

const signupSchema = z.object({
    username: z.string().min(3,"Username must be at least 3 characters long")
    .max(30,"Username must be at most 30 characters long")
    .regex(/^[a-zA-Z0-9_]+$/,"Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Please enter a valid email address"),
    password:z.string().min(6,"Password must be at least 6 characters long")
    .max(100,"Password must be at most 100 characters long"),
})

const signinSchema = z.object({
    username: z.string().min(3,"Username must be at least 3 characters long")
    .max(30,"Username must be at most 30 characters long")
    .regex(/^[a-zA-Z0-9_]+$/,"Username can only contain letters, numbers, and underscores"),
    password:z.string().min(6,"Password must be at least 6 characters long")
    .max(100,"Password must be at most 100 characters long"),
})
app.use('/api/v1/cloudinary', cloudinaryRouter);

app.post("/api/v1/signup", async (req, res) => {
    const parseResult = signupSchema.safeParse(req.body);
    if(!parseResult.success){
        const errors = parseResult.error.issues.map((e) => e.message);
        res.status(400).json({ message: "Invalid input", errors });
        return;
    }
    const {username,email,password} = parseResult.data;
    

    try {
        const existingUser = await UserModel.findOne({
            $or: [{ name: username }, { email: email.toLowerCase() }],
        });
        if (existingUser) {
            res.status(409).json({
                message: existingUser.email === email.toLowerCase()
                    ? "Email already taken"
                    : "Username already taken",
            });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await UserModel.create({
            name: username,
            email,
            password: hashedPassword,
        });
        res.json({ message: "User created successfully" });
    } catch (error:any) {
        if (error.code === 11000) {
            res.status(409).json({ message: "Username or email already taken" });
        } else {
            res.status(500).json({ message: "Error creating user" });
        }
    }
});

app.post("/api/v1/signin", async (req, res) => {
    const parseResult = signinSchema.safeParse(req.body);
    if(!parseResult.success){
        const errors = parseResult.error.issues.map((e) => e.message);
        res.status(400).json({ message: "Invalid input", errors });
        return;
    }
    const {username,password} = parseResult.data;
    const existingUser = await UserModel.findOne({
        name: username
    });
    try{
        if (existingUser && existingUser.password) {
        const passwordMatch = await bcrypt.compare(password,existingUser.password);
        if(passwordMatch){
            const token = jwt.sign(
            {
                id: existingUser._id,
            },
            JWT_PASSWORD!
        );

        res.json({
            token,
            username: existingUser.name,
        });
        return;
        }
    } }catch(err){
    
         res.status(403).json({ message: "Incorrect credentials" });
        return;
    } 
});

app.get("/api/v1/me", middleware, async (req, res) => {
    const user = await UserModel.findById(req.userId).select("name");

    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }

    res.json({
        username: user.name,
    });
});

app.post("/api/v1/content", middleware, async (req, res) => {
    const { link, type, note, title, richNoteDelta } = req.body;
    const documents = req.body.documents;
    const userId = req.userId as string;
    // Runtime diagnostics to help debug incorrect payload shape
    // console.log("[CREATE_CONTENT] userId=", req.userId, "documents typeof=", typeof documents, Array.isArray(documents) ? `array(length=${documents.length})` : 'not-array');
    try {
        const doc = await ContentModel.create({
            link,
            type,
            note,
            title,
            richNoteDelta,
            documents: Array.isArray(documents) ? documents : (documents ? [documents] : []),
            userId: userId,
            tags: [],
        });

        const embeddingText = buildEmbeddingText({
            title,
            note,
            richNoteDelta,
            documents: Array.isArray(documents) ? documents : (documents ? [documents] : []),
        });

        await upsertToPinecone({
            userId: userId,
            contentId: doc._id.toString(),
            embeddingText: embeddingText,
            metadata: {
                title,
                type
            }
        });

        res.json({
            message: "Content created successfully",
            id: doc._id
        });
    } catch (e: any) {
        // console.error("[CREATE_CONTENT][ERROR]", e?.message, e?.errors || e);
        res.status(400).json({ message: "Content validation failed", error: e?.message, details: e?.errors });
        return;
    }
});
app.get("/api/v1/content", middleware, async (req, res) => {
    const userId = req.userId;
    const page = Number (req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const type = req.query.type as string | undefined;

    const query: any = {userId};

    if(type && type!="all"){
        query.type = type;
    }

    const skip = (page - 1 ) * limit;

    const content = await ContentModel.find(query)
    .sort({_id:-1})
    .skip(skip)
    .limit(limit)
    .populate("userId","username");

    const totalItems = await ContentModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems /limit);

    res.json({
        content,
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
    });

});

app.delete("/api/v1/content/:id", middleware, async (req, res) => {
    const contentId = String(req.params.id);
    const userId = req.userId as string;
    await ContentModel.deleteOne({
        _id: contentId,
        userId: userId,
    });
    deleteFromPinecone(userId, contentId).catch(err =>{
        console.error('Failed to delete from Pinecone',err);
    });

    res.json({ message: "Content deleted successfully" });
});

app.put("/api/v1/content/:id", middleware, async (req, res) => {
    const contentId = String(req.params.id);
    const { title, link, type, note, richNoteDelta, documents } = req.body;
    const doc = await ContentModel.findOne({
        _id: contentId,
        userId: req.userId,
    });
    if (!doc) {
        res.status(404).json({ message: "Content not found" });
        return;
    }
    if (title !== undefined) doc.title = title;
    if (link !== undefined) doc.link = link;
    if (type !== undefined) doc.type = type;
    if (note !== undefined) doc.note = note;
    if (richNoteDelta !== undefined) doc.richNoteDelta = richNoteDelta;
    if (documents !== undefined) doc.documents = documents;
    await doc.save();
    //for pinecone embedding text updating 
    const embeddingText = buildEmbeddingText({
        title: doc.title ?? undefined,
        note: doc.note ?? undefined,
        richNoteDelta: doc.richNoteDelta,
        documents: doc.documents,
    });

    await upsertToPinecone({
        userId: req.userId as string,
        contentId: doc._id.toString(),
        embeddingText: embeddingText,
        metadata: {
            title: doc.title || 'Untitled',
            type: doc.type || 'random'
        }
    });
    res.json({ message: "Content updated", content: doc });
});

app.post("/api/v1/search",middleware,async(req,res)=>{
    const {query} = req.body;
    if(!query || !query.trim()){
     res.status(400).json({error:'Query is required'});
     return;
    }
    try{
        const pineconeResults = await searchInPinecone(req.userId as string, query);
        console.log(`Found ${pineconeResults.length} Pinecone results`);

        if(pineconeResults.length === 0){
             res.json({results:[]});
             return;
        }  

       
const results = pineconeResults
      .map((h: any) => ({
        _id: String(h.id ?? h._id),
        score: Number(h.score ?? h._score),
      }))
      .filter(r => r._id && !Number.isNaN(r.score));

    res.json({ results, count: results.length, query });
    return;
  } catch (error: any) {
    console.error("Search Error:", error);
    res.status(500).json({ error: "Search failed", details: error.message });
    return;
  }
});
// ...exis
app.post("/api/v1/brain/share", middleware, async (req, res) => {
    const share = req.body.share;
    if (share) {
        //@ts-ignore
        const existingLink = await LinkModel.findOne({ userId: req.userId });
        if (existingLink) {
            res.json({
                hash: existingLink.hash,
            });
            return;
        }
        const hash = random(10);
        await LinkModel.create({
            //@ts-ignore
            userId: req.userId,
            hash: hash,
        });
        res.json({
            hash,
        });
    } else {
        //@ts-ignore
        await LinkModel.deleteMany({ userId: req.userId });
        res.json({
            message: "Share disabled",
        });
    }
});

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;
    const link = await LinkModel.findOne({
        hash,
    });
    if (!link) {
        res.status(411).json({
            message: "sorry incorrect url",
        });
        return;
    }
    const content = await ContentModel.find({
        userId: link.userId,
    });
    const user = await UserModel.findOne({ _id: link.userId });

    if (!user) {
        res.status(411).json({
            message: "user not found",
        });
        return;
    }
    res.json({
        username: user.name,
        content: content,
    });
});
const PORT = process.env.PORT || 3020;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
