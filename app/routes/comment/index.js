import { prismaClient } from "../../lib/db/prisma.js";

export const commentRoutes = (app, _, done) => {
  app.post("/create", async (request, reply) => {
    const { scriptId, content, author } = request.body;

    if (!scriptId || !content || !author) {
      return reply
        .status(400)
        .send({ error: "Script ID, author and content are required." });
    }

    try {
      const comment = await prismaClient.comment.create({
        data: {
          author,
          scriptId,
          content,
        },
      });
      reply.send({ message: "Comment added successfully!", comment });
    } catch (error) {
      reply.status(500).send({
        error: "Error adding comment.",
        details: error.message,
      });
    }
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      await prismaClient.comment.delete({
        where: { id },
      });
      reply.send({ message: "Comment deleted successfully!" });
    } catch (error) {
      reply.status(500).send({
        error: "Error deleting the comment.",
        details: error.message,
      });
    }
  });

  done();
};
