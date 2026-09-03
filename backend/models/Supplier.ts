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

    // ── Supplier-level financials & caps ────────────────────────
    cpi: {
        type: Number,   // Supplier Cost Per Interview
        default: 0,
        min: 0,
    },
    requiredCompletes: {
        type: Number,   // Target completes for this supplier
        default: 0,
        min: 0,
    },
    maxRedirects: {
        type: Number,   // Cap on total survey entries
        default: 500000,
        min: 0,
    },

    // ── Auto-generated URLs ────────────────────────────────────
    surveyLink: {
        type: String,   // Generated entry URL: /survey-start?pid=&sid=&uid=
        default: '',
    },
    testLink: {
        type: String,   // Generated test URL
        default: '',
    },
    completionUrl: {
        type: String,   // Redirect-back URL for complete
        default: '',
    },
    terminateUrl: {
        type: String,   // Redirect-back URL for terminate/DQ
        default: '',
    },
    quotaFullUrl: {
        type: String,   // Redirect-back URL for quota full
        default: '',
    },
    securityUrl: {
        type: String,   // Redirect-back URL for security term
        default: '',
    },

    // ── Live Stats ─────────────────────────────────────────────
    hits: {
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
    drop: {
        type: Number,
        default: 0,
    },

    // ── Meta ───────────────────────────────────────────────────
    status: {
        type: String,
        enum: ['active', 'paused'],
        default: 'active',
    },
    notes: {
        type: String,
        default: '',
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

// Auto-update updatedAt
SupplierSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});

// Compound index for efficient queries
SupplierSchema.index({ projectId: 1, status: 1 });

// Force schema refresh after changes
if (mongoose.models.Supplier) {
    delete mongoose.models.Supplier;
}

export default mongoose.model('Supplier', SupplierSchema);
