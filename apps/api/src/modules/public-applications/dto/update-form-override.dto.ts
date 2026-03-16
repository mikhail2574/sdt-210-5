import { type FormOverrideOperation } from "../form-schema.types";

export class UpdateFormOverrideDto {
  operations!: FormOverrideOperation[];
}
