import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Post, Put, Res, StreamableFile } from "@nestjs/common";

import { CreateDraftDto } from "./dto/create-draft.dto";
import { CustomerLoginDto } from "./dto/customer-login.dto";
import { PresignAttachmentDto } from "./dto/presign-attachment.dto";
import { SubmitApplicationDto } from "./dto/submit-application.dto";
import { UpdatePageDto } from "./dto/update-page.dto";
import { AuthService } from "./services/auth.service";
import { PublicApplicationsService } from "./services/public-applications.service";

@Controller("public")
export class PublicApplicationsController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
    @Inject(PublicApplicationsService)
    private readonly publicApplicationsService: PublicApplicationsService
  ) {}

  @Get("forms/:formId")
  getRuntime(@Param("formId", new ParseUUIDPipe()) formId: string) {
    return this.publicApplicationsService.getFormRuntime(formId);
  }

  @Post("forms/:formId/applications:draft")
  createDraft(@Param("formId", new ParseUUIDPipe()) formId: string, @Body() body: CreateDraftDto) {
    return this.publicApplicationsService.createDraft(formId, body);
  }

  @Put("applications/:applicationId/pages/:pageKey")
  updatePage(
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Param("pageKey") pageKey: string,
    @Body() body: UpdatePageDto
  ) {
    return this.publicApplicationsService.savePage(applicationId, pageKey, body);
  }

  @Get("applications/:applicationId/summary")
  getSummary(@Param("applicationId", new ParseUUIDPipe()) applicationId: string) {
    return this.publicApplicationsService.getSummary(applicationId);
  }

  @Post(["applications/:applicationId/attachments:presign", "applications/:applicationId/attachments\\:presign"])
  presignAttachment(
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Body() body: PresignAttachmentDto
  ) {
    return this.publicApplicationsService.presignAttachment(applicationId, body);
  }

  @Post(["applications/:applicationId/submit", "applications/:applicationId\\:submit"])
  submit(
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Body() body: SubmitApplicationDto
  ) {
    return this.publicApplicationsService.submit(applicationId, body);
  }

  @Post("auth/login")
  loginCustomer(@Body() body: CustomerLoginDto) {
    return this.authService.loginCustomer(body.trackingCode, body.password);
  }

  @Get("applications/:applicationId")
  getCustomerApplication(@Param("applicationId", new ParseUUIDPipe()) applicationId: string) {
    return this.publicApplicationsService.getCustomerApplication(applicationId);
  }

  @Get("applications/:applicationId/pdf")
  async getApplicationPdf(
    @Param("applicationId", new ParseUUIDPipe()) applicationId: string,
    @Res({ passthrough: true }) response: { setHeader(name: string, value: string): void }
  ) {
    const pdf = await this.publicApplicationsService.getApplicationPdf(applicationId);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="${applicationId}.pdf"`);
    return new StreamableFile(pdf);
  }
}
