import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { ApplicationEntity } from "../../../database/entities/application.entity";
import { InvitationEntity } from "../../../database/entities/invitation.entity";
import { TenantUserEntity } from "../../../database/entities/tenant-user.entity";
import { UserEntity } from "../../../database/entities/user.entity";
import { ApiConflictException, ApiResourceNotFoundException, ApiTenantIsolationException, ApiUnauthorizedException } from "../errors/api-http.exceptions";
import { type AcceptInvitationDto } from "../dto/accept-invitation.dto";

const scrypt = promisify(scryptCallback);

type StaffTokenPayload = {
  userId: string;
  tenantId: string;
  roleKey: string;
};

export type StaffAuthContext = {
  accessToken: string;
  tenantId: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    tenantId: string;
    tenants: Array<{
      tenantId: string;
      role: string;
    }>;
  };
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TenantUserEntity)
    private readonly tenantUserRepository: Repository<TenantUserEntity>,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>
  ) {}

  async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derivedKey.toString("hex")}`;
  }

  async verifyPassword(password: string, passwordHash: string | null | undefined) {
    if (!passwordHash) {
      return false;
    }

    const [algorithm, salt, storedKey] = passwordHash.split("$");

    if (algorithm !== "scrypt" || !salt || !storedKey) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(storedKey, "hex");

    if (derivedKey.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedBuffer);
  }

  async loginStaff(email: string, password: string): Promise<StaffAuthContext> {
    const user = await this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      throw new ApiUnauthorizedException("Invalid email or password");
    }

    const memberships = await this.tenantUserRepository.find({
      where: { userId: user.id },
      order: { tenantId: "ASC" }
    });
    const membership = memberships[0] ?? null;

    if (!membership) {
      throw new ApiUnauthorizedException("No tenant membership found");
    }

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return this.buildStaffAuthContext(user, membership, memberships);
  }

  async getProfile(authorizationHeader: string | undefined) {
    const context = await this.requireStaffContext(authorizationHeader);
    return context.user;
  }

  async requireStaffContext(authorizationHeader: string | undefined, tenantId?: string) {
    const token = this.extractBearerToken(authorizationHeader);
    const payload = this.verifyStaffToken(token);
    const user = await this.userRepository.findOne({
      where: { id: payload.userId }
    });

    if (!user) {
      throw new ApiUnauthorizedException("User not found");
    }

    const memberships = await this.tenantUserRepository.find({
      where: { userId: user.id },
      order: { tenantId: "ASC" }
    });
    const membership =
      memberships.find((item) => item.tenantId === (tenantId ?? payload.tenantId)) ??
      memberships.find((item) => item.tenantId === payload.tenantId) ??
      memberships[0] ??
      null;

    if (!membership) {
      throw new ApiUnauthorizedException("Membership not found");
    }

    if (tenantId && membership.tenantId !== tenantId) {
      throw new ApiTenantIsolationException("Cross-tenant token usage denied");
    }

    return this.buildStaffAuthContext(user, membership, memberships);
  }

  async loginCustomer(trackingCode: string, password: string) {
    const application = await this.applicationRepository.findOne({
      where: {
        publicTrackingCode: trackingCode
      }
    });

    if (!application || !(await this.verifyPassword(password, application.customerAccessPasswordHash))) {
      throw new ApiUnauthorizedException("Invalid tracking code or password");
    }

    return {
      applicationId: application.id,
      status: application.status,
      expiresInSeconds: 60 * 60 * 24 * 14
    };
  }

  async acceptInvitation(inviteId: string, body: AcceptInvitationDto): Promise<StaffAuthContext> {
    const invitation = await this.invitationRepository.findOne({
      where: { id: inviteId }
    });

    if (!invitation) {
      throw new ApiResourceNotFoundException("Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      throw new ApiConflictException("Invitation is no longer pending");
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new ApiConflictException("Invitation has expired");
    }

    const normalizedEmail = invitation.email.trim().toLowerCase();
    let user = await this.userRepository.findOne({
      where: { email: normalizedEmail }
    });

    if (!user) {
      user = this.userRepository.create({
        id: randomUUID(),
        email: normalizedEmail,
        passwordHash: await this.hashPassword(body.password),
        displayName: body.displayName.trim(),
        isPlatformAdmin: false,
        lastLoginAt: new Date()
      });
    } else {
      user.passwordHash = await this.hashPassword(body.password);
      user.displayName = body.displayName.trim();
      user.lastLoginAt = new Date();
    }

    const savedUser = await this.userRepository.save(user);

    let membership = await this.tenantUserRepository.findOne({
      where: {
        tenantId: invitation.tenantId,
        userId: savedUser.id
      }
    });

    if (!membership) {
      membership = await this.tenantUserRepository.save(
        this.tenantUserRepository.create({
          id: randomUUID(),
          tenantId: invitation.tenantId,
          userId: savedUser.id,
          roleKey: invitation.roleKey,
          permissionsJson: {}
        })
      );
    }

    invitation.status = "ACCEPTED";
    invitation.acceptedAt = new Date();
    await this.invitationRepository.save(invitation);

    return this.buildStaffAuthContext(savedUser, membership);
  }

  async requireCustomerApplication(applicationId: string) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId }
    });

    if (!application) {
      throw new ApiResourceNotFoundException("Application not found");
    }

    return application;
  }

  private buildStaffAuthContext(user: UserEntity, membership: TenantUserEntity, memberships?: TenantUserEntity[]): StaffAuthContext {
    const accessToken = this.issueStaffToken({
      userId: user.id,
      tenantId: membership.tenantId,
      roleKey: membership.roleKey
    });
    const knownMemberships = memberships ?? [membership];

    return {
      accessToken,
      tenantId: membership.tenantId,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: membership.roleKey,
        tenantId: membership.tenantId,
        tenants: knownMemberships.map((item) => ({
          tenantId: item.tenantId,
          role: item.roleKey
        }))
      }
    };
  }

  private issueStaffToken(payload: StaffTokenPayload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = this.signToken(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  private verifyStaffToken(token: string): StaffTokenPayload {
    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature || this.signToken(encodedPayload) !== signature) {
      throw new ApiUnauthorizedException("Invalid access token");
    }

    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<StaffTokenPayload>;

    if (!parsed.userId || !parsed.tenantId || !parsed.roleKey) {
      throw new ApiUnauthorizedException("Malformed access token");
    }

    return parsed as StaffTokenPayload;
  }

  private signToken(encodedPayload: string) {
    return createHmac("sha256", this.getTokenSecret()).update(encodedPayload).digest("base64url");
  }

  private getTokenSecret() {
    return process.env.API_TOKEN_SECRET ?? "dev-token-secret";
  }

  private extractBearerToken(authorizationHeader: string | undefined) {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      throw new ApiUnauthorizedException("Missing bearer token");
    }

    return authorizationHeader.slice("Bearer ".length);
  }
}
