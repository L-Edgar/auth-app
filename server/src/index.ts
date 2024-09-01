import express, { Express, NextFunction, Request, Response } from "express";
const cors = require("cors");
const dotenv = require("dotenv");
import connect from "./db/index";

const PORT = 8083;
const server: Express = express();
//middlewares
dotenv.config();
server.use(cors());
server.use(express.json());

//added by sam - loading front end
server.use(express.static("public", { extensions: ["html"] }));

//ping
server.get("/auth2", (req: Request, res: Response) => {
  res.send("Do you need to see this really?");
});

//end points
server.use("/auth2", require("./api/auth"));
server.use("/auth2/user", require("./api/user"));

//db connection
connect();

//404
server.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404);
  res.send("404");
});

//server start
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
