import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import db from '../models/index.js'; // Ensure .js extension

// Secret Key (Should be in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'maaj_super_secret_key_2026';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is disabled. Contact Admin.' });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role, permissions: user.permissions },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const seedAdmin = async (req, res) => {
    try {
        const adminEmail = 'admin@maaj.com';
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            // Force update password just in case hash is wrong
            existingAdmin.password = 'password123';
            // Setting plaintext triggers the 'beforeUpdate' hook which hashes it
            await existingAdmin.save();
            console.log('Admin Password Reset to "password123"');

            if (res) return res.json({ message: 'Admin exists, password reset unique' });
            return;
        }

        await User.create({
            username: 'Admin',
            email: adminEmail,
            password: 'password123', // Will be hashed by hook
            role: 'ADMIN',
            permissions: ['ALL_ACCESS']
        });

        console.log('Admin User Created');
        if (res) res.json({ message: 'Admin user created successfully' });

    } catch (err) {
        console.error('Seed Error:', err);
        if (res) res.status(500).json({ error: err.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const register = async (req, res) => {
    try {
        const { username, email, password, role, permissions } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        const newUser = await User.create({
            username,
            email,
            password,
            role: role || 'USER',
            permissions: permissions || [],
            is_active: true
        });

        res.json({ success: true, message: 'User created', data: newUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, role, permissions, is_active } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        user.permissions = permissions || user.permissions;
        if (is_active !== undefined) user.is_active = is_active;

        if (password && password.trim() !== '') {
            user.password = password;
        }

        await user.save();
        res.json({ success: true, message: 'User updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        // ID comes from the Token (Middleware attaches it to req.user)
        const id = req.user.id;
        const { username, email, password } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Only allow updating safe fields
        user.username = username || user.username;
        user.email = email || user.email;

        // Password change logic
        if (password && password.trim() !== '') {
            user.password = password; // Hook will hash it
        }

        await user.save();

        // Return updated user info (excluding password)
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await user.destroy();
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
