 //server.js
import express from "express";
import path from "path";
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import cors from "cors";
// import {v2 as cloudinary} from "cloudinary"
import connectMongoDB  from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";

import authRoutes from "./routers/auth.route.js"
import userRouter from "./routers/user.route.js"
import cashfreepgRouter from "./routers/cashfreepg.route.js"
import campaignRouter from "./routers/campaign.route.js"
import ngoRouter from "./routers/ngo.route.js"
import donationsRouter from "./routers/donations.route.js"

dotenv.config(); //use to read .env content
// cloudinary.config(
//     {
//          cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
//          api_key:process.env.CLOUDINARY_API_KEY,
//          api_secret: process.env.CLOUDINARY_API_SECRET
//      }
// );

const app = express();
app.use(bodyParser.json());
const PORT=process.env.PORT || 5000
const __dirname =path.resolve()

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({limit:"5mb"}));  //for parse req.body     also make sure limit limit should not me to large as it can be missuse  and can be attack.
app.use(express.urlencoded({extended:true})); //to parse from data(urlencoded)
  
app.use(cookieParser());  // parses cookies attached to the client request object, 
                          //making them accessible via req.cookies. 

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/auth",authRoutes);
app.use("/api/users",userRouter);
app.use("/api/cashfreepg",cashfreepgRouter);
app.use("/api/campaigns",campaignRouter);
app.use("/api/ngo",ngoRouter);
app.use("/api/donations",donationsRouter);

// Health check endpoint for Render
app.get("/api/auth/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});

// app.use("/api/v2/cashfree", v2Routes); // new version

 
 if (process.env.NODE_ENV === "production") {         //if we not hit our endpoint run this
	const frontendDistPath = path.join(__dirname, "../frontend/dist");
	app.use(express.static(frontendDistPath));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(frontendDistPath, "index.html"));
	});
}

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
    connectMongoDB();
});
