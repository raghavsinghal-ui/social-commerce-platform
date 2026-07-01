require('dotenv').config();
const connectDB=require('./config/db');
const express= require('express');
const app= require('./app');
const port=process.env.PORT;
connectDB();
app.listen(port,()=>{
    console.log("server started")
})