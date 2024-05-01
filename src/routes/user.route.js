import { Router } from "express";
import {login, logout, register,getUser,} from '../controllers/user.controller.js'
import auth from '../middlewares/auth.js'
const router=Router()
router.post('/register',register)
router.post('/login',login)
router.get('/logout',auth,logout)
router.post('/getUser',auth,getUser)


export default router 