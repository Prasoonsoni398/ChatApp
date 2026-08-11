import dotenv from "dotenv"
dotenv.config()
import express from 'express';


const app = express();
app.use(express.json())

app.get("/",(req,res)=>{
    res.send("Welcome to ChatApp Server");
});


const Port = process.env.PORT || 5000;
app.listen(Port,()=>{
    console.log(`Server is running on port ${Port}`);
});
