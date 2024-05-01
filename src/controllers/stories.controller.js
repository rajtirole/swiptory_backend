import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import Post from '../models/stories.model.js'
import { categories } from "../constant.js";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const postStories = asyncHandler(async (req, res) => {
    console.log('postStories route');
    try {
      const user= req.user;
        const postValue = req.body;
        const postCategory=req.body[0].category;
         

        // Validate the incoming data against the Stories model schema
          const validatedStories = postValue.map(story => {
            const { heading, description, image, category } = story;
            if(postCategory!==category){
                throw new ApiError(400, 'Validation failed, All category should be same');   
            }
            if(!heading||!description||!image||!category){
                throw new ApiError(400, 'Validation failed,All feilds are required');
            }
            return {
              heading,
              description,
              image,
              category
            };
          });
      
          // Save the validated stories to the database
          const post = new Post({
            category: postCategory,
            owner: user._id,
            stories: validatedStories,
          });
          const savedPost = await post.save();
      
      
      res
        .status(201)
        .json(new ApiResponse(200, savedPost, "post created successfully"));
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            throw new ApiError(400, 'Validation failed', errors);
          }
      
          // Handle other errors
          console.error('Error:', error);
      
      throw new ApiError(
        error.statusCode || 500,
        error.message || "post creating not success",
        error.error
      );
    }
  });
  const updateStories = asyncHandler(async (req, res) => {
    console.log('updateStory route');
    try {
      const { id } = req.params; // Get the post ID from the request params
      const userId = req.user.id; // Get the user ID from the authenticated user
  
      // Find the post by ID and check if it exists
      const post = await Post.findById(id);
      if (!post) {
        throw new ApiError(404, 'Post not found');
      }
  
      // Check if the current user is the owner of the post
      if (post.owner.toString() !== userId) {
        throw new ApiError(403, 'You are not authorized to edit this post');
      }
  
      // Validate the incoming data against the Stories model schema
      const updatedStories = req.body.map(story => {
        const { heading, description, image, category } = story;
        if (!heading || !description || !image || !category) {
          throw new ApiError(400, 'Validation failed, all fields are required');
        }
        return {
          heading,
          description,
          image,
          category
        };
      });
  
      // Update the post with the validated stories
      post.stories = updatedStories;
      const savedPost = await post.save();
  
      res.status(200).json(new ApiResponse(200, savedPost, "Post updated successfully"));
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        throw new ApiError(400, 'Validation failed', errors);
      }
  
      // Handle other errors
      console.error('Error:', error);
  
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Post update failed",
        error.error
      );
    }
  });
  
  const getStories = asyncHandler(async (req, res) => {
    console.log('get stories');
    try {
        // Fetch distinct categories from the database
        // const categories = await Post.distinct('category');
        const categoriesValue=categories;

        // Define an empty object to store posts by category
        const featuredPosts = {};
  
        // Loop through each category and fetch 8 posts
        for (const category of categoriesValue) { 
            // Fetch 8 posts for each category
            const posts = await Post.find({ category }).limit(8).sort({ createdAt: -1 });

            // Add the fetched posts to the featuredPosts object
            featuredPosts[category] = posts;
        }
        // Return the featuredPosts object
        res.status(200).json(new ApiResponse(200, featuredPosts, "Successfully fetched featured posts"));
    } catch (error) {
        console.error('Error:', error);
        
        // Handle errors
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to fetch featured posts",
            error.error
        );
    }
});
const getNextStories = asyncHandler(async (req, res) => {
  console.log('get Next Stories');
  const { postIndex, postIndexLimit, category } = req.query;
  console.log(postIndex, postIndexLimit, category);
  try {
      // Validate postIndex and postIndexLimit
      if (!postIndex || !postIndexLimit || isNaN(postIndex) || isNaN(postIndexLimit)) {
        
          throw new ApiError(400,'Invalid post index or limit'); 
      }
      
      // Parse index and limit values to integers
      const startIndex = parseInt(postIndex);
      const endIndex = parseInt(postIndexLimit);

      // Fetch posts from the database based on the provided index and limit
      const posts = await Post.find({ category })
                              .sort({ createdAt: -1 })
                              .skip(startIndex)
                              .limit(endIndex - startIndex);

      res.status(200).json(new ApiResponse(200, { posts}, "Successfully fetched next stories"));
  } catch (error) {
      console.error('Error:', error);
      
      // Handle errors
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Failed to fetch next posts",
        error.error
    );
  }
});


