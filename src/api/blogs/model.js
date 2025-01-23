import mongoose from "mongoose";

const { Schema, model } = mongoose;

const blogSchema = new Schema({
  title: { type: String, required: true },
  photo: {
    type: String,
    required: false,
    default: "https://cdn-icons-png.flaticon.com/512/135/135161.png",
  },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  comments: [{type: Schema.Types.ObjectId, ref: "Comment", required: false}]
});

export default model("Blog", blogSchema);