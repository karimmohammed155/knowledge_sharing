import { nanoid } from "nanoid";
import {
  category,
  comment,
  interaction,
  post,
  sub_category,
} from "../../../DB/models/index.js";
import { cloudinary, Error_handler_class } from "../../utils/index.js";
import transcribeAudio from "../../utils/transcribe.js";
import fs from "fs";
import { Filter } from "bad-words";
import axios from "axios";

// Create new post api
export const add_post = async (req, res, next) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return next(
      new Error_handler_class(
        "title and content are required",
        400,
        "add post api"
      )
    );
  }

// 1. Predict subcategory using AI
let finalSubCategory = null;
let finalCategory = null;

try {
  const response = await axios.post(
    "https://api-inference.huggingface.co/models/yazied49/knowledge_disability_model",
    {
      inputs: `${title} ${content}`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AiToken}`,
      },
    }
  );

  const predictions = response.data?.[0]; // since it's a 2D array
  if (!predictions || predictions.length === 0) {
    return next(
      new Error_handler_class(
        "AI did not return any predictions.",
        500,
        "add post api"
      )
    );
  }

  const topPrediction = predictions[0];
  const predictedCategory = topPrediction.label?.category;
  const predictedSubCategory = topPrediction.label?.sub_category;

  if (!predictedCategory || !predictedSubCategory) {
    return next(
      new Error_handler_class(
        "AI model returned invalid prediction structure.",
        500,
        "add post api"
      )
    );
  }

  // First, find the category
  finalCategory = await category.findOne({
    name: { $regex: `^${predictedCategory}$`, $options: "i" },
  });

  if (!finalCategory) {
    return next(
      new Error_handler_class(
        `Predicted category "${predictedCategory}" not found in database.`,
        400,
        "add post api"
      )
    );
  }

  // Then, find the subcategory within that category
  finalSubCategory = await sub_category.findOne({
    name: { $regex: `^${predictedSubCategory}$`, $options: "i" },
    category: finalCategory._id,
  });

  if (!finalSubCategory) {
    return next(
      new Error_handler_class(
        `Subcategory "${predictedSubCategory}" not found in category "${predictedCategory}".`,
        400,
        "add post api"
      )
    );
  }

} catch (error) {
  console.error("AI prediction error:", error.response?.data || error.message);
  return next(
    new Error_handler_class(
      "Failed to predict category/subcategory from AI service.",
      500,
      "add post api"
    )
  );
}
const filter = new Filter();
  const containsBadWords = filter.isProfane(title) || filter.isProfane(content);

  // 3. Upload files to Cloudinary
  const urls = [];
  const custom_id = nanoid(4);

  if (req.files?.length > 0) {
    try {
      for (const file of req.files) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          {
            folder: `${process.env.CLOUD_FOLDER_NAME}/posts/${custom_id}`,
            use_filename: true,
          }
        );
        urls.push({ secure_url, public_id });
      }
    } catch (error) {
      return next(
        new Error_handler_class(
          "Failed to upload files to Cloudinary.",
          500,
          "add_post API"
        )
      );
    }
  }
  // 4. Save post
  const new_post = new post({
    title,
    content,
    sub_category: finalSubCategory?._id,
  files: {
      urls: urls.length > 0 ? urls : undefined,
      custom_id,
    },
    author: req.user._id,
    isFlagged: containsBadWords,
    flagReason: containsBadWords
      ? "Contains inappropriate language"
      : undefined,
  });

  await new_post.save();

  res.status(201).json({
    message: "Post created successfully",
    autoFlagged: containsBadWords,
    category:finalCategory?.name,
    predictedSubCategory: finalSubCategory?.name,
    data: new_post,
  });

};


// Get all posts api
export const get_all_posts = async (req, res, next) => {
  // Get posts with their all details
  const posts = await post
    .find()
    .populate("author", "name")
    .populate({
      path: "comments",
      match: { parent_comment: null },
      populate: {
        path: "replies",
        populate: { path: "author", select: "name" },
      },
    })
    .populate("interactions")
    .sort({ createdAt: -1 });
  if (!posts) {
    return next(
      new Error_handler_class("posts not found", 404, "posts not found")
    );
  }
  // Get posts with their stats
  const postsWithStats = await Promise.all(
    posts.map(async (post) => {
      const likes_count = await interaction.countDocuments({
        post_id: post._id,
        type: "like",
      });
      const ratings = await interaction.find({
        post_id: post._id,
        type: "rating",
      });
      const saves_count = await interaction.countDocuments({
        post_id: post._id,
        type: "save",
      });
      return {
        ...post._doc,
        likes_count,
        ratings_count: ratings.length,
        saves_count,
      };
    })
  );
  // response
  res.json({ posts: postsWithStats });
};
// Get specific posts api
export const get_specific_post = async (req, res, next) => {
  const { _id } = req.params;
  // Get post with it's all details
  const specific_post = await post
    .findById(_id)
    .populate("author", "name")
    .populate({
      path: "comments",
      match: { parent_comment: null },
      populate: {
        path: "replies",
        populate: { path: "author", select: "name" },
      },
    })
    .populate("interactions");
  // Check if the posts exists
  if (!specific_post) {
    return next(
      new Error_handler_class("posts not found", 404, "posts not found")
    );
  }
  // Get post with it's stats
  const likes_count = await interaction.countDocuments({
    post_id: specific_post._id,
    type: "like",
  });
  const ratings = await interaction.find({
    post_id: specific_post._id,
    type: "rating",
  });
  const saves_count = await interaction.countDocuments({
    post_id: specific_post._id,
    type: "save",
  });
  // response
  res.json({
    post: specific_post,
    likes_count,
    ratings_count: ratings.length,
    saves_count,
  });
};
// Update post api
export const update_post = async (req, res, next) => {
  const { post_id } = req.params;
  const { title, content } = req.body;

  try {
    // Find the existing post
    const existingPost = await post.findById(post_id);
    if (!existingPost) {
      return next(
        new Error_handler_class("Post not found", 404, "update post api")
      );
    }

    // Verify authorization
    if (existingPost.author.toString() !== req.user._id.toString()) {
      return next(
        new Error_handler_class(
          "Unauthorized to update this post",
          403,
          "update post api"
        )
      );
    }

    // Update basic fields
    if (title) existingPost.title = title;
    if (content) existingPost.content = content;
    existingPost.updated_at = Date.now();

    // Handle file updates if new files are provided
    if (req.files && req.files.length > 0) {
      // Delete existing files if they exist
      if (existingPost.files?.urls?.length > 0) {
        const public_ids = existingPost.files.urls.map(
          (file) => file.public_id
        );
        await cloudinary.api.delete_resources(public_ids);
      }

      // Upload new files
      const newUrls = [];
      const customId = existingPost.files?.custom_id || nanoid(4);

      for (const file of req.files) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          {
            folder: `${process.env.CLOUD_FOLDER_NAME}/posts/${customId}`,
            use_filename: true,
          }
        );
        newUrls.push({ secure_url, public_id });
      }

      existingPost.files = {
        urls: newUrls,
        custom_id: customId,
      };
    }

    // Save the updated post
    const updatedPost = await existingPost.save();

    // response
    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    return next(
      new Error_handler_class(
        error.message || "Failed to update post",
        error.statusCode || 500,
        "update post api"
      )
    );
  }
};
// Delete post api
export const delete_post = async (req, res, next) => {
  const { post_id } = req.params;

  try {
    // 1. Fetch post
    const find_post = await post.findById(post_id);

    // 2. If post not found, return 404
    if (!find_post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 3. Authorization check (user or admin can delete)
    const isAuthor =
      req.user && find_post.author.toString() === req.user._id.toString();
    const isAdmin = !!req.admin;

    if (!isAuthor && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this post" });
    }

    // 4. Delete post assets from Cloudinary
    if (find_post.files?.custom_id) {
      const post_path = `${process.env.CLOUD_FOLDER_NAME}/posts/${find_post.files.custom_id}`;
      try {
        await cloudinary.api.delete_resources_by_prefix(post_path);
        await cloudinary.api.delete_folder(post_path);
      } catch (err) {
        console.error(
          "Error deleting post assets from Cloudinary:",
          err.message
        );
        // Continue deletion process even if cloud delete fails
      }
    }
    // 5. Remove related comments and interactions
    await comment.deleteMany({ post_id });
    await interaction.deleteMany({ post_id });

    // 6. Delete the post itself
    await post.findByIdAndDelete(post_id);

    // 7. Respond
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

export const searchByText = async (req, res) => {
  try {
    const { query } = req.query;
    const results = await post.find({ $text: { $search: query } });
    res.json({ success: true, query, results });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Text search failed",
      error: err.message,
    });
  }
};

export const searchByAudio = async (req, res) => {
  try {
    console.log(" File received:", req.file);

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No audio file uploaded" });
    }

    // Transcribe audio file to text
    const transcript = await transcribeAudio(req.file.path);

    if (!transcript) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to transcribe audio" });
    }

    // Perform text search with the transcript
    const results = await post.find({ $text: { $search: transcript } });

    // Delete the uploaded audio file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Error deleting audio file:", err);
      } else {
        console.log("Audio file deleted successfully");
      }
    });

    res.json({ success: true, transcript, results });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Audio search failed",
      error: err.message,
    });
  }
};
