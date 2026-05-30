import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // AI result
    grade: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    missingSkills: { type: [String], default: [] },
    feedback: { type: String, default: "" },
    suggestions: { type: [String], default: [] },

    // Context
    jobTitle: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    resumeText: { type: String, default: "" },
    source: { type: String, default: "text" }, // pdf | docx | image | text

    // Cloudinary file storage (authenticated users only)
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    filePublicId: { type: String, default: "" },
    fileResourceType: { type: String, default: "" }, // image | raw | auto
    fileMime: { type: String, default: "" }, // original mimetype for download
  },
  { timestamps: true }
);

export const Analysis = mongoose.model("Analysis", analysisSchema);
