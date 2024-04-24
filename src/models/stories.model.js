// import mongoose, { Schema } from "mongoose";
// const storiesSchema = new mongoose.Schema(
//     {
//       heading: {
//         type: String,
//         required: [true, "heading is required"],
//         trim: true,
//       },
//       desciption: {
//         type: String,
//         required: [desciption, "desciption is required"],
//       },
//       image: {
//         type: String,
//         required: [true, "image is required"],
//       },
//      category:{
//         required: [true, "category is required"],
//         type: String,
//         enum:[ "Food","Health and fitness","Travel","Movies","Education"]
//      },
//      owner:{
//         type:mongoose.Types.ObjectId,
//         ref:"User"
//     }
//     },
//     { timestamps: true }
//   );
//   const Stories = mongoose.model("Stories", storiesSchema);
// export default Stories;




// import mongoose from "mongoose";

// const storySchema = new mongoose.Schema(
//   {
//     storyId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       default: mongoose.Types.ObjectId,
//       unique: true,
//     },
//     heading: {
//       type: String,
//       required: [true, "Heading is required"],
//       trim: true,
//     },
//     description: {
//       type: String,
//       required: [true, "Description is required"],
//     },
//     image: {
//       type: String,
//       required: [true, "Image URL is required"],
//     },
//     category: {
//       type: String,
//       required: [true, "Category is required"],
//       enum: ["Food", "Health and fitness", "Travel", "Movies", "Education"],
//     },
//   },
//   { timestamps: true }
// );

// const postSchema = new mongoose.Schema(
//   {
//     category: {
//       type: String,
//       required: [true, "Category is required"],
//       enum: ["Food", "Health and fitness", "Travel", "Movies", "Education"],
//     },
//     stories: {
//       type: [storySchema], // Array of stories
//       validate: [
//         {
//           validator: function (stories) {
//             return stories.length >= 3 && stories.length <= 6;
//           },
//           message: "A post must have between 3 to 6 stories",
//         },
//         {
//           validator: function (stories) {
//             // Check if all stories have the same category
//             return stories.every((story) => story.category === stories[0].category);
//           },
//           message: "All stories in a post must have the same category",
//         },
//       ],
//     },
//     likedBy: {
//       type: [mongoose.Schema.Types.ObjectId],
//       ref: "User",
//       default: [],
//     },
//     savedBy: {
//       type: [mongoose.Schema.Types.ObjectId],
//       ref: "User",
//       default: [],
//     },
//   },
//   { timestamps: true }
// );
// postSchema.pre("save", function (next) {
//   const stories = this.stories;
//   let errors = [];

//   stories.forEach((story, index) => {
//     for (const [key, value] of Object.entries(story)) {
//       if (!value) {
//         errors.push(`Story at index ${index} has an empty ${key}`);
//       }
//     }
//   });

//   if (errors.length) {
//     return next(new Error(errors.join(", ")));
//   }

//   next();
// });

// const Post = mongoose.model("Post", postSchema);

// export default Post;



import mongoose from "mongoose";
const storySchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: [true, "Heading is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Food", "Health and fitness", "Travel", "Movies", "Education"],
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Food", "Health and fitness", "Travel", "Movies", "Education"],
    },
    stories: {
      type: [storySchema], // Array of stories
      validate: [
        {
          validator: function (stories) {
            return stories.length >= 3 && stories.length <= 6;
          },
          message: "A post must have between 3 to 6 stories",
        },
        {
          validator: function (stories) {
            // Check if all stories have the same category
            return stories.every((story) => story.category === stories[0].category);
          },
          message: "All stories in a post must have the same category",
        },
      ],
    },
    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    savedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

// Middleware to check for empty fields
postSchema.pre("save", function (next) {
  const stories = this.stories;
  let errors = [];

  stories.forEach((story, index) => {
    if (!story.heading) {
      errors.push(`Story at index ${index} has an empty heading`);
    }
    if (!story.description) {
      errors.push(`Story at index ${index} has an empty description`);
    }
    if (!story.image) {
      errors.push(`Story at index ${index} has an empty image`);
    }
    if (!story.category) {
      errors.push(`Story at index ${index} has an empty category`);
    }
  });

  if (errors.length) {
    return next(new Error(errors.join(", ")));
  }

  next();
});
const Post = mongoose.model("Post", postSchema);

export default Post;
