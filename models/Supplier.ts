import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    supplierName: {
        type: String,
        required: true,
    },
    originalLink: {
        type: String,
        required: true,
    },
    trackingSlug: {
        type: String,
        unique: true,
        required: true,
    },
    hits: {
        type: Number,
        default: 0,
    },
    completes: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
