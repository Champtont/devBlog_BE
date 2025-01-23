import express from "express";
import createHttpError from "http-errors";
import passport from "passport-google-oauth";
import q2m from "query-to-mongo";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { adminOnlyMiddleware } from "../../lib/auth/adminAuth.js";
import { JWTAuthMiddleware } from "../../lib/auth/jwtAuth.js";
import { createAccessToken } from "../../lib/tools.js";
import UsersModel from "./model.js";
import BlogsModel from "../blogs/model.js"
import { model } from "mongoose";

const usersRouter = express.Router();
//*********User Endpoints******
//register
usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body);
    const { _id } = await newUser.save();
    if ({ _id }) {
      const payload = { _id: newUser._id, role: newUser.role };
      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    }
  } catch (error) {
    next(error);
  }
});
//googleEnd points
/*
usersRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

usersRouter.get(
  "/googleRedirect",
  passport.authenticate("google", { session: false }),
  async (req, res, next) => {
    console.log(req.user);
    res.redirect(`${process.env.FE_URL}/${req.user.accessToken}`);
  }
);
*/
//logIn
usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UsersModel.checkCredentials(email, password);

    if (user) {
      const payload = { _id: user._id, role: user.role };

      const accessToken = await createAccessToken(payload);
      res.send({ accessToken });
    } else {
      next(createHttpError(401, "Credentials are not recognized!"));
    }
  } catch (error) {
    next(error);
  }
});
//logOut
usersRouter.get("/logout", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id);
    res.clearCookie("jwt");
    await user.save();
    res.status(200).send({ message: "You're logged out, see you soon???" });
  } catch (error) {
    next(error);
  }
});
//Get My Info
usersRouter.get("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.user._id)
      .populate([
        {
          path: "myBlogs",
          model: "Blog",
          populate: { path: "comments", model: "Comment"}
        },
      ]);
    res.send(user);
  } catch (error) {
    next(error);
  }
});
//Edit My info
usersRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      next(createError(404, `User with id ${req.user._id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});
//Edit My profile pic
const cloudinaryUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "DevBlog_profiles",
    },
  }),
}).single("avatar");

usersRouter.post(
  "/me/avatar",
  JWTAuthMiddleware,
  cloudinaryUploader,
  async (req, res, next) => {
    try {
      const user = await UsersModel.findByIdAndUpdate(
        req.user._id,
        { avatar: req.file.path },
        { new: true }
      );
      if (!user)
        next(createError(404, `No user wtih the id of ${req.user._id}`));
      res.status(201).send(user);
    } catch (error) {
      res.send(error);
      next(error);
    }
  }
);

//*********Blog Endpoints*****
//Get All My blogs
usersRouter.get("/me/blogs", JWTAuthMiddleware, async (req, res, next) => {
    try {
      const blogs = await BlogsModel.find({
        author: req.user._id,
      }).populate({ path: "author", select: "userName avatar" });
  
      if (blogs) {
        res.send(blogs);
      } else {
        next(
          createHttpError(
            404,
            `No blogs hosted by user ${req.user._id} were found.`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  });
  //Edit My blogs
  usersRouter.put("/me/:blogId", JWTAuthMiddleware, async (req, res, next) => {
    try {
      const updatedBlog = await BlogsModel.findByIdAndUpdate(
        req.params.blogId,
        req.body,
        { new: true, runValidators: true }
      );
      if (updatedBlog) {
        res.send(updatedBlog);
      } else {
        next(
          createError(404, `Blog with id ${req.params.blogId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  });

  //Delete one of my blogs

  usersRouter.delete(
    "/me/:blogId",
    JWTAuthMiddleware,
    async (req, res, next) => {
      try {
        const updatedUser = await UsersModel.findByIdAndUpdate(
          req.user._id,
          { $pull: { myBlogs: req.params.blogId } },
          { new: true, runValidators: true }
        );
        const blogToDelete = await BlogsModel.findByIdAndDelete(
          req.params.blogId
        );
        if (updatedUser && blogToDelete) {
          res.send(updatedUser);
        } else {
          next(
            createHttpError(
              404,
              `Blog with id ${req.params.blogId} was not found`
            )
          );
        }
      } catch (error) {
        console.log(error);
        next(error);
      }
    }
  );
  
export default usersRouter;