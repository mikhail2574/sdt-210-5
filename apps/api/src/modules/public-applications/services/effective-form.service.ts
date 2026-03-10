import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { ApplicationEntity } from "../../../database/entities/application.entity";
import { FormDefinitionEntity } from "../../../database/entities/form-definition.entity";
import { FormOverrideEntity } from "../../../database/entities/form-override.entity";
import { ApiResourceNotFoundException, ApiTenantIsolationException } from "../errors/api-http.exceptions";
import { type FieldBlock, type FormOverrideOperation, type FormPage, type FormSchema } from "../form-schema.types";

type EffectiveFormContext = {
  publicForm: FormDefinitionEntity;
  effectiveSchema: FormSchema;
};

@Injectable()
export class EffectiveFormService {
  constructor(
    @InjectRepository(FormDefinitionEntity)
    private readonly formDefinitionRepository: Repository<FormDefinitionEntity>,
    @InjectRepository(FormOverrideEntity)
    private readonly formOverrideRepository: Repository<FormOverrideEntity>
  ) {}

  async resolveByPublicFormId(formId: string): Promise<EffectiveFormContext> {
    const publicForm = await this.formDefinitionRepository.findOne({
      where: {
        id: formId,
        isPublished: true
      }
    });

    if (!publicForm || !publicForm.tenantId) {
      throw new ApiResourceNotFoundException("Form not found");
    }

    return {
      publicForm,
      effectiveSchema: await this.buildEffectiveSchema(publicForm)
    };
  }

  async resolveByApplication(application: ApplicationEntity): Promise<EffectiveFormContext> {
    const publicForm = await this.formDefinitionRepository.findOne({
      where: {
        id: application.formId,
        isPublished: true
      }
    });

    if (!publicForm || !publicForm.tenantId) {
      throw new ApiResourceNotFoundException("Form not found");
    }

    if (application.tenantId !== publicForm.tenantId) {
      throw new ApiTenantIsolationException();
    }

    return {
      publicForm,
      effectiveSchema: await this.buildEffectiveSchema(publicForm)
    };
  }

  getPageOrThrow(schema: FormSchema, pageKey: string) {
    const page = schema.form.pages.find((pageItem) => pageItem.key === pageKey);

    if (!page) {
      throw new ApiResourceNotFoundException("Page not found");
    }

    return page;
  }

  getNextPageKey(schema: FormSchema, pageKey: string) {
    const pages = [...schema.form.pages].sort((left, right) => left.order - right.order);
    const currentIndex = pages.findIndex((pageItem) => pageItem.key === pageKey);

    if (currentIndex === -1 || currentIndex === pages.length - 1) {
      return pageKey;
    }

    return pages[currentIndex + 1].key;
  }

  private async buildEffectiveSchema(publicForm: FormDefinitionEntity): Promise<FormSchema> {
    const baseForm =
      (await this.formDefinitionRepository.findOne({
        where: {
          key: publicForm.key,
          tenantId: IsNull(),
          isPublished: true
        },
        order: {
          version: "DESC"
        }
      })) ?? publicForm;

    const baseSchema = this.cloneSchema((baseForm.schemaJson ?? publicForm.schemaJson) as FormSchema);
    const overrides = await this.formOverrideRepository.find({
      where: {
        tenantId: publicForm.tenantId!,
        baseFormId: baseForm.id
      }
    });

    return overrides.reduce((schema, override) => this.applyOperations(schema, override.operationsJson as FormOverrideOperation[]), baseSchema);
  }

  private applyOperations(schema: FormSchema, operations: FormOverrideOperation[]) {
    for (const operation of operations) {
      const field = this.findField(schema, operation.target.pageKey, operation.target.fieldId);

      if (!field) {
        continue;
      }

      if (operation.op === "updateRequirement") {
        field.requirement = operation.value;
        continue;
      }

      if (operation.op === "updateValidation") {
        field.validation = operation.value;
        continue;
      }

      if (operation.op === "updateVisibility") {
        field.visibleWhen = operation.value;
        continue;
      }

      if (operation.op === "updateOptions") {
        field.options = operation.value;
        continue;
      }

      if (operation.op === "updateField") {
        Object.assign(field, operation.value);
      }
    }

    return schema;
  }

  private findField(schema: FormSchema, pageKey: string, fieldId: string): FieldBlock | null {
    const page = schema.form.pages.find((pageItem) => pageItem.key === pageKey);

    if (!page) {
      return null;
    }

    for (const section of page.sections) {
      for (const block of section.blocks) {
        if (block.type === "field" && block.id === fieldId) {
          return block;
        }
      }
    }

    return null;
  }

  private cloneSchema(schema: FormSchema) {
    return JSON.parse(JSON.stringify(schema)) as FormSchema;
  }
}
