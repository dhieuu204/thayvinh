const { Schema, model } = require("mongoose");

const imageSchema = new Schema(
  {
    data:        { type: Buffer, required: true },
    contentType: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = model("Image", imageSchema);
