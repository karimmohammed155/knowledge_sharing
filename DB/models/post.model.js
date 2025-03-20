import mongoose from "../global-setup.js";
const { model, Schema } = mongoose;

const post_schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
        unique: true,
      },
    },
    custom_id: {
      type: String,
      required: true,
      unique: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    interactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "interaction",
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "comment",
      },
    ],
    admin: {
      type: Schema.Types.ObjectId,
      ref: "admin",
      required: false, // todo
    },
  },
  { timestamps: true, versionKey: false }
);

export const post = mongoose.models.post || model("post", post_schema);
