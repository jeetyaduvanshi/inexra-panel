import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    projectName: {
        type: String,
        required: [true, 'Please provide a project name'],
    },
    studyType: {
        type: String, // e.g., B2B, B2C
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    ir: {
        type: Number, // Incidence Rate
        required: true,
    },
    loi: {
        type: Number, // Length of Interview
        required: true,
    },
    status: {
        type: String,
        enum: ['Bidding', 'Running', 'Awaiting', 'Closed'],
        default: 'Bidding',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
