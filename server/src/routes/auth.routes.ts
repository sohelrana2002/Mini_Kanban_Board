import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  me,
} from "../controllers/auth.controller";
import { auth } from "../middlewares/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh); //exchanges a valid refresh token for a new access token and refresh token pair
router.post("/logout", logout); //revokes the refresh token and clears the cookies
router.get("/me", auth, me); //returns the current user's information based on the access token

export default router;
