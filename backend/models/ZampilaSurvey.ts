import mongoose from 'mongoose';

const ZampilaSurveySchema = new mongoose.Schema({
    surveyId: {
        type: String,
        required: true,
        unique: true,
    },
    tcr: {
        type: Number, // Target Completes Required
        required: true,
    },
    cpi: {
        type: Number, // Cost Per Interview
        required: true,
    },
    loi: {
        type: Number, // Length of Interview
        required: true,
    },
    ir: {
        type: Number, // Incidence Rate
        required: true,
    },
    language: {
        type: String,
        default: 'En-US',
    },
    updateTime: {
        type: Date,
    },
    surveyEndDate: {
        type: Date,
    },
    device: {
        type: String,
        enum: ['Desktop', 'Mobile', 'Both'],
        default: 'Both',
    },
    industryId: {
        type: Number,
    },
    types: {
        type: String,
        default: 'ADHOC',
    },
    // Stats for tracking
    conversion: {
        type: Number,
        default: 0,
    },
    completes: {
        type: Number,
        default: 0,
    },
    disqualified: {
        type: Number,
        default: 0,
    },
    quotaFull: {
        type: Number,
        default: 0,
    },
    securityTerm: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.ZampilaSurvey || mongoose.model('ZampilaSurvey', ZampilaSurveySchema);
