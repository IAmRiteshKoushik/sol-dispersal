import express from "express";
import userRouter from "./routes/user"
import workerRouter from "./routes/user"

const app = express();
app.use(express.json());

export const JWT_SECRET = "secret"

app.use("/v1/users", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(3000, () => console.log("Server is litening on PORT: 3000"));
