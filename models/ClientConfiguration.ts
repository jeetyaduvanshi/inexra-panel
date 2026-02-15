import mongoose from 'mongoose';

const ClientConfigurationSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true,
        unique: true,
        enum: ['Pure Spectrum', 'Torfac', 'Zampila'],
    },
    apiKey: {
        type: String,
        required: true,
    },
    apiEndpoint: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
});

export default mongoose.models.ClientConfiguration || mongoose.model('ClientConfiguration', ClientConfigurationSchema);

