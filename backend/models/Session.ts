import mongoose from 'mongoose';

const FINAL_STATUSES = ['complete', 'disqualified', 'quota_full', 'security', 'drop'];

const SessionSchema = new mongoose.Schema({
    // ── Identifiers ────────────────────────────────────────────
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
    },
    respondentUid: {
        type: String,
        required: true,
        index: true,
    },

    // ── Tracking Data ──────────────────────────────────────────
    ip: {
        type: String,
        default: 'unknown',
    },
    userAgent: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['started', 'complete', 'disqualified', 'quota_full', 'security', 'drop'],
        default: 'started',
        index: true,
    },
    payout: {
        type: Number,
        default: 0,
    },

    // ── Timestamps ─────────────────────────────────────────────
    entryTimestamp: {
        type: Date,
        default: Date.now,
    },
    exitTimestamp: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true, // adds createdAt and updatedAt
});

// Compound indexes for efficient queries
SessionSchema.index({ projectId: 1, status: 1 });
SessionSchema.index({ supplierId: 1, status: 1 });
SessionSchema.index({ projectId: 1, supplierId: 1 });
SessionSchema.index({ respondentUid: 1, projectId: 1 });

// Static: check if status is already final
SessionSchema.statics.isFinalStatus = function (status: string): boolean {
    return FINAL_STATUSES.includes(status);
};

// Force schema refresh after changes
if (mongoose.models.Session) {
    delete mongoose.models.Session;
}

export default mongoose.model('Session', SessionSchema);
