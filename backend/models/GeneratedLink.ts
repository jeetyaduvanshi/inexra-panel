import mongoose from 'mongoose';

const FINAL_STATUSES = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];

const GeneratedLinkSchema = new mongoose.Schema({
    txid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    surveyId: {
        type: String,
        required: true,
        index: true,
    },
    uid: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        default: 'unknown',
    },
    vendor: {
        type: String,
        default: 'zampila',
        index: true,
    },
    status: {
        type: String,
        enum: ['clicked', 'complete', 'disqualified', 'quota_full', 'security', 'drop'],
        default: 'clicked',
        index: true,
    },
    payout: {
        type: Number,
        default: 0,
    },
    generatedUrl: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // adds createdAt and updatedAt automatically
});

// Compound indexes for efficient queries
GeneratedLinkSchema.index({ vendor: 1, status: 1 });
GeneratedLinkSchema.index({ surveyId: 1, status: 1 });
GeneratedLinkSchema.index({ vendor: 1, createdAt: -1 });

// Static: check if status is already final (prevent duplicate updates)
GeneratedLinkSchema.statics.isFinalStatus = function (status: string): boolean {
    return FINAL_STATUSES.includes(status);
};

// Delete stale cached model to force schema refresh (required after schema changes)
if (mongoose.models.GeneratedLink) {
    delete mongoose.models.GeneratedLink;
}

export default mongoose.model('GeneratedLink', GeneratedLinkSchema);
