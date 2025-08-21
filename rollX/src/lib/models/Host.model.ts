import mongoose, { Schema, Document } from "mongoose";

export interface IHost extends Document {
  user: mongoose.Schema.Types.ObjectId;
  fullName: string;
  organizationName: string;
  organizationId?: string;
}

const HostSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: String,
      trim: true,
    },
    // We will manage the link to groups on the Group model itself for better data normalization.
  },
  { timestamps: true }
);

export default mongoose.models.Host ||
  mongoose.model<IHost>("Host", HostSchema);
