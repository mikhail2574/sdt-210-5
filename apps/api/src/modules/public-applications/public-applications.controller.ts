import { Body, Controller, Inject, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";

import { CreateDraftDto } from "./dto/create-draft.dto";
import { UpdatePageDto } from "./dto/update-page.dto";
import { PublicApplicationsService } from "./services/public-applications.service";

@Controller("public")
export class PublicApplicationsController {
  constructor(
    @Inject(PublicApplicationsService)
    private readonly publicApplicationsService: PublicApplicationsService
  ) {}

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
}
