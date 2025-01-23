import express from "express";
import cors from "cors";
import passport from "passport-google-oauth";
//import googleStrategy from "./lib/auth/google.js";
import blogsRouter from "./api/blogs/index.js";
import usersRouter from "./api/users/index.js";
import commentsRouter from "./api/comments/index.js";
import {
  badRequestHandler,
  genericErrorHandler,
  notFoundHandler,
} from "./lib/errorHandlers.js";

const server = express();

// * MIDDLEWARES *
server.use(cors());
server.use(express.json());

// **** ENDPOINTS ****
server.use("/users", usersRouter);
server.use("/blogs", blogsRouter);
server.use("/comments", commentsRouter )
// ** ERROR HANDLERS **
server.use(badRequestHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

export default server;