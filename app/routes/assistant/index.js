import { prismaClient } from "../../lib/db/prisma.js";

export const assistantRoutes = (app, _, done) => {
  // Get Assistants
  app.get("/", async (request, reply) => {
    try {
      const assistants = await prismaClient.assistant.findMany({
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      return reply.send(assistants);
    } catch (error) {
      reply.status(500).send({
        error: "Error processing the request.",
        details: error.message,
      });
    }
  });

  // Get Assistan
  app.get("/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      const assistant = await prismaClient.assistant.findUnique({
        where: { id },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      return reply.send(assistant);
    } catch (error) {
      reply.status(500).send({
        error: "Error processing the request.",
        details: error.message,
      });
    }
  });

  done();
};
