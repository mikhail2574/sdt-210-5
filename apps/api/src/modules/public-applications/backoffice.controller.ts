import { Body, Controller, Get, Headers, Inject, Param, ParseUUIDPipe, Patch, Post, Put, Query, Res, StreamableFile } from "@nestjs/common";

import { BackofficeService } from "./services/backoffice.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { ScheduleAppointmentDto } from "./dto/schedule-appointment.dto";
import { TransitionApplicationDto } from "./dto/transition-application.dto";
import { UpdateFormOverrideDto } from "./dto/update-form-override.dto";
import { UpdateStaffPageDto } from "./dto/update-staff-page.dto";
import { PublicApplicationsService } from "./services/public-applications.service";

@Controller("tenants/:tenantId")
export class BackofficeController {
  constructor(
    @Inject(BackofficeService)
    private readonly backofficeService: BackofficeService,
    @Inject(PublicApplicationsService)
    private readonly publicApplicationsService: PublicApplicationsService
  ) {}

  @Get("applications")
  listApplications(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Query() query: Record<string, string | undefined>
  ) {
    return this.backofficeService.listApplications(authorizationHeader, tenantId, query);
  }

  @Get("applications/:applicationId")
  getApplicationDetail(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string
  ) {
    return this.backofficeService.getApplicationDetail(authorizationHeader, tenantId, applicationId);
  }

  @Post(["applications/:applicationId/mark-read", "applications/:applicationId\\:markRead"])
  markRead(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string
  ) {
    return this.backofficeService.markRead(authorizationHeader, tenantId, applicationId);
  }

  @Patch("applications/:applicationId/pages/:pageKey")
  editPage(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Param("pageKey") pageKey: string,
    @Body() body: UpdateStaffPageDto
  ) {
    return this.backofficeService.editPage(authorizationHeader, tenantId, applicationId, pageKey, body);
  }

  @Get("applications/:applicationId/audit")
  getAudit(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string
  ) {
    return this.backofficeService.getAuditLog(authorizationHeader, tenantId, applicationId);
  }

  @Post(["applications/:applicationId/transition", "applications/:applicationId\\:transition"])
  transition(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Body() body: TransitionApplicationDto
  ) {
    return this.backofficeService.transitionStatus(authorizationHeader, tenantId, applicationId, body);
  }

  @Post("applications/:applicationId/appointment")
  scheduleAppointment(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Body() body: ScheduleAppointmentDto
  ) {
    return this.backofficeService.scheduleAppointment(authorizationHeader, tenantId, applicationId, body);
  }

  @Get("applications/:applicationId/pdf")
  async getApplicationPdf(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void }
  ) {
    await this.backofficeService.getApplicationDetail(authorizationHeader, tenantId, applicationId);
    const pdf = await this.publicApplicationsService.getApplicationPdf(applicationId);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="${applicationId}.pdf"`);
    return new StreamableFile(pdf);
  }

  @Get("notifications")
  getNotifications(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string
  ) {
    return this.backofficeService.listNotifications(authorizationHeader, tenantId);
  }

  @Get("invitations")
  listInvitations(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string
  ) {
    return this.backofficeService.listInvitations(authorizationHeader, tenantId);
  }

  @Post("invitations")
  createInvitation(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Body() body: CreateInvitationDto
  ) {
    return this.backofficeService.createInvitation(authorizationHeader, tenantId, body);
  }

  @Get("theme")
  getTheme(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string
  ) {
    return this.backofficeService.getTheme(authorizationHeader, tenantId);
  }

  @Put("theme")
  updateTheme(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.backofficeService.updateTheme(authorizationHeader, tenantId, body as never);
  }

  @Get("forms")
  listForms(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string
  ) {
    return this.backofficeService.listForms(authorizationHeader, tenantId);
  }

  @Get("forms/:formId/override")
  getFormOverride(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("formId", new ParseUUIDPipe()) formId: string
  ) {
    return this.backofficeService.getFormOverride(authorizationHeader, tenantId, formId);
  }

  @Put("forms/:formId/override")
  updateFormOverride(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Param("formId", new ParseUUIDPipe()) formId: string,
    @Body() body: UpdateFormOverrideDto
  ) {
    return this.backofficeService.updateFormOverride(authorizationHeader, tenantId, formId, body);
  }

  @Get("exports/applications.csv")
  async exportApplications(
    @Headers("authorization") authorizationHeader: string | undefined,
    @Param("tenantId", new ParseUUIDPipe()) tenantId: string,
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void }
  ) {
    const csv = await this.backofficeService.exportApplicationsCsv(authorizationHeader, tenantId);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", 'attachment; filename="applications.csv"');
    return new StreamableFile(Buffer.from(csv, "utf8"));
  }
}
