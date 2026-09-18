import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    projectId: {
        type: Number,
        index: true,
    },
    // ── Basic Information ─────────────────────────────────────
    projectName: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
    },
    parentId: {
        type: String,
        default: null,
    },
    studyType: {
        type: String,
        enum: ['B2B', 'B2C', 'Healthcare', 'Academic', 'Government', 'Technology', 'Finance', 'Retail', 'Other'],
        required: [true, 'Study type is required'],
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
    },
    language: {
        type: String,
        default: 'English',
        trim: true,
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        default: 'US Dollar',
    },
    cpi: {
        type: Number,   // Client Budget / Cost Per Interview
        default: 0,
        min: 0,
    },
    surveyLink: {
        type: String,
        default: '',
        trim: true,
    },
    surveyTestLink: {
        type: String,
        default: '',
        trim: true,
    },

    // ── Expected Metrics ──────────────────────────────────────
    requiredCompletes: {
        type: Number,
        default: 0,
        min: 0,
    },
    ir: {
        type: Number,   // Incidence Rate (%)
        required: [true, 'IR is required'],
        min: 0,
        max: 100,
    },
    loi: {
        type: Number,   // Length of Interview (minutes)
        required: [true, 'LOI is required'],
        min: 0,
    },
    supportedDevices: {
        type: [String],
        enum: ['Desktop', 'Mobile', 'Tablet'],
        default: ['Desktop', 'Mobile', 'Tablet'],
    },

    // ── People ────────────────────────────────────────────────
    clientName: {
        type: String,
        default: '',
        trim: true,
    },
    pm: {
        type: String,   // Project Manager
        default: '',
        trim: true,
    },
    sm: {
        type: String,   // Sales Manager
        default: '',
        trim: true,
    },

    // ── Live Stats (updated by tracking system) ───────────────
    hits: { type: Number, default: 0, min: 0 },
    completes: { type: Number, default: 0, min: 0 },
    disqualify: { type: Number, default: 0, min: 0 },
    quotaFull: { type: Number, default: 0, min: 0 },
    securityTerm: { type: Number, default: 0, min: 0 },
    drop: { type: Number, default: 0, min: 0 },

    // ── Memorandum ────────────────────────────────────────────
    status: {
        type: String,
        enum: ['Bidding', 'Running', 'Testing', 'Hold', 'Completed', 'Closed'],
        default: 'Bidding',
    },
    notes: {
        type: String,
        default: '',
    },
    projectBrief: {
        type: String,
        default: '',
    },

    // ── Timestamps ────────────────────────────────────────────
    startDate: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Auto-update updatedAt on save
ProjectSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
