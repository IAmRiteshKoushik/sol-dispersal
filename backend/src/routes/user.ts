import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "..";
import { authMiddleware } from "../middleware";
import { createTaskInput } from "../types";

const DEFAULT_TITLE = "Select the most clickable thumbnail";

const router = Router();
const prismaClient = new PrismaClient();

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY ?? "",
    secretAccessKey: process.env.SECRET_KEY ?? "",
  },
  region: "us-east-1"
});

router.post("/tasks", authMiddleware, async (req, res) => {
  const body = req.body;

  const parsedData = createTaskInput.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({
      message: "You have sent the wrong inputs"
    });
  }

  // Creating a transaction which because we are sending two separate queries
  // together and we need consistency across both of them such that if one of 
  // them fails then the other one should fail as well
  prismaClient.$transaction(async tx => {
    await tx.task.create({
      data: {
        title: parsedData.data.title ?? DEFAULT_TITLE,
        amount: "1",
        signature: "signature",
      }
    })
  });

});

// Generate preSignedURL
router.get("/presignedUrl", authMiddleware, async (req, res) => {
  // @ts-ignore
  const userId = req.userId;
  const command = new PutObjectCommand({
    Bucket: "sol-dispersalk",
    Key: `/store/${userId}/${Math.random()}/image.jpg`,
    ContentType: "image/jpg"
  });
  const preSignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600
  });
  console.log(preSignedUrl);
  res.json({
    preSignedUrl
  });
});

// Signin with wallet
router.post("/signin", async (req, res) => {

  const hardCodedWalletAddress = ""

  // Checking for existing user
  const existingUser = await prismaClient.user.findFirst({
    where: {
      address: hardCodedWalletAddress
    }
  });

  if (existingUser) {

    const token = jwt.sign({
      userId: existingUser.id
    }, JWT_SECRET);
    res.json({
      token
    });

  } else {

    const user = await prismaClient.user.create({
      data: {
        address: hardCodedWalletAddress,
      }
    });
    const token = jwt.sign({
      userId: user.id
    }, JWT_SECRET);
    res.json({
      token
    });

  }
});

export default router;
