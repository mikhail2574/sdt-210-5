import { Body, Controller, Get, Headers, Inject, Param, ParseUUIDPipe, Post } from "@nestjs/common";

import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { StaffLoginDto } from "./dto/staff-login.dto";
import { AuthService } from "./services/auth.service";
import { BackofficeService } from "./services/backoffice.service";

@Controller()
export class BackofficeAuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(BackofficeService)
    private readonly backofficeService: BackofficeService
  ) {}

  @Post("auth/login")
  login(@Body() body: StaffLoginDto) {
    return this.authService.loginStaff(body.email, body.password);
  }

  @Post(["invitations/:inviteId/accept", "invitations/:inviteId\\:accept"])
  acceptInvitation(@Param("inviteId", new ParseUUIDPipe()) inviteId: string, @Body() body: AcceptInvitationDto) {
    return this.authService.acceptInvitation(inviteId, body);
  }

  @Get("me")
  getProfile(@Headers("authorization") authorizationHeader?: string) {
    return this.backofficeService.getProfile(authorizationHeader);
  }
}
