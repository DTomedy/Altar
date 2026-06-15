import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  IUserRepository,
  ICampaignRepository,
  IContributionRepository,
  CreateUserData,
  CreateCampaignData,
  CreateContributionData,
} from './interfaces';

export class UserRepository implements IUserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: CreateUserData) {
    return prisma.user.create({ data: data as unknown as Prisma.UserCreateInput }).catch((err) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return null;
      }
      throw err;
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }
}

export class CampaignRepository implements ICampaignRepository {
  async findById(id: string) {
    return prisma.campaign.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return prisma.campaign.findUnique({ where: { slug } });
  }

  async create(data: CreateCampaignData) {
    return prisma.campaign.create({ data: data as unknown as Prisma.CampaignCreateInput });
  }

  async update(id: string, data: Prisma.CampaignUpdateInput) {
    return prisma.campaign.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.campaign.delete({ where: { id } });
  }
}

export class ContributionRepository implements IContributionRepository {
  async findById(id: string) {
    return prisma.contribution.findUnique({ where: { id } });
  }

  async findByTxRef(txRef: string) {
    return prisma.contribution.findUnique({ where: { flwTxRef: txRef } });
  }

  async create(data: CreateContributionData) {
    return prisma.contribution.create({ data: data as unknown as Prisma.ContributionCreateInput });
  }

  async update(id: string, data: Prisma.ContributionUpdateInput) {
    return prisma.contribution.update({ where: { id }, data });
  }
}
