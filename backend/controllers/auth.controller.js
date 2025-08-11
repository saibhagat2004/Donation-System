import { generateTokenAndSetCookie } from '../generateToken.js';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const signup = async (req, res) => {
    try {
        const { fullName = "", username, email, password, googleId, profilePicture,role} = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" });
        }

        let newUser;
        if (googleId) {
            newUser = new User({
                fullName,
                email,
                googleId,
                profilePicture: profilePicture || "",
            });
        } else {
            if (!username || !password || password.length < 6) {
                return res.status(400).json({ error: "Username and password are required, and password must be at least 6 characters long" });
            }
            
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: "Username is already taken" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            newUser = new User({
                fullName,
                username,
                email,
                password: hashedPassword,
                role,
            });
        }

        await newUser.save();
        generateTokenAndSetCookie(newUser._id, res);

        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            username: newUser.username || "", 
            email: newUser.email,
            profilePicture: newUser.profilePicture,
            role:newUser.role
        });
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password, googleId, fullName, profilePicture } = req.body;
        
        let user = await User.findOne({ email });
        
        if (googleId) {
            if (!user) {
                // Create a new account if the user does not exist
                user = new User({
                    fullName,
                    email,
                    googleId,
                    profilePicture: profilePicture || "",
                });
                await user.save();
            }
        } else {
            if (!email || !password) {
                return res.status(400).json({ error: "Email and password are required" });
            }
            
            if (!user || !user.password) {
                return res.status(400).json({ error: "Invalid email or password" });
            }

            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({ error: "Invalid email or password" });
            }
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username || "",
            email: user.email,
            profilePicture: user.profilePicture,
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getMe controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
