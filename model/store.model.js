const locationSchema = new mongoose.Schema(
    {
        country: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        landmark: {
            type: String,
            trim: true
        }
    },
    { _id: false }
);


const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        socialMediaHandle: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        location: {
            type: locationSchema,
            required: true
        },

        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

storeSchema.index({ ownerId: 1 });