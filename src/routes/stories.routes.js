import { Router } from "express";
import {postStories,updateStories,getNextUserCreatedStory,getuserCreatedposts,getStories,getNextStories,getStoryById,likeStory,bookmarkStory,getBookmarkedPosts,getNextBookmarked} from '../controllers/stories.controller.js'
import auth from '../middlewares/auth.js'
const router=Router()
router.post('/postStories',auth,postStories)
router.post('/updateStories/:id',auth,updateStories)
router.post('/getStories',getStories)
router.post('/getNextStories',getNextStories)
router.post('/getStory/:id',getStoryById)
router.post('/likeStory/:id',auth,likeStory)    
router.post('/bookmarkStory/:id',auth,bookmarkStory)
router.post('/getBookmarkedPosts',auth,getBookmarkedPosts)
router.post('/getNextBookmarked',auth,getNextBookmarked)
router.post('/getuserCreatedposts',auth,getuserCreatedposts)
router.post('/getNextUserCreatedStory',auth,getNextUserCreatedStory)



export default router 