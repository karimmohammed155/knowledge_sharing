import { nanoid } from "nanoid";
import { comment, interaction, post } from "../../../DB/models/index.js";
import {
  api_features,
  cloudinary,
  Error_handler_class,
} from "../../utils/index.js";

// Create new post
export const add_post = async (req, res, next) => {
  const { title, content, sub_category } = req.body;
  // Validate required fields
  if (!title || !content) {
    return next(
      new Error_handler_class(
        "title and content are required",
        400,
        "add post api"
      )
    );
  }
  // Upload files to Cloudinary
  const urls = [];
  const custom_id = nanoid(4);
  if (req.files && req.files.length > 0) {
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
  // Create a new post object
  const new_post = new post({
    title,
    content,
    files: {
      urls: urls.length > 0 ? urls : undefined,
      custom_id: custom_id,
    },
    author: req.user._id,
    sub_category: sub_category,
  });

  await new_post.save();

  // Send response
  res.status(201).json({
    message: "Post created successfully",
    data: new_post,
  });
};
// Get all posts api
export const get_all_posts = async (req, res, next) => {
  // Get posts with their all details
  const posts = post
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
    .populate("interactions");
  // Apply api features to the retrieved posts
  const new_api_feature = new api_features(posts, req.query)
    .sort()
    .pagination()
    .filters();
  // Check if the posts exists
  const find_post = await new_api_feature.mongoose_query;
  if (!find_post) {
    return next(
      new Error_handler_class("posts not found", 404, "posts not found")
    );
  }
  // Get posts with their stats
  const postsWithStats = await Promise.all(
    find_post.map(async (post) => {
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
  // check if post exists
  const find_post = await post.findById(post_id);
  if (!find_post) {
    res.status(404).json({ message: "Post not found" });
  }
  // Only the author or admin can delete the post
  if (
    find_post.author.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res
      .status(403)
      .json({ message: "Unauthorized to delete this post" });
  }
  // delete the related image from cloudinary
  const post_path = `${process.env.CLOUD_FOLDER_NAME}/posts/${find_post.files.custom_id}`;
  // delete the folder from cloudinary
  await cloudinary.api.delete_resources_by_prefix(post_path);
  await cloudinary.api.delete_folder(post_path);
  // Delete interactions and comments related to post
  await comment.deleteMany({ post_id: post_id });
  await interaction.deleteMany({ post_id: post_id });
  // Delete post
  await post.findByIdAndDelete(post_id);
  // response
  res.status(200).json({ message: "Post deleted successfully" });
};
