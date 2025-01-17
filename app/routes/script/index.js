import { prismaClient } from "../../lib/db/prisma.js";
import { sendMessage } from "../../lib/openai/api.js";
import {
  extractReplyAndScript,
  generateStructuredPrompt,
} from "./helpers/scriptHelper.js";

export const scriptRoutes = (app, _, done) => {
  // Generate script
  app.post("/generate", async (request, reply) => {
    const { strategyDescription, threadId, assistantId } = request.body;

    if (!assistantId) {
      return reply.status(400).send({ error: "assistantId is required." });
    }

    if (!strategyDescription) {
      return reply
        .status(400)
        .send({ error: "Strategy description is required." });
    }

    try {
      const assistant = await prismaClient.assistant.findUnique({
        where: {
          id: assistantId,
        },
      });

      if (!assistant) {
        return reply.status(404).send({
          error: "Assistant not found. Please check the provided assistant ID.",
        });
      }

      const strucutedMessage = generateStructuredPrompt(strategyDescription);

      const { threadId: newThreadId, response } = await sendMessage(
        strucutedMessage,
        assistant.externalId,
        threadId
      );

      const { explanation, script, tags, title } =
        extractReplyAndScript(response);

      reply.send({
        threadId: newThreadId,
        title: title,
        assistantId,
        explanation,
        generatedScript: script,
        tags,
      });
    } catch (error) {
      reply.status(500).send({
        error: "Error processing the request.",
        details: error.message,
      });
    }
  });

  // Deploy and Save Script to Database
  app.post("/deploy", async (request, reply) => {
    const { assistantId, explanation, script, tags, title, author } =
      request.body;

    if (!assistantId || !explanation || !script || !title || !author) {
      return reply.status(400).send({
        error: "Assistant ID, explanation, title, and script are required.",
      });
    }

    try {
      const savedScript = await prismaClient.script.create({
        data: {
          assistant: {
            connect: {
              id: assistantId,
            },
          },
          author,
          title,
          explanation,
          script,
          tags,
        },
      });

      reply.send({
        message: "Script successfully saved!",
        savedScript,
      });
    } catch (error) {
      reply.status(500).send({
        error: "Error saving the script.",
        details: error.message,
      });
    }
  });

  // Get List of All Scripts
  app.get("/", async (request, reply) => {
    const { status, page = 1, limit = 10 } = request.query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
      const where = status ? { status } : {};

      const scripts = await prismaClient.script.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          assistant: true,
          _count: {
            select: { comments: true },
          },
        },
      });

      const totalScripts = await prismaClient.script.count({ where });

      reply.send({
        data: scripts,
        pagination: {
          total: totalScripts,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalScripts / Number(limit)),
        },
      });
    } catch (error) {
      reply.status(500).send({
        error: "Error fetching scripts.",
        details: error.message,
      });
    }
  });

  // Get Script Details by ID
  app.get("/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      const script = await prismaClient.script.findUnique({
        where: { id },
        include: {
          comments: true,
          assistant: true,
        },
      });

      if (!script) {
        return reply.status(404).send({ error: "Script not found." });
      }

      reply.send(script);
    } catch (error) {
      reply.status(500).send({
        error: "Error fetching the script details.",
        details: error.message,
      });
    }
  });

  done();
};
