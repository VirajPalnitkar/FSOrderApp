require('dotenv').config();
const express=require('express');
const connectDB=require('./src/config/db');
const ordersRouter=require('./src/routes/orders');
const adminRouter=require('./src/routes/admin');

const app=express();
app.use(express.json());
app.use((req,res,next)=>{
    const start=Date.now();
    res.on("finish", () => { 
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`); 
    });
    next(); 
})


app.get("/health",(req,res)=>{
    res.json({ok:true});
})

app.use('/orders',ordersRouter);
app.use('/admin',adminRouter);

const PORT=process.env.PORT;
(async ()=>{
    try{
        await connectDB();
        app.listen(PORT,()=>{
            console.log(`Server running on PORT ${PORT}`);
        })
    }
    catch(e){
        console.log("Error in starting the server");
    }
})();