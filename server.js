require('dotenv').config();
const express= require('express');
const app= require('./app');
const port=process.env.PORT;
app.listen(port,()=>{
    console.log("server started")
})