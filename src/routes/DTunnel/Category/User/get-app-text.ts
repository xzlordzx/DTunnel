import prisma from '../../../config/prisma-client';
import Authentication from '../../../middlewares/authentication';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export default {
  url: '/user_list',
  method: 'GET',
  onRequest: [Authentication.user],
  handler: async (req: FastifyRequest, reply: FastifyReply) => {
    const texts = await prisma.User.findMany({
      where: { user_id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    reply.send({ data: id: req.user.id });
  },
} as RouteOptions;
