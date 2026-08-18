import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import connectDB from './src/config/db.js';
import authRouter from './src/routers/auth.router.js';
import userRouter from './src/routers/user.router.js';
import messageRouter from './src/routers/message.router.js';

connectDB();

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/messages', messageRouter);

app.get("/",(req,res)=>{
    res.send("Welcome to ChatApp Server");
});

const Port = process.env.PORT || 5000;
app.listen(Port,()=>{
    console.log(`Server is running on port ${Port}`);
});
