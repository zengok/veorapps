import { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

interface AuditInput {
  req: Request;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export async function writeAuditLog({
  req,
  action,
  entityType,
  entityId,
  metadata,
}: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: req.userId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? Prisma.JsonNull,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    },
  });
}