const getStoryById = asyncHandler(async (req, res) => {
  console.log('Get Story By ID');
  const { id } = req.params;

  try {
      // Fetch the story from the database based on the provided ID
      const story = await Post.findById(id);

      if (!story) {
        throw new ApiError(400, 'Story not found');   
      }

      // Return the fetched story
      res.status(200).json(new ApiResponse(200, story, "Successfully fetched story by ID"));
  } catch (error) {
      console.error('Error:', error);

      // Handle errors
       throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to fetch posts by id",
            error.error
        );
  }
});

const likeStory = asyncHandler(async (req, res) => {
  console.log('Like Story');
  const { id } = req.params;
  const userId = req.user.id;
  console.log(userId);
  if(!id||!userId){
    
    throw new ApiError(400, 'story and user id required');  
  }  

  try {
    // Find the story by ID
    const story = await Post.findById(id);

    if (!story) {
      throw new ApiError(400, 'Story not found');  
    }

    // Check if the user has already liked the story
    const isLiked = story.likedBy.some((likedUserId) => likedUserId.toString()===userId);

    if (isLiked) {
      // If user has already liked the story, unlike it
      let likedStory = story.likedBy.filter((likedUserId) =>{
        likedUserId=likedUserId.toString()
        return likedUserId!==userId
      })
       story.likedBy=likedStory
    } else {
      // If user has not liked the story yet, like it
      story.likedBy.push(userId);
    }

    // Save the updated story
    const updatedStory = await story.save();

    // Return the updated story
    res.status(200).json(new ApiResponse(200, updatedStory, isLiked ? "Story unliked successfully" : "Story liked successfully"));
  } catch (error) {
    console.error('Error:', error);

    // Handle errors
    throw new ApiError(
      error.statusCode || 500,
      error.message ||  "Failed to like/unlike story",
      error.error
  );
    
  }
});
const bookmarkStory = asyncHandler(async (req, res) => {
  console.log('bookmark Story');
  const { id } = req.params;
  const userId = req.user.id;
  console.log(userId);
  if(!id||!userId){
   
    throw new ApiError(400, 'story and user id required'); 
  }  

  try {
    // Find the story by ID
    const story = await Post.findById(id);

    if (!story) {

      throw new ApiError(400, 'Story not found'); 
    }

    // Check if the user has already liked the story
    const isSaved = story.savedBy.some((savedUserId) => savedUserId.toString()===userId);

    if (isSaved) {
      // If user has already save the story, unsave it
      let savedStory = story.savedBy.filter((savedUserId) =>{
        savedUserId=savedUserId.toString()
        return savedUserId!==userId
      })
      // story.likedBy = story.likedBy.filter(likedUserId => !likedUserId.equals(ObjectId(userId)));
       story.savedBy=savedStory
    } else {
      // If user has not liked the story yet, like it
      story.savedBy.push(userId);
    }

    // Save the updated story
    const updatedStory = await story.save();

    // Return the updated story
    res.status(200).json(new ApiResponse(200, updatedStory, isSaved ? "Story Removed From Bookmarks" : "Story Bookmarked successfully"));
  } catch (error) {
    console.error('Error:', error);

    // Handle errors
   
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to save/unsave story",
      error.error
  );
  }
  });
