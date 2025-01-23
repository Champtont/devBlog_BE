import express from "express";
import createHttpError from "http-errors";
import CommentsModel from "./model.js";
import q2m from "query-to-mongo";

const commentsRouter = express.Router();

//post comment

commentsRouter.post("/", async (req, res, next) => {
  try {
    const newComment = new CommentsModel(req.body);
    const { _id } = await newComment.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

//get ALL comments

commentsRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query);
    const total = await CommentsModel.countDocuments(mongoQuery.criteria);
    const comments = await CommentsModel.find(
      mongoQuery.criteria,
      mongoQuery.options.fields
    )
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort)
      .populate({
        path: "author",
      }).populate({
        path: "blog"
      });
    res.send({
      links: mongoQuery.links(process.env.PORT, total),
      totalPages: Math.ceil(total / mongoQuery.options.limit),
      comments,
    });
  } catch (error) {
    next(error);
  }
});

//get specific blog

commentsRouter.get("/:commentId", async (req, res, next) => {
  try {
    const comment = await CommentsModel.findById(req.params.commentId);
    if (comment) {
      res.send(comment);
    } else {
      next(
        createHttpError(404, `Comment with id ${req.params.commentId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

//edit comment

commentsRouter.put("/:commentId", async (req, res, next) => {
  try {
    const updatedComment = await CommentsModel.findByIdAndUpdate(
      req.params.commentId,
      req.body,
      { new: true, runValidators: true }
    );

    if (updatedComment) {
      res.send(updatedComment);
    } else {
      next(
        createHttpError(404, `Comment with id ${req.params.commentId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

//delete blog

commentsRouter.delete("/:commentId", async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
              req.user._id,
              { $pull: {comments: req.params.commentId} },
              { new: true, runValidators: true }
            );
    
    const deletedComment = await CommentsModel.findByIdAndDelete(req.params.commentId);

    if (updatedUser && deletedComment) {
      res.status(204).send(updatedUser);
    } else {
      next(
        createHttpError(404, `Comment with id ${req.params.commentId} not found!`)
      );
    }
  } catch (error) {
    next(error);
  }
});

export default commentsRouter;