import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/user.model.js';
import connectDB from '../config/db.js';

dotenv.config({ path: '../../.env' }); // Adjust path if needed depending on where it's run

const seedUser = async () => {
    // If run from server root, .env is in current directory
    if (!process.env.MONGO_URI) {
        dotenv.config();
    }
    
    await connectDB();

    try {
        await User.deleteMany(); // Clear existing users

        const users = [
            {
                name: 'Alice Smith',
                email: 'alice@example.com',
                password: 'password123',
                isVerified: true,
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
            },
            {
                name: 'Bob Johnson',
                email: 'bob@example.com',
                password: 'password123',
                isVerified: true,
                avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
            },
            {
                name: 'Charlie Brown',
                email: 'charlie@example.com',
                password: 'password123',
                isVerified: true,
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
            },
        ];

        for (const userData of users) {
            const user = new User(userData);
            await user.save();
        }
        
        console.log('Seeder: Users seeded successfully!');
        console.log('Example Email: alice@example.com');
        console.log('Password: password123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding user:', error);
        process.exit(1);
    }
};

seedUser();
