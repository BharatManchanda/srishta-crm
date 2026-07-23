import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '../jwt/jwt.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify.dto';
import { EmailService } from '../email/email.service';
import { signupOtpTemplate } from '../email/templates/signup-otp.template';
import { forgotPasswordOtpTemplate } from '../email/templates/forgot-password-otp.template';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleService } from './google.service';
import { OtpPurpose, UserStatus, AuthProvider } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { LeadService } from '../lead/lead.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UserPolicy } from '../user/user.policy';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly googleService: GoogleService,
    private readonly leadService: LeadService,
    private readonly userHierarchyService: UserHierarchyService,
    private readonly userPolicy: UserPolicy,
    @InjectQueue('google-calendar-sync') private readonly calendarSyncQueue: Queue,
  ) { }

  private generateOtp(): string {
    if (process.env.NODE_ENV === 'production') {
      return Math.floor(1000 + Math.random() * 9000).toString();
    }
    return '123456';
  }
  async login(dto: LoginDto): Promise<any> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.email }],
      },
    });
    if (!existingUser) {
      throw new BadRequestException('Invalid credentials');
    }

    if (existingUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Account is deactivated');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, existingUser.password ?? "");
    console.log(isPasswordValid, "::isPasswordValid")
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const { password, accessTokens, refreshTokens, ...safeUser } = existingUser;

    const profileMedia: any[] = [];

    const { accessToken, refreshToken } =
      await this.jwtService.generateTokens(safeUser);
    return {
      user: {
        ...safeUser,
        profileMedia,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto, authUserId: number): Promise<any> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }],
      },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        parentId: authUserId,
        roleId: dto.roleId,
        status: dto.status,
        accessLevel: dto.accessLevel,
        phone: dto.phone,
        bio: dto.bio,
        country: dto.country,
        city: dto.city,
        pincode: dto.pincode,
        tax_id: dto.tax_id,
        facebookLink: dto.facebookLink,
        twitterLink: dto.twitterLink,
        linkdinLink: dto.linkdinLink,
        instagramLink: dto.instagramLink,
        websiteLink: dto.websiteLink,
      },
    });

    const { password: _, accessTokens, refreshTokens, ...safeUser } = user;
    await this.leadService.createDefaultLeadView(user.id);
    return {
      ...safeUser,
    };
  }

  async update(dto: UpdateUserDto, authUserId: number, userId: number): Promise<any> {
    console.log("Testing: ", dto)
    const familyUserIds = await this.userPolicy.getAccessibleUserIds(authUserId);
    if (!familyUserIds.includes(userId)) {
      throw new BadRequestException('User not found');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            id: userId,
          }
        ],
      },
    });
    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    const user = await this.prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name: dto.name,
        phone: dto.phone,
        bio: dto.bio,
        country: dto.country,
        city: dto.city,
        pincode: dto.pincode,
        tax_id: dto.tax_id,
        facebookLink: dto.facebookLink,
        twitterLink: dto.twitterLink,
        linkdinLink: dto.linkdinLink,
        instagramLink: dto.instagramLink,
        websiteLink: dto.websiteLink,
        ...(dto.roleId !== undefined ? { roleId: dto.roleId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.accessLevel !== undefined ? { accessLevel: dto.accessLevel } : {}),
      },
    });

    if (existingUser.accessLevel !== user.accessLevel) {
      await this.calendarSyncQueue.add('sync-access-level-change', {
        userId: user.id,
      });
    }

    const { password: _, accessTokens, refreshTokens, ...safeUser } = user;
    return {
      ...safeUser,
    };
  }

  async logout(userId: number, accessToken: string, refreshToken: string) {
    await this.jwtService.revokeTokens(userId, accessToken, refreshToken); // Revoke the user's tokens.
  }

  async sendOtp(dto: SendOtpDto) {
    const { email, purpose } = dto;

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
          isEmailVerified: true,
        },
      });
      if (user) {
        throw new BadRequestException('User with this email already exists and is verified');
      }
    } else if (purpose === OtpPurpose.FORGOT_PASSWORD) {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        throw new BadRequestException('User with this email does not exist');
      }
    }

    const otp = this.generateOtp();

    await this.prisma.otpVerification.deleteMany({
      where: {
        email,
        purpose,
      },
    });

    await this.prisma.otpVerification.create({
      data: {
        email,
        otp,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send Email based on purpose
    let subject = '';
    let bodyHtml = ``;

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      const template = signupOtpTemplate(otp, 10);
      subject = template.subject;
      bodyHtml = template.html;
    } else if (purpose === OtpPurpose.FORGOT_PASSWORD) {
      const template = forgotPasswordOtpTemplate(otp, 10);
      subject = template.subject;
      bodyHtml = template.html;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          message: 'OTP sent successfully',
        };
      }
      await this.emailService.sendEmail(email, subject, bodyHtml);
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new BadRequestException('Failed to send OTP email');
    }
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { name, password, confirmPassword, email, otp, purpose } = dto;
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        purpose,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      if (!name || !password || !confirmPassword) {
        throw new BadRequestException('Missing required fields');
      }
      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email },
          ],
        },
      });
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      let user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(password, 10),
          isEmailVerified: true,
          isSuperAdmin: true,
          status: 'ACTIVE',
        },
      });

      const ceoRole = await this.prisma.role.create({
        data: {
          name: 'CEO',
          description: 'CEO of the organization',
          createdById: user.id,
        },
      });

      const managerRole = await this.prisma.role.create({
        data: {
          name: 'Manager',
          description: 'Manager of the organization',
          createdById: user.id,
        },
      });

      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          roleId: ceoRole.id,
        },
      });

      const modules = await this.prisma.module.findMany();

      // CEO -> Full permissions
      await this.prisma.rolePermission.createMany({
        data: modules.map((module) => ({
          roleId: ceoRole.id,
          moduleId: module.id,
          isAllow: true,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        })),
      });

      // Manager -> No permissions
      await this.prisma.rolePermission.createMany({
        data: modules.map((module) => ({
          roleId: managerRole.id,
          moduleId: module.id,
          isAllow: false,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        })),
      });

      await this.prisma.otpVerification.deleteMany({
        where: {
          email,
          purpose,
        },
      });

      const { password: hashedPassword, accessTokens, refreshTokens, ...safeUser } = user;
      const { accessToken, refreshToken } = await this.jwtService.generateTokens(safeUser);
      return {
        user: {
          ...safeUser,
          profileMedia: [],
        },
        accessToken,
        refreshToken,
      };
    }

    await this.prisma.otpVerification.deleteMany({
      where: {
        email,
        purpose,
      },
    });
    return true;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { email, otp, password, confirmPassword } = dto;

    const record = await this.prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
        purpose: OtpPurpose.FORGOT_PASSWORD,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        provider: user.provider === AuthProvider.GOOGLE ? AuthProvider.BOTH : user.provider,
      },
    });

    await this.prisma.otpVerification.deleteMany({
      where: {
        email,
        purpose: OtpPurpose.FORGOT_PASSWORD,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }

  async googleLogin(idToken: string) {
    const payload = await this.googleService.verifyToken(idToken);

    if (!payload?.email) {
      throw new BadRequestException('Invalid Google Token');
    }

    let user = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (user) {
      // User exists. Link Google if needed and update provider to BOTH if it was LOCAL.
      const updates: any = {};
      if (!user.googleId) {
        updates.googleId = payload.sub;
      }
      if (user.provider === AuthProvider.LOCAL) {
        updates.provider = AuthProvider.BOTH;
      }
      if (Object.keys(updates).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else if (payload.name && payload.email && payload.sub) {
      // User doesn't exist. Create user automatically and log in.
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
          provider: AuthProvider.GOOGLE,
          isEmailVerified: true,
          isSuperAdmin: true,
          status: UserStatus.ACTIVE,
        },
      });

      // Create default roles and assign CEO role (similar to standard signup verifyOtp)
      const ceoRole = await this.prisma.role.create({
        data: {
          name: 'CEO',
          description: 'CEO of the organization',
          createdById: user.id,
        },
      });

      const managerRole = await this.prisma.role.create({
        data: {
          name: 'Manager',
          description: 'Manager of the organization',
          createdById: user.id,
        },
      });

      user = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          roleId: ceoRole.id,
        },
      });

      const modules = await this.prisma.module.findMany();

      // CEO -> Full permissions
      await this.prisma.rolePermission.createMany({
        data: modules.map((module) => ({
          roleId: ceoRole.id,
          moduleId: module.id,
          isAllow: true,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        })),
      });

      // Manager -> No permissions
      await this.prisma.rolePermission.createMany({
        data: modules.map((module) => ({
          roleId: managerRole.id,
          moduleId: module.id,
          isAllow: false,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
        })),
      });

      // Create default lead view
      await this.leadService.createDefaultLeadView(user.id);
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, accessTokens, refreshTokens, ...safeUser } = user;
    const { accessToken, refreshToken } = await this.jwtService.generateTokens(safeUser);

    return {
      accessToken,
      refreshToken,
      user: {
        ...safeUser,
      },
    };
  }

  async changePassword(dto: ChangePasswordDto, authUserId: number, userId: number) {
    const familyUserIds = await this.userHierarchyService.getFamilyUserIds(authUserId);

    if (!familyUserIds.includes(userId)) {
      throw new BadRequestException('User not found');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: await bcrypt.hash(dto.password, 10),
      },
    })
  }
}
