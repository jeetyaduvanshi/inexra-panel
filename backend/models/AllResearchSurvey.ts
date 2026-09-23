import mongoose from 'mongoose';

const AllResearchSurveySchema = new mongoose.Schema({
    // Core identifiers from All Research API
    surveyId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    surveyCode: {
        type: String,
        default: '',
    },
    surveyName: {
        type: String,
        default: '',
    },

    // Location & Language
    surveyCountry: {
        type: String,
        default: '',
    },
    surveyLanguage: {
        type: String,
        default: 'English',
    },

    // Category & Type
    surveyCategory: {
        type: String,
        default: '',
    },
    surveyCurrency: {
        type: String,
        default: 'USD',
    },
    audienceType: {
        type: String,
        default: '',
    },

    // Survey Metrics
    incidenceRate: {
        type: Number,
        default: 0,
    },
    lengthOfInterview: {
        type: Number,
        default: 0,
    },
    costPerInterview: {
        type: Number,
        default: 0,
    },

    // Quota Information
    completeNeeded: {
        type: Number,
        default: 0,
    },
    liveClickQuota: {
        type: Number,
        default: 0,
    },
    testClickQuota: {
        type: Number,
        default: 0,
    },

    // Dates
    surveyStartDate: {
        type: String,
        default: '',
    },
    surveyEndDate: {
        type: String,
        default: '',
    },

    // Entry URLs (contain [identifier] placeholder from All Research)
    entryLiveUrl: {
        type: String,
        default: '',
    },
    entryTestUrl: {
        type: String,
        default: '',
    },

    // Device & Status
    deviceType: {
        type: String,
        default: 'Desktop,Mobile,Tablet',
    },
    surveyStatus: {
        type: String,
        default: 'Live',
    },
    buyerId: {
        type: String,
        default: '',
    },
    targetSpec: {
        type: String,
        default: '',
    },

    // Flags
    collectsPii: {
        type: String,
        default: 'No',
    },
    applicationDownload: {
        type: String,
        default: 'No',
    },
    facialCoding: {
        type: String,
        default: 'No',
    },

    // Qualifications (targeting criteria) stored as raw JSON
    qualifications: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
    },

    // Internal Stats (tracked by INEXRA panel)
    hits: {
        type: Number,
        default: 0,
    },
    completes: {
        type: Number,
        default: 0,
    },
    terminates: {
        type: Number,
        default: 0,
    },
    quotaFull: {
        type: Number,
        default: 0,
    },
    security: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true, // adds createdAt and updatedAt
});

export default mongoose.models.AllResearchSurvey ||
    mongoose.model('AllResearchSurvey', AllResearchSurveySchema);
