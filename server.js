require('dotenv').config();
const connectDB=require('./config/db');
const express= require('express');
const app= require('./app');
const {connectRedis} = require('./config/redis');

 connectRedis();
const port=process.env.PORT_NUMBER;
connectDB();
app.listen(port,()=>{
    console.log("server started")
})