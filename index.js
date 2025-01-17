import Fastify from "fastify";
import "./dotenv.js";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { assistantRoutes } from "./app/routes/assistant/index.js";
import { scriptRoutes } from "./app/routes/script/index.js";
import { commentRoutes } from "./app/routes/comment/index.js";

const fastify = Fastify({
  logger: false,
});

fastify.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB in bytes
  },
});

fastify.get("/", async (request, reply) => {
  return reply.status(200).send({
    message: "Hi, I'm DEPLOY API!",
    error: null,
    data: null,
  });
});

/* --------------------------------- Routes --------------------------------- */
fastify.register(assistantRoutes, {
  prefix: "/assistant",
});

fastify.register(scriptRoutes, {
  prefix: "/script",
});

fastify.register(commentRoutes, {
  prefix: "/comment",
});

const start = async () => {
  try {
    const port = process.env.APP_PORT || 3205;
    await fastify.listen({
      port: port,
      host: "0.0.0.0",
    });

    console.log(
      `Server started successfully on localhost:${port} at ${new Date()}`
    );
  } catch (error) {
    console.log("Error starting server: ", error);
    process.exit(1);
  }
};

start();
