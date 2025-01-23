import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  blog: {type: Schema.Types.ObjectId, ref: "Blog", required: true},
  comment: {type: Text, required: true}
});

export default model("Comment", commentSchema);