const getBookmarkedPosts = asyncHandler(async (req, res) => {
  console.log('Fetching bookmarked posts');
  try {
      // Fetch bookmarked posts from the database based on the user ID
      const userId = req.user.id; // Assuming user ID is available in request
      const bookmarkedPosts = await Post.find({ savedBy: userId }).sort({ createdAt: -1 }).limit(8);

      // Return the fetched bookmarked posts
      res.status(200).json(new ApiResponse(200, bookmarkedPosts, "Successfully fetched bookmarked posts"));
  } catch (error) {
      console.error('Error:', error);

      // Handle errors
      throw new ApiError(
          error.statusCode || 500,
          error.message || "Failed to fetch bookmarked posts",
          error.error
      );
  }
});

const getuserCreatedposts = asyncHandler(async (req, res) => {
  console.log('Fetching user created posts');
  try {
      // Fetch user created posts from the database based on the user ID
      const userId = req.user.id; // Assuming user ID is available in request
      const userCreatedPosts = await Post.find({ owner: userId }).sort({ createdAt: -1 }).limit(8);

      // Return the fetched user created posts
      res.status(200).json(new ApiResponse(200, userCreatedPosts, "Successfully fetched user created posts"));
  } catch (error) {
      console.error('Error:', error);

      // Handle errors
      throw new ApiError(
          error.statusCode || 500,
          error.message || "Failed to fetch user created posts",
          error.error
      );
  }
});

const getNextBookmarked = asyncHandler(async (req, res) => {
  console.log('Fetching next bookmarked posts');
  const { postIndex:bookmarkIndex, postIndexLimit:bookmarkLimit } = req.query;

  try {
      // Validate bookmarkIndex and bookmarkLimit
      if (!bookmarkIndex || !bookmarkLimit || isNaN(bookmarkIndex) || isNaN(bookmarkLimit)) {
          
          throw new ApiError(400, 'Invalid bookmark index or limit'); 
      }

      // Parse index and limit values to integers
      const startIndex = parseInt(bookmarkIndex);
      const endIndex = parseInt(bookmarkIndex) + parseInt(bookmarkLimit);

      // Fetch bookmarked posts from the database based on the user ID and provided index and limit
      const userId = req.user.id; // Assuming user ID is available in request
      const bookmarkedPosts = await Post.find({ savedBy: userId }).sort({ createdAt: -1 }).skip(startIndex).limit(endIndex - startIndex);

      // Return the fetched bookmarked posts
      res.status(200).json(new ApiResponse(200, bookmarkedPosts, "Successfully fetched next bookmarked posts"));
  } catch (error) {
      console.error('Error:', error);

      // Handle errors
    
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Failed to fetch next bookmarked posts",
        error.error
    );
  }
});
const getNextUserCreatedStory = asyncHandler(async (req, res) => {
  console.log('Fetching next user created stories');
  const { userCreatedPostIndex: startIndex, UserCreatedPostIndexLimit: limit } = req.query;

  try {
      // Validate startIndex and limit
      if (!startIndex || !limit || isNaN(startIndex) || isNaN(limit)) {
          throw new ApiError(400, 'Invalid start index or limit'); 
      }

      // Parse index and limit values to integers
      const parsedStartIndex = parseInt(startIndex);
      const parsedLimit = parseInt(limit);

      // Fetch user created stories from the database based on the user ID and provided index and limit
      const userId = req.user.id; // Assuming user ID is available in request
      const userCreatedStories = await Post.find({ owner: userId }).sort({ createdAt: -1 }).skip(parsedStartIndex).limit(parsedLimit);

      // Return the fetched user created stories
      res.status(200).json(new ApiResponse(200, userCreatedStories, "Successfully fetched next user created stories"));
  } catch (error) {
      console.error('Error:', error);

      // Handle errors
      throw new ApiError(
          error.statusCode || 500,
          error.message || "Failed to fetch next user created stories",
          error.error
      );
  }
});



  export {postStories,getuserCreatedposts,getNextUserCreatedStory,updateStories,getStories,getNextStories,getStoryById,likeStory,bookmarkStory,getBookmarkedPosts,getNextBookmarked}