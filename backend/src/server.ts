import express from 'express';
import cors from 'cors';
import siteRoutes from './routes/siteRoutes';
import authRoutes from './routes/authRoutes';
import storeRoutes from './routes/storeRoutes';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import inventoryRequestRoutes from './routes/inventoryRequestRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { authenticateToken } from './middleware/authMiddleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow Frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
// Public routes
app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Protected routes
app.use('/api/*', authenticateToken); // Apply auth middleware to all /api routes
app.use('/api/sites', siteRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes); // Inventory Actions (Adjust, Transfer)
app.use('/api/requests', inventoryRequestRoutes); // Inventory Requests (Workflow)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.send('Construction Inventory System API');
});

// Only listen if not running on Vercel (Vercel handles the server)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
