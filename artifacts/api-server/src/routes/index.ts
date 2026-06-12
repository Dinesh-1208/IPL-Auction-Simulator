import { Router, type IRouter } from "express";
import healthRouter from "./health";
import seasonsRouter from "./seasons";
import roomsRouter from "./rooms";
import teamsRouter from "./teams";
import auctionRouter from "./auction";
import chatRouter from "./chat";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/seasons", seasonsRouter);
router.use("/rooms", roomsRouter);
router.use("/rooms/:code/teams", teamsRouter);
router.use("/rooms/:code/auction", auctionRouter);
router.use("/rooms/:code/messages", chatRouter);
router.use("/rooms/:code/ai-report", aiRouter);

export default router;
