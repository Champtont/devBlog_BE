import express from "express";
import createHttpError from "http-errors";
import BlogsModel from "./model.js";
import q2m from "query-to-mongo";

const blogsRouter = express.Router();

//post blog

blogsRouter.post("/", async (req, res, next) => {
  try {
    const newBlog = new BlogsModel(req.body);
    const { _id } = await newBlog.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//get ALL blogs

blogsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const total = await BlogsModel.countDocuments(mongoQuery.criteria);

    const blogs = await BlogsModel.find(
      mongoQuery.criteria,
      mongoQuery.options.fields
    )
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort)
      .populate({
        path: "author",
      });
    res.send({
      links: mongoQuery.links(process.env.PORT, total),
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      blogs,
    });
  } catch (error) {
    next(error);
  }
});

//get specific blog

blogsRouter.get("/:blogId", async (req, res, next) => {
  try {
    const blog = await BlogsModel.findById(req.params.blogId);
    if (blog) {
      res.send(blog);
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

//edit blog

blogsRouter.put("/:blogId", async (req, res, next) => {
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
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

//delete blog

blogsRouter.delete("/:blogId/:commentId", async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
              req.user._id,
              { $pull: [{ myBlogs: req.params.blogId }, {comments: req.params.commentIdId}] },
              { new: true, runValidators: true }
            );
    
    const deletedBlog = await BlogsModel.findByIdAndDelete(req.params.blogId);

    if (updatedUser && deletedBlog) {
      res.status(204).send(updatedUser);
    } else {
      next(
        createHttpError(404, `Blog with id ${req.params.blogId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

export default blogsRouter